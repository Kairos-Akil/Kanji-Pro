import { createContext, useContext, useMemo, useRef } from 'react'
import { usePersistedState } from '../hooks/usePersistedState'

const ProgressContext = createContext(null)
// Same API with a stable identity: consumers of this one (e.g. HomePage) read progress on demand.
const ProgressActionsContext = createContext(null)
// Rarely-changing bits (streak count, initial-load flag), so consumers re-render only when these
// actually change. Once on the initial storage load, then at most once a day.
const ProgressMetaContext = createContext({ streakCount: 0, progressLoaded: false })

const STORAGE_KEY = 'KANJI_PRO_PROGRESS_V1'
const STREAK_STORAGE_KEY = 'KANJI_PRO_STREAK_V1'

// Local (not UTC) YYYY-MM-DD, so the streak's "day" boundary matches the device's clock.
const getLocalDateString = (date = new Date()) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

const isYesterday = (dateStr, todayStr) => {
    const d = new Date(`${dateStr}T00:00:00`)
    d.setDate(d.getDate() + 1)
    return getLocalDateString(d) === todayStr
}

export const ProgressProvider = ({ children }) => {
    // Shape: { [quizId]: { [itemId]: starCount } }, e.g. { hiraganaBasic: { 'あ': 3, 'い': 1 } }.
    const [progress, setProgress, progressLoaded] = usePersistedState(STORAGE_KEY, {})
    const [streak, setStreak] = usePersistedState(STREAK_STORAGE_KEY, { count: 0, lastActiveDate: null })

    // Ref mirrors the latest progress so the stable actions can read it without their consumers
    // subscribing to every change.
    const progressRef = useRef(progress)
    progressRef.current = progress

    // Created once: the setState functions are stable and live values are read through the refs.
    const actions = useMemo(() => {
        // Count today as practiced: extend the streak if the last active day was yesterday, reset
        // to 1 on a gap, or leave it if today is already recorded.
        const recordActivity = () => {
            setStreak(prev => {
                const today = getLocalDateString()
                if (prev.lastActiveDate === today) return prev
                if (prev.lastActiveDate && isYesterday(prev.lastActiveDate, today)) {
                    return { count: prev.count + 1, lastActiveDate: today }
                }
                return { count: 1, lastActiveDate: today }
            })
        }

        return {
            incrementItem: (quizId, itemId, maxStars) => {
                setProgress(prev => ({
                    ...prev,
                    [quizId]: {
                        ...prev[quizId],
                        [itemId]: Math.min((prev[quizId]?.[itemId] ?? 0) + 1, maxStars),
                    },
                }))
                recordActivity()
            },
            decrementItem: (quizId, itemId) => {
                setProgress(prev => ({
                    ...prev,
                    [quizId]: {
                        ...prev[quizId],
                        [itemId]: Math.max((prev[quizId]?.[itemId] ?? 0) - 1, 0),
                    },
                }))
                recordActivity()
            },
            getProgressForQuiz: (quizId) => progressRef.current[quizId] ?? {},
            getLearnedCount: (quizId, itemIds, maxStars) => {
                const quizProgress = progressRef.current[quizId] ?? {}
                return itemIds.filter(id => (quizProgress[id] ?? 0) >= maxStars).length
            },
            resetProgress: () => setProgress({}),
        }
        // setProgress/setStreak are stable useState setters; the refs cover the live values.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const meta = useMemo(
        () => ({ streakCount: streak.count, progressLoaded }),
        [streak.count, progressLoaded]
    )

    return (
        <ProgressActionsContext.Provider value={actions}>
            <ProgressMetaContext.Provider value={meta}>
                {/* Live context: a fresh value per change, so quiz screens re-render with new stars. */}
                <ProgressContext.Provider
                    value={{
                        ...actions,
                        progress,
                        streakCount: streak.count,
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
