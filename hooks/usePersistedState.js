import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Saves are debounced: bursts of changes (e.g. rapid quiz answers) would otherwise serialize and
// write the whole value once per change, on the JS thread, in the middle of the answer feedback.
const SAVE_DEBOUNCE_MS = 500

// Like useState, but loads its initial value from AsyncStorage on mount and re-saves on change.
// Defaults to JSON (de)serialization; override serialize/deserialize only when the stored format
// must stay non-JSON (e.g. an already-shipped plain string).
export const usePersistedState = (key, defaultValue, { serialize = JSON.stringify, deserialize = JSON.parse } = {}) => {
    const [value, setValue] = useState(defaultValue)
    // isLoaded (third return value) lets callers tell the default apart from the stored value.
    const [isLoaded, setIsLoaded] = useState(false)
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

    useEffect(() => {
        AsyncStorage.getItem(key)
            .then(raw => {
                if (raw !== null) setValue(deserialize(raw))
            })
            .catch(err => console.warn(`Failed to load persisted state for "${key}":`, err))
            .finally(() => {
                hasLoaded.current = true
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

    return [value, setValue, isLoaded]
}
