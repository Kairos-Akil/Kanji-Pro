import { useEffect, useRef, useState } from 'react'
import {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    interpolateColor,
} from 'react-native-reanimated'
import { useTheme } from '../context/ThemeContext'

// Leaves the focused tile this far below the top of the scroll view.
const SCROLL_OFFSET = 90
// Poll until the tile exists — FlatList renders progressively, so far-down tiles mount late.
const POLL_INTERVAL_MS = 150
const MAX_WAIT_MS = 8000

// Scrolls a preview grid to the tile matching `focusValue` (a search result) and glows it briefly.
export const useFocusHighlight = (focusValue) => {
    const { theme } = useTheme()
    const scrollRef = useRef(null)
    const contentRef = useRef(null)
    const targetRef = useRef(null)
    const glow = useSharedValue(0)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!focusValue) return

        let cancelled = false
        let timer = null
        const startedAt = Date.now()
        setLoading(true)

        const stop = () => {
            if (!cancelled) setLoading(false)
        }

        const retry = () => {
            if (cancelled) return
            if (Date.now() - startedAt < MAX_WAIT_MS) {
                timer = setTimeout(attempt, POLL_INTERVAL_MS)
            } else {
                stop() // gave up waiting for the tile to render
            }
        }

        const attempt = () => {
            if (cancelled) return
            const target = targetRef.current
            const scroll = scrollRef.current
            const content = contentRef.current
            // Tile not rendered yet (or refs not ready) — wait and try again.
            if (!target || !scroll || !content) return retry()

            target.measureLayout(
                content,
                (x, y) => {
                    if (cancelled) return
                    stop()
                    scroll.scrollTo({ y: Math.max(y - SCROLL_OFFSET, 0), animated: true })
                    glow.value = withSequence(
                        withTiming(1, { duration: 250 }),
                        withTiming(1, { duration: 550 }),
                        withTiming(0, { duration: 800 }),
                    )
                },
                retry,
            )
        }

        timer = setTimeout(attempt, POLL_INTERVAL_MS)
        return () => { cancelled = true; clearTimeout(timer) }
        // glow is a stable shared value; only a new focusValue should re-run this.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focusValue])

    // At rest the border matches the tile color (invisible); it lights up to primary at the peak.
    const highlightStyle = useAnimatedStyle(() => ({
        borderWidth: 3,
        borderColor: interpolateColor(glow.value, [0, 1], [theme.tile, theme.primary]),
        backgroundColor: interpolateColor(glow.value, [0, 1], [theme.tile, theme.primary + '33']),
    }))

    return { scrollRef, contentRef, targetRef, highlightStyle, loading }
}
