import { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { ArrowRight, ArrowLeft } from 'lucide-react-native'
import { useTheme } from '../context/ThemeContext'
import { useAppSettings } from '../context/AppSettingsContext'

const KEYS = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
]

// Press-and-hold backspace: after the hold delay, deleting repeats at the repeat interval.
const BACKSPACE_HOLD_DELAY_MS = 350
const BACKSPACE_REPEAT_INTERVAL_MS = 80

// On-screen a-z keyboard for typed answers. After submitting (showAnswer) it shows "Correct!", or
// the typed text struck through next to the right answer.
const QuizInputKeyboard = ({ onSubmit, showAnswer, correctAnswerText, isCorrect }) => {
    const { theme } = useTheme()
    const { hapticsEnabled } = useAppSettings()
    const [input, setInput] = useState('')

    // Backspace-hold timers in refs (not state) so starting/stopping doesn't re-render mid-press.
    const holdDelayRef = useRef(null)
    const holdIntervalRef = useRef(null)

    // Light selection haptic on each keypress. Respects the Haptics toggle; no-op on web.
    const tick = useCallback(() => {
        if (hapticsEnabled) Haptics.selectionAsync().catch(() => {})
    }, [hapticsEnabled])

    // Reset input when the question changes (showAnswer true -> false).
    useEffect(() => {
        if (!showAnswer) setInput('')
    }, [showAnswer])

    const stopBackspaceHold = useCallback(() => {
        if (holdDelayRef.current) clearTimeout(holdDelayRef.current)
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current)
        holdDelayRef.current = null
        holdIntervalRef.current = null
    }, [])

    // Clear hold timers on unmount or when the answer is revealed mid-hold.
    useEffect(() => stopBackspaceHold, [stopBackspaceHold])
    useEffect(() => {
        if (showAnswer) stopBackspaceHold()
    }, [showAnswer, stopBackspaceHold])

    const handlePress = (key) => {
        if (showAnswer) return
        tick()
        setInput(prev => prev + key)
    }

    const deleteOne = useCallback(() => {
        tick()
        setInput(prev => prev.slice(0, -1))
    }, [tick])

    const handleBackspacePressIn = () => {
        if (showAnswer) return
        deleteOne() // immediate first delete
        holdDelayRef.current = setTimeout(() => {
            holdIntervalRef.current = setInterval(deleteOne, BACKSPACE_REPEAT_INTERVAL_MS)
        }, BACKSPACE_HOLD_DELAY_MS)
    }

    const handleSubmit = () => {
        if (showAnswer) return
        // Ignore empty submits so an accidental tap doesn't count as a wrong answer.
        if (!input.trim()) return
        tick()
        onSubmit(input.trim())
    }

    return (
        <View style={styles.container}>
            {/* --- Typed text + backspace --- */}
            <View style={styles.displayContainer}>
                <View style={[styles.inputField, { borderColor: theme.text }]}>
                    <Text style={[styles.inputText, { color: theme.title }]}>
                        {input}
                    </Text>
                </View>

                {/* Hold to keep deleting */}
                <Pressable
                    style={({ pressed }) => [
                        styles.backspaceBtn,
                        { backgroundColor: pressed ? theme.primary : '#333' },
                    ]}
                    onPressIn={handleBackspacePressIn}
                    onPressOut={stopBackspaceHold}
                    hitSlop={8}
                    accessibilityLabel="Backspace"
                    accessibilityRole="button"
                >
                    <ArrowLeft size={24} color="#fff" />
                </Pressable>
            </View>

            {/* --- Feedback (only after submitting) --- */}
            {showAnswer && (
                <Animated.View entering={FadeInDown.duration(200)} style={styles.feedbackContainer}>
                    {isCorrect ? (
                        <Text style={[styles.feedbackText, { color: theme.success }]}>Correct!</Text>
                    ) : (
                        <View style={styles.wrongRow}>
                            <Text style={[styles.feedbackText, styles.wrongInput, { color: theme.error }]}>
                                {input}
                            </Text>
                            <Text style={[styles.feedbackText, { color: theme.success }]}>
                                {correctAnswerText}
                            </Text>
                        </View>
                    )}
                </Animated.View>
            )}

            {/* --- Keyboard rows --- */}
            <View style={styles.keyboardContainer}>
                {KEYS.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.row}>
                        {row.map((char) => (
                            <Pressable
                                key={char}
                                style={({ pressed }) => [
                                    styles.key,
                                    pressed && { backgroundColor: theme.primary },
                                ]}
                                onPress={() => handlePress(char)}
                                disabled={showAnswer}
                                hitSlop={{ top: 8, bottom: 8, left: 2, right: 2 }}
                                accessibilityLabel={char}
                                accessibilityRole="button"
                            >
                                {({ pressed }) => (
                                    <Text style={[styles.keyText, { color: pressed ? '#000' : theme.text }]}>
                                        {char}
                                    </Text>
                                )}
                            </Pressable>
                        ))}
                    </View>
                ))}
                <View style={styles.row}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.spaceKey,
                            { borderColor: theme.text },
                            pressed && { backgroundColor: theme.primary, borderColor: theme.primary },
                        ]}
                        onPress={() => handlePress(' ')}
                        disabled={showAnswer}
                        accessibilityLabel="Space"
                        accessibilityRole="button"
                    >
                        <Text style={[styles.keyText, { color: theme.text }]}>space</Text>
                    </Pressable>
                </View>
            </View>

            {/* --- Submit button --- */}
            <Pressable
                style={({ pressed }) => [
                    styles.submitBtn,
                    { backgroundColor: pressed ? theme.primary : '#333' },
                ]}
                onPress={handleSubmit}
                disabled={showAnswer}
                accessibilityLabel="Submit answer"
                accessibilityRole="button"
            >
                <ArrowRight size={32} color="#fff" />
            </Pressable>
        </View>
    )
}

export default QuizInputKeyboard

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
    },
    // --- Typed text + backspace ---
    displayContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        width: '80%',
        gap: 16,
    },
    inputField: {
        flex: 1,
        minWidth: 120,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 2,
        paddingHorizontal: 16,
    },
    inputText: {
        fontSize: 32,
        fontWeight: '600',
        textAlign: 'center',
    },
    backspaceBtn: {
        padding: 12,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // --- Feedback ---
    feedbackContainer: {
        position: 'absolute',
        top: -52, // floats above the typed text
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 15,
        zIndex: 10,
    },
    feedbackText: {
        fontSize: 26,
        fontWeight: 'bold',
    },
    wrongRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    wrongInput: {
        textDecorationLine: 'line-through',
        marginRight: 10,
    },
    // --- Keyboard ---
    keyboardContainer: {
        width: '100%',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 10,
    },
    key: {
        width: '9%', // fits 10 keys per row
        height: 40, // fixed, so wide screens don't get a taller keyboard
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 1,
        borderRadius: 8,
    },
    keyText: {
        fontSize: 25,
        fontWeight: '500',
        textTransform: 'lowercase',
    },
    spaceKey: {
        width: '50%',
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 10,
        marginTop: 4,
    },
    submitBtn: {
        width: '90%',
        height: 70, // fixed px, not %, so it resolves under the scrollable parent
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
})
