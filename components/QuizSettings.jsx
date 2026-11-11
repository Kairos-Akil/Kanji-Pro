import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { MousePointerClick, Keyboard, Save, Shuffle, BookOpen, MessageCircle, GraduationCap, Ban, Info } from 'lucide-react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTheme } from '../context/ThemeContext'
import BottomSheet from './BottomSheet'
import SegmentedToggle from './SegmentedToggle'
import Spacer from './Spacer'

const SETTINGS_KEYS = {
    INPUT_MODE: 'quiz_input_mode',
    QUIZ_CONTENT: 'quiz_content',
    LEARNING_MODE: 'quiz_learning_mode',
}

export const DEFAULT_INPUT_MODE = 'choice'

// What kanji quizzes ask about (matches the `group` field of KANJI_QUESTION_MODES, plus 'mixed').
// Kana/radicals quizzes ignore this.
export const DEFAULT_QUIZ_CONTENT = 'meanings'

// Learning Mode reveals the answer for 0-star items; stored as 'on'/'off' to match the rest.
export const DEFAULT_LEARNING_MODE = 'on'

// Single reader for the quiz settings, shared with useQuizEngine so keys/defaults can't disagree.
// (The old 'quiz_max_stars' key is no longer read: mastery is fixed, see utils/mastery.js.)
export const loadQuizSettings = async () => {
    const [[, mode], [, content], [, learning]] = await AsyncStorage.multiGet([
        SETTINGS_KEYS.INPUT_MODE,
        SETTINGS_KEYS.QUIZ_CONTENT,
        SETTINGS_KEYS.LEARNING_MODE,
    ])
    return {
        inputMode: mode ?? DEFAULT_INPUT_MODE,
        quizContent: content ?? DEFAULT_QUIZ_CONTENT,
        learningMode: learning ?? DEFAULT_LEARNING_MODE,
    }
}

const INPUT_MODE_OPTIONS = [
    { value: 'choice', label: 'Buttons', Icon: MousePointerClick, accessibilityLabel: 'Buttons input mode' },
    { value: 'keyboard', label: 'Keyboard', Icon: Keyboard, accessibilityLabel: 'Keyboard input mode' },
]

const QUIZ_CONTENT_OPTIONS = [
    { value: 'meanings', label: 'Meanings', Icon: BookOpen, accessibilityLabel: 'Meaning questions only' },
    { value: 'readings', label: 'Readings', Icon: MessageCircle, accessibilityLabel: 'Reading questions only' },
    { value: 'mixed', label: 'Mixed', Icon: Shuffle, accessibilityLabel: 'Mixed questions' },
]

const LEARNING_MODE_OPTIONS = [
    { value: 'on', label: 'On', Icon: GraduationCap, accessibilityLabel: 'Learning mode on' },
    { value: 'off', label: 'Off', Icon: Ban, accessibilityLabel: 'Learning mode off' },
]

// showQuizContent: show the kanji-only "Quiz Content" section (enabled by TopSlider on kanji pages).
const QuizSettings = ({ isVisible, onClose, showQuizContent = false }) => {
    const { theme } = useTheme()

    const [inputMode, setInputMode] = useState(DEFAULT_INPUT_MODE)
    const [quizContent, setQuizContent] = useState(DEFAULT_QUIZ_CONTENT)
    const [learningMode, setLearningMode] = useState(DEFAULT_LEARNING_MODE)

    useEffect(() => {
        if (isVisible) {
            loadSettings()
        }
    }, [isVisible])

    const loadSettings = async () => {
        try {
            const saved = await loadQuizSettings()
            setInputMode(saved.inputMode)
            setQuizContent(saved.quizContent)
            setLearningMode(saved.learningMode)
        } catch (e) {
            console.warn("Failed to load settings", e)
        }
    }

    const save = async () => {
        try {
            await AsyncStorage.multiSet([
                [SETTINGS_KEYS.INPUT_MODE, inputMode],
                [SETTINGS_KEYS.QUIZ_CONTENT, quizContent],
                [SETTINGS_KEYS.LEARNING_MODE, learningMode],
            ])

            onClose()
        } catch (e) {
            console.warn("Failed to save settings", e)
        }
    }

    return (
        <BottomSheet isVisible={isVisible} onClose={onClose} title="Quiz Settings" heightPercent={showQuizContent ? '70%' : '56%'}>
            {/* Scrolls on small screens; the Apply button below stays visible either way. */}
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {/* --- Setting 1: Input Mode --- */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: theme.text, marginBottom: 10 }]}>Input Method</Text>
                    <SegmentedToggle options={INPUT_MODE_OPTIONS} value={inputMode} onChange={setInputMode} />
                </View>

                <Spacer height={20} />

                {/* --- Setting 2: Learning Mode (global) --- */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: theme.text }]}>Learning Mode</Text>
                    <Text style={[styles.subLabel, { color: '#888', marginBottom: 10 }]}>
                        Teaches a few characters at a time and reveals new ones.
                    </Text>
                    <SegmentedToggle options={LEARNING_MODE_OPTIONS} value={learningMode} onChange={setLearningMode} />

                    <Spacer height={10} />

                    <View style={styles.noteRow}>
                        <Info size={13} color={theme.text} style={{ opacity: 0.55 }} />
                        <Text style={[styles.noteText, { color: theme.text, fontSize: 11 }]}>
                            Progress is saved across both modes. Can be reset in the settings.
                        </Text>
                    </View>
                </View>

                {/* --- Setting 3: Quiz Content (kanji courses only) --- */}
                {showQuizContent && (
                    <>
                        <Spacer height={20} />
                        <View style={styles.section}>
                            <Text style={[styles.label, { color: theme.text }]}>Quiz Content</Text>
                            <Text style={[styles.subLabel, { color: '#888', marginBottom: 10 }]}>
                                What kanji questions ask for
                            </Text>
                            <SegmentedToggle options={QUIZ_CONTENT_OPTIONS} value={quizContent} onChange={setQuizContent} />
                        </View>
                    </>
                )}

                <Spacer height={25} />
            </ScrollView>

            {/* Apply Button */}
            <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                onPress={save}
                activeOpacity={0.8}
                accessibilityLabel="Apply changes"
                accessibilityRole="button"
            >
                <Save size={20} color="#000" style={{ marginRight: 8 }} />
                <Text style={styles.saveText}>Apply Changes</Text>
            </TouchableOpacity>
        </BottomSheet>
    )
}

const styles = StyleSheet.create({
    label: {
        fontSize: 18,
        fontWeight: '600',
    },
    subLabel: {
        fontSize: 14,
        marginTop: 2,
    },
    noteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    noteText: {
        flex: 1, // wrap within the row instead of pushing past the sheet edge
        fontSize: 13,
        opacity: 0.55,
    },
    section: {},
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 25,
        marginTop: 'auto', // Pushes button to bottom of sheet
        marginBottom: 10,
    },
    saveText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    },
})

export default QuizSettings
