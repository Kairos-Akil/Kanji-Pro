import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { MousePointerClick, Keyboard, Save, Shuffle, BookOpen, MessageCircle, GraduationCap, Ban } from 'lucide-react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTheme } from '../context/ThemeContext'
import { useAlert } from '../context/AlertContext'
import BottomSheet from './BottomSheet'
import SegmentedToggle from './SegmentedToggle'
import Stepper from './Stepper'
import Spacer from './Spacer'

export const SETTINGS_KEYS = {
    MAX_STARS: 'quiz_max_stars',
    INPUT_MODE: 'quiz_input_mode',
    QUIZ_CONTENT: 'quiz_content',
    LEARNING_MODE: 'quiz_learning_mode',
}

// Shared default so "learned" counts don't disagree between screens before the user saves once.
export const DEFAULT_MAX_STARS = 5

export const DEFAULT_INPUT_MODE = 'choice'

// What kanji quizzes ask about (matches the `group` field of KANJI_QUESTION_MODES, plus 'mixed').
// Kana/radicals quizzes ignore this.
export const DEFAULT_QUIZ_CONTENT = 'meanings'

// Learning Mode reveals the answer for 0-star items; stored as 'on'/'off' to match the rest.
export const DEFAULT_LEARNING_MODE = 'on'

// Single reader for the quiz settings, shared with useQuizEngine so keys/defaults can't disagree.
export const loadQuizSettings = async () => {
    const [[, stars], [, mode], [, content], [, learning]] = await AsyncStorage.multiGet([
        SETTINGS_KEYS.MAX_STARS,
        SETTINGS_KEYS.INPUT_MODE,
        SETTINGS_KEYS.QUIZ_CONTENT,
        SETTINGS_KEYS.LEARNING_MODE,
    ])
    return {
        maxStars: stars ? parseInt(stars, 10) : DEFAULT_MAX_STARS,
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
    const showAlert = useAlert()

    const [maxStars, setMaxStars] = useState(DEFAULT_MAX_STARS)
    const [inputMode, setInputMode] = useState(DEFAULT_INPUT_MODE)
    const [quizContent, setQuizContent] = useState(DEFAULT_QUIZ_CONTENT)
    const [learningMode, setLearningMode] = useState(DEFAULT_LEARNING_MODE)

    // The mastery level before editing, so handleSavePress can warn only when it changed.
    const [initialMaxStars, setInitialMaxStars] = useState(DEFAULT_MAX_STARS)

    useEffect(() => {
        if (isVisible) {
            loadSettings()
        }
    }, [isVisible])

    const loadSettings = async () => {
        try {
            const saved = await loadQuizSettings()
            setMaxStars(saved.maxStars)
            setInitialMaxStars(saved.maxStars)
            setInputMode(saved.inputMode)
            setQuizContent(saved.quizContent)
            setLearningMode(saved.learningMode)
        } catch (e) {
            console.error("Failed to load settings", e)
        }
    }

    const performSave = async () => {
        try {
            await AsyncStorage.multiSet([
                [SETTINGS_KEYS.MAX_STARS, maxStars.toString()],
                [SETTINGS_KEYS.INPUT_MODE, inputMode],
                [SETTINGS_KEYS.QUIZ_CONTENT, quizContent],
                [SETTINGS_KEYS.LEARNING_MODE, learningMode],
            ])

            onClose()
        } catch (e) {
            console.error("Failed to save settings", e)
        }
    }

    // Warn before saving only if the mastery level changed (it shifts progress percentages).
    const handleSavePress = () => {
        if (maxStars !== initialMaxStars) {
            showAlert(
                "Change Mastery Level?",
                "Changing the star requirement will adjust your current progress percentage. Are you sure?",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Yes, Change it", onPress: performSave, style: "destructive" },
                ]
            )
        } else {
            performSave()
        }
    }

    const adjustStars = (amount) => {
        setMaxStars(prev => Math.max(1, Math.min(prev + amount, 15)))
    }

    return (
        <BottomSheet isVisible={isVisible} onClose={onClose} title="Quiz Settings" heightPercent={showQuizContent ? '74%' : '62%'}>
            {/* --- Setting 1: Mastery Level (Stars) --- */}
            <View style={styles.settingRow}>
                <View>
                    <Text style={[styles.label, { color: theme.text }]}>Mastery Level</Text>
                    <Text style={[styles.subLabel, { color: '#888' }]}>Stars per Kana</Text>
                </View>

                <Stepper
                    value={maxStars}
                    onDecrement={() => adjustStars(-1)}
                    onIncrement={() => adjustStars(1)}
                    decrementLabel="Decrease mastery level"
                    incrementLabel="Increase mastery level"
                />
            </View>

            <Spacer height={20} />

            {/* --- Setting 2: Input Mode --- */}
            <View style={styles.section}>
                <Text style={[styles.label, { color: theme.text, marginBottom: 10 }]}>Input Method</Text>
                <SegmentedToggle options={INPUT_MODE_OPTIONS} value={inputMode} onChange={setInputMode} />
            </View>

            <Spacer height={20} />

            {/* --- Setting 3: Learning Mode (global) --- */}
            <View style={styles.section}>
                <Text style={[styles.label, { color: theme.text }]}>Learning Mode</Text>
                <Text style={[styles.subLabel, { color: '#888', marginBottom: 10 }]}>
                    Show the answer for new characters instead of guessing
                </Text>
                <SegmentedToggle options={LEARNING_MODE_OPTIONS} value={learningMode} onChange={setLearningMode} />
            </View>

            {/* --- Setting 4: Quiz Content (kanji courses only) --- */}
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

            {/* Apply Button */}
            <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                onPress={handleSavePress}
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
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: 18,
        fontWeight: '600',
    },
    subLabel: {
        fontSize: 14,
        marginTop: 2,
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
