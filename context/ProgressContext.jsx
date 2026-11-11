import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AppState } from 'react-native'
import { usePersistedState } from '../hooks/usePersistedState'
import { getLocalDateString, recordDay, displayedStreak } from '../utils/streak'
import { afterCorrect, afterWrong, isMastered } from '../utils/mastery'

const ProgressContext = createContext(null)
// Same API with a stable identity: consumers of this one (e.g. HomePage) read progress on demand.
const ProgressActionsContext = createContext(null)
// Rarely-changing bits (streak count, initial-load flag), so consumers re-render only when these
// actually change. Once on the initial storage load, then at most once a day.
const ProgressMetaContext = createContext({ streakCount: 0, progressLoaded: false })

const STORAGE_KEY = 'KANJI_PRO_PROGRESS_V1'
const STREAK_STORAGE_KEY = 'KANJI_PRO_STREAK_V1'

export const ProgressProvider = ({ children }) => {
    // Shape: { [quizId]: { [itemId]: starCount } }, e.g. { hiraganaBasic: { 'あ': 3, 'い': 8 } }.
    // What the numbers mean (mastered at 6, "+N" above it) is defined in utils/mastery.js.
    const [progress, setProgress, progressLoaded] = usePersistedState(STORAGE_KEY, {})
    const [streak, setStreak] = usePersistedState(STREAK_STORAGE_KEY, { count: 0, lastActiveDate: null })

    // Ref mirrors the latest progress so the stable actions can read it without their consumers
    // subscribing to every change.
    const progressRef = useRef(progress)
    progressRef.current = progress

    // Created once: the setState functions are stable and live values are read through the refs.
    const actions = useMemo(() => {
        // Count today as practiced (see recordDay in utils/streak.js).
        const recordActivity = () => {
            setStreak(prev => recordDay(prev, getLocalDateString()))
        }

        return {
            incrementItem: (quizId, itemId) => {
                setProgress(prev => ({
                    ...prev,
                    [quizId]: {
                        ...prev[quizId],
                        [itemId]: afterCorrect(prev[quizId]?.[itemId] ?? 0),
                    },
                }))
                recordActivity()
            },
            decrementItem: (quizId, itemId) => {
                setProgress(prev => ({
                    ...prev,
                    [quizId]: {
                        ...prev[quizId],
                        [itemId]: afterWrong(prev[quizId]?.[itemId] ?? 0),
                    },
                }))
                recordActivity()
            },
            getProgressForQuiz: (quizId) => progressRef.current[quizId] ?? {},
            getLearnedCount: (quizId, itemIds) => {
                const quizProgress = progressRef.current[quizId] ?? {}
                return itemIds.filter(id => isMastered(quizProgress[id] ?? 0)).length
            },
            resetProgress: () => setProgress({}),
        }
        // setProgress/setStreak are stable useState setters; the refs cover the live values.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Re-render at midnight (app left open) and when the app comes back
    // to the foreground. setDay with an unchanged day is a no-op, so this costs nothing otherwise.
    const [, setDay] = useState(getLocalDateString)
    useEffect(() => {
        let midnightTimer = null
        const refreshDay = () => {
            setDay(getLocalDateString())
            clearTimeout(midnightTimer)
            const now = new Date()
            const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
            midnightTimer = setTimeout(refreshDay, nextMidnight - now + 1000)
        }
        refreshDay()
        const sub = AppState.addEventListener('change', state => {
            if (state === 'active') refreshDay()
        })
        return () => { clearTimeout(midnightTimer); sub.remove() }
    }, [])

    // A broken streak shows 0 (see displayedStreak). The date is read fresh on every render (not
    // from the state above), so practicing across midnight stays right.
    const streakCount = displayedStreak(streak, getLocalDateString())

    const meta = useMemo(
        () => ({ streakCount, progressLoaded }),
        [streakCount, progressLoaded]
    )

    return (
        <ProgressActionsContext.Provider value={actions}>
            <ProgressMetaContext.Provider value={meta}>
                {/* Live context: a fresh value per change, so quiz screens re-render with new stars. */}
                <ProgressContext.Provider
                    value={{
                        ...actions,
                        progress,
                        streakCount,
                    }}
                >
                    {children}
                </ProgressContext.Provider>
            </ProgressMetaContext.Provider>
        </ProgressActionsContext.Provider>
    )
}

export const useProgress = () => {
    const ctx = useContext(ProgressContext)
    if (!ctx) {
        throw new Error('useProgress must be used inside ProgressProvider')
    }
    return ctx
}

// Stable-identity variant: never causes re-renders; values are fetched at call time. For screens
// that only need progress when focused (e.g. HomePage), not live per answer.
export const useProgressActions = () => {
    const ctx = useContext(ProgressActionsContext)
    if (!ctx) {
        throw new Error('useProgressActions must be used inside ProgressProvider')
    }
    return ctx
}

// Streak count + whether the persisted progress finished its initial load. Cheap to consume:
// re-renders only when one of the two actually changes.
export const useProgressMeta = () => useContext(ProgressMetaContext)
