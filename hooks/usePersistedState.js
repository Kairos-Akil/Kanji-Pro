import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Saves are debounced: bursts of changes (e.g. rapid quiz answers) would otherwise serialize and
// write the whole value once per change, on the JS thread, in the middle of the answer feedback.
const SAVE_DEBOUNCE_MS = 500

// A failed read is tried once more after this pause, so a one-off storage hiccup at launch doesn't
// leave the whole session unable to save.
const RETRY_DELAY_MS = 300

const readWithRetry = (key) => AsyncStorage.getItem(key).catch(() =>
    new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS)).then(() => AsyncStorage.getItem(key)))

// Like useState, but loads its initial value from AsyncStorage on mount and re-saves on change.
// Defaults to JSON (de)serialization; override serialize/deserialize only when the stored format
// must stay non-JSON (e.g. an already-shipped plain string).
export const usePersistedState = (key, defaultValue, { serialize = JSON.stringify, deserialize = JSON.parse } = {}) => {
    const [value, setValue] = useState(defaultValue)
    // isLoaded (third return value): the first read has finished, successfully or not, so callers
    // waiting on it (e.g. the splash screen) never wait forever.
    const [isLoaded, setIsLoaded] = useState(false)
    // loadFailed (fourth return value): reading failed even after the retry, so this session won't
    // save. Lets callers tell the user instead of silently dropping their changes.
    const [loadFailed, setLoadFailed] = useState(false)
    // Saving is allowed: set only after a *successful* read (unlike isLoaded).
    const hasLoaded = useRef(false)
    const saveTimer = useRef(null)
    // The debounced write waiting to run, if any. Kept so it can also be flushed early.
    const pendingSave = useRef(null)

    // Refs only, so this is stable for the AppState listener below.
    const flushPendingSave = useCallback(() => {
        clearTimeout(saveTimer.current)
        const save = pendingSave.current
        pendingSave.current = null
        save?.()
    }, [])

    // Saving only starts after a successful read, so the default can never overwrite stored data
    // that merely failed to load.
    useEffect(() => {
        readWithRetry(key)
            .then(raw => {
                if (raw !== null) {
                    try {
                        setValue(deserialize(raw))
                    } catch (err) {
                        // Corrupt value: keep a copy, then start fresh. Staying read-only here would
                        // block saving on every future launch.
                        console.warn(`Unreadable persisted state for "${key}", backed up and reset:`, err)
                        AsyncStorage.setItem(`${key}_CORRUPT_BACKUP`, raw).catch(() => {})
                    }
                }
                hasLoaded.current = true
                setIsLoaded(true)
            })
            // Storage itself failed (twice): what's stored is unknown, so saving stays off this
            // session rather than risk overwriting it with the default.
            .catch(err => {
                console.warn(`Failed to load persisted state for "${key}":`, err)
                setLoadFailed(true)
                setIsLoaded(true)
            })
        // `key` only: serialize/deserialize are stable per call site, and inline functions in
        // deps would re-run this (and re-read storage) every render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key])

    useEffect(() => {
        // Skip the first run so storage isn't overwritten with defaultValue before the load resolves.
        if (!hasLoaded.current) return
        // No unmount cleanup: callers are app-lifetime providers, and clearing the timer on
        // unmount would silently drop the final pending write.
        clearTimeout(saveTimer.current)
        pendingSave.current = () => AsyncStorage.setItem(key, serialize(value))
            .catch(err => console.warn(`Failed to persist state for "${key}":`, err))
        saveTimer.current = setTimeout(flushPendingSave, SAVE_DEBOUNCE_MS)
        // serialize excluded for the same reason as above.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, value])

    // Write immediately when the app leaves the foreground, so swiping it away right after an
    // answer can't drop the last change still waiting out the debounce.
    useEffect(() => {
        const sub = AppState.addEventListener('change', state => {
            if (state !== 'active') flushPendingSave()
        })
        return () => sub.remove()
    }, [flushPendingSave])

    return [value, setValue, isLoaded, loadFailed]
}
