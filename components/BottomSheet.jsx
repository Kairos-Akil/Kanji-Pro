import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable } from 'react-native'
import { useEffect, useState } from 'react'
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
    Easing,
} from 'react-native-reanimated'
import { X } from 'lucide-react-native'
import { useTheme } from '../context/ThemeContext'
import Spacer from './Spacer'

// Reusable bottom-sheet shell (backdrop + slide-up sheet + header) for the settings/info modals.
//
// The slide is a manual translateY, not Reanimated's entering/exiting animations: those measure
// the sheet inside the Modal's native window, which is unreliable in a release APK on Android's
// new architecture (the sheet settled too high on the second open).
const BottomSheet = ({ isVisible, onClose, title, heightPercent = '50%', children }) => {
    const { theme } = useTheme()

    // Keep the Modal mounted until the slide-down finishes.
    const [rendered, setRendered] = useState(isVisible)

    // 0 = open, 1 = one sheet-height below the fold (multiplied by the measured height).
    const progress = useSharedValue(1)
    const sheetHeight = useSharedValue(1000) // generous fallback until the first onLayout
    const backdropOpacity = useSharedValue(0)

    useEffect(() => {
        if (isVisible) {
            setRendered(true)
            backdropOpacity.value = withTiming(1, { duration: 200 })
            progress.value = withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) })
        } else {
            backdropOpacity.value = withTiming(0, { duration: 200 })
            progress.value = withTiming(
                1,
                { duration: 260, easing: Easing.in(Easing.cubic) },
                (finished) => {
                    if (finished) runOnJS(setRendered)(false)
                }
            )
        }
        // Shared values and setRendered are stable; only isVisible drives this.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVisible])

    const sheetStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: progress.value * sheetHeight.value }],
    }))

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
    }))

    if (!rendered) return null

    return (
        <Modal
            transparent={true}
            visible={rendered}
            animationType="none" // We drive the slide/fade ourselves with Reanimated
            onRequestClose={onClose}
        >
            <View style={styles.overlayContainer}>
                {/* Dark Backdrop (fades in/out) */}
                <Animated.View style={[styles.backdrop, backdropStyle]}>
                    <Pressable style={{ flex: 1 }} onPress={onClose} />
                </Animated.View>

                {/* Bottom Sheet (slides up from the bottom) */}
                <Animated.View
                    onLayout={(e) => { sheetHeight.value = e.nativeEvent.layout.height }}
                    style={[styles.sheet, sheetStyle, { height: heightPercent, backgroundColor: theme.background, borderColor: theme.text }]}
                >
                    <View style={[styles.handleBar, { backgroundColor: theme.inactive }]} />

                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.title }]}>{title}</Text>
                        <TouchableOpacity
                            onPress={onClose}
                            hitSlop={10}
                            accessibilityLabel={`Close ${title.toLowerCase()}`}
                            accessibilityRole="button"
                        >
                            <X size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <Spacer height={10} />

                    {children}
                </Animated.View>
            </View>
        </Modal>
    )
}

export default BottomSheet

const styles = StyleSheet.create({
    overlayContainer: {
        flex: 1,
        justifyContent: 'flex-end', // This aligns the Sheet to the bottom
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)', // Darken background
    },
    sheet: {
        width: '100%',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        paddingTop: 10,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    handleBar: {
        width: 40,
        height: 5,
        borderRadius: 10,
        alignSelf: 'center',
        marginBottom: 20,
        marginTop: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
    },
})
