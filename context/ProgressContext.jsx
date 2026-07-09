import { createContext, useContext } from 'react'
import { usePersistedState } from '../hooks/usePersistedState'

const ProgressContext = createContext(null)

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
    const [progress, setProgress] = usePersistedState(STORAGE_KEY, {})
    const [streak, setStreak] = usePersistedState(STREAK_STORAGE_KEY, { count: 0, lastActiveDate: null })

    // Count today as practiced: extend the streak if the last active day was yesterday, reset to 1
    // on a gap, or leave it if today is already recorded.
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

    const incrementItem = (quizId, itemId, maxStars) => {
        setProgress(prev => ({
            ...prev,
            [quizId]: {
                ...prev[quizId],
                [itemId]: Math.min((prev[quizId]?.[itemId] ?? 0) + 1, maxStars),
            },
        }))
        recordActivity()
    }

    const decrementItem = (quizId, itemId) => {
        setProgress(prev => ({
            ...prev,
            [quizId]: {
                ...prev[quizId],
                [itemId]: Math.max((prev[quizId]?.[itemId] ?? 0) - 1, 0),
            },
        }))
        recordActivity()
    }

    const getProgressForQuiz = (quizId) => {
        return progress[quizId] ?? {}
    }

    const getLearnedCount = (quizId, itemIds, maxStars) => {
        const quizProgress = progress[quizId] ?? {}
        return itemIds.filter(id => (quizProgress[id] ?? 0) >= maxStars).length
    }

    const resetProgress = () => {
        setProgress({})
    }

    return (
        <ProgressContext.Provider
            value={{
                progress,
                incrementItem,
                decrementItem,
                getProgressForQuiz,
                getLearnedCount,
                resetProgress,
                streakCount: streak.count,
            }}
        >
            {children}
        </ProgressContext.Provider>
    )
}

export const useProgress = () => {
    const ctx = useContext(ProgressContext)
    if (!ctx) {
        throw new Error('useProgress must be used inside ProgressProvider')
    }
    return ctx
}
