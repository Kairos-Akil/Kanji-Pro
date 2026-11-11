import { useCallback, useEffect, useRef } from 'react'
import { useFocusEffect } from 'expo-router'

// After this long the lock opens anyway, in case a navigation never leaves the screen.
const UNLOCK_AFTER_MS = 1000

// Wraps navigation taps so a double tap navigates only once. On a phone both taps of a double tap
// land on the button before the next screen covers it, so `router.push` ran twice and stacked two
// copies of the screen (two quizzes, and an extra back press to leave). The lock opens when this
// screen is focused again, or after UNLOCK_AFTER_MS.
export const useNavigateOnce = () => {
    const lockedRef = useRef(false)
    const timerRef = useRef(null)

    useFocusEffect(useCallback(() => {
        lockedRef.current = false
    }, []))
    useEffect(() => () => clearTimeout(timerRef.current), [])

    return useCallback((navigate) => {
        if (lockedRef.current) return
        lockedRef.current = true
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => { lockedRef.current = false }, UNLOCK_AFTER_MS)
        navigate()
    }, [])
}
