import { useCallback, useEffect, useRef, useState } from 'react'
import {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    interpolateColor,
} from 'react-native-reanimated'
import { useTheme } from '../context/ThemeContext'

// Leaves the focused row this far below the top of the list.
const SCROLL_OFFSET = 90
// A row far down isn't measured yet on the first try: the list then jumps to an estimate, renders
// the rows there, and we retry until scrollToIndex succeeds.
const RETRY_MS = 100
const MAX_ATTEMPTS = 30
// After a jump to an estimate, the target row's real position is known a moment later.
const SETTLE_MS = 300

// Scrolls a PreviewGrid's list to `targetRow` (the row holding the search result `focusValue`)
// and glows the focused tile.
export const useFocusHighlight = (focusValue, targetRow) => {
    const { theme } = useTheme()
    const listRef = useRef(null)
    const failedRef = useRef(false)
    const glow = useSharedValue(0)
    const [loading, setLoading] = useState(false)

    // FlatList calls this from inside scrollToIndex when the row hasn't been measured yet. Jumping
    // to the estimated offset makes the list render (and measure) the rows around it.
    const onScrollToIndexFailed = useCallback((info) => {
        failedRef.current = true
        listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false })
    }, [])

    useEffect(() => {
        if (!focusValue || targetRow < 0) return

        let cancelled = false
        let timer = null
        setLoading(true)

        const scrollToTarget = () => {
            failedRef.current = false
            listRef.current?.scrollToIndex({ index: targetRow, viewOffset: SCROLL_OFFSET, animated: true })
            return Boolean(listRef.current) && !failedRef.current
        }

        const attempt = (n) => {
            if (cancelled) return
            if (!scrollToTarget()) {
                if (n < MAX_ATTEMPTS) timer = setTimeout(() => attempt(n + 1), RETRY_MS)
                else setLoading(false) // gave up; the user can still scroll there themselves
                return
            }

            setLoading(false)
            glow.value = withSequence(
                withTiming(1, { duration: 250 }),
                withTiming(1, { duration: 550 }),
                withTiming(0, { duration: 800 }),
            )
            // Landed via an estimate: scroll once more now that the row's real position is known.
            if (n > 0) timer = setTimeout(() => { if (!cancelled) scrollToTarget() }, SETTLE_MS)
        }

        timer = setTimeout(() => attempt(0), RETRY_MS)
        return () => { cancelled = true; clearTimeout(timer) }
        // glow is a stable shared value; only a new search target should re-run this.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focusValue, targetRow])

    // At rest the border matches the tile color (invisible); it lights up to primary at the peak.
    const highlightStyle = useAnimatedStyle(() => ({
        borderWidth: 3,
        borderColor: interpolateColor(glow.value, [0, 1], [theme.tile, theme.primary]),
        backgroundColor: interpolateColor(glow.value, [0, 1], [theme.tile, theme.primary + '33']),
    }))

    return { listRef, onScrollToIndexFailed, highlightStyle, loading }
}
