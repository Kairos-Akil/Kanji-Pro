import { useState, useEffect, useCallback, useRef } from 'react'
import { useFocusEffect } from 'expo-router'
import {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withTiming,
    withRepeat,
    interpolateColor,
    Easing,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useAudioPlayer } from 'expo-audio'
import {
    loadQuizSettings,
    DEFAULT_INPUT_MODE,
    DEFAULT_QUIZ_CONTENT,
    DEFAULT_LEARNING_MODE,
} from '../components/QuizSettings'
import { useProgress } from '../context/ProgressContext'
import { useTheme } from '../context/ThemeContext'
import { useAppSettings } from '../context/AppSettingsContext'
import { answerDisplayText, typedAnswerMatches, answersMatch, hasModeData, shuffle, pickWrongOptions } from '../utils/answers'
import { pickNextItem, INITIAL_PICKER_STATE } from '../utils/questionPicker'

const correctSound = require('../assets/sounds/correct.wav')
const incorrectSound = require('../assets/sounds/incorrect.wav')

// Shared "positive" blue for the success glow and the teaching card's border.
const TEACH_COLOR = '#00e1ffff'

// Shared drill logic for every quiz (Kana, Kanji, Radicals): tracks per-item star progress,
// generates multiple-choice questions, and drives the success/failure animation. idKey identifies
// an item, answerKey is the tested field. questionModes (kanji) rotates the tested field per
// question instead of always using answerKey.
export const useQuizEngine = ({ Data, quizId, idKey, answerKey, questionModes = null }) => {
    const { theme } = useTheme()
    const { hapticsEnabled, soundEnabled } = useAppSettings()
    const {
        incrementItem,
        decrementItem,
        getProgressForQuiz,
        getLearnedCount,
    } = useProgress()

    const progress = getProgressForQuiz(quizId)

    // Keep the audio session active between clips — re-activation latency otherwise swallowed the
    // buzzer right after a correct chime. See also 'mixWithOthers' in app/_layout.jsx.
    const correctPlayer = useAudioPlayer(correctSound, { keepAudioSessionActive: true })
    const incorrectPlayer = useAudioPlayer(incorrectSound, { keepAudioSessionActive: true })

    // Clear the pending advance timeout on unmount so it can't setState afterwards.
    const advanceTimeoutRef = useRef(null)
    useEffect(() => () => clearTimeout(advanceTimeoutRef.current), [])

    // Whether the current question was already answered. A ref, not state: it changes instantly,
    // so a second tap in the same frame (before React re-renders `showAnswer`) is ignored instead
    // of counting the answer twice. Reset when the next question is shown.
    const answeredRef = useRef(false)

    const playSound = (player) => {
        try {
            // seekTo is deliberately not awaited: native commands run in dispatch order anyway,
            // and awaiting would queue play() behind the answer-tap re-render (audibly late sound).
            player.seekTo(0).catch(() => {})
            player.play()
        } catch (err) {
            // Non-fatal: playback isn't available on every platform (e.g. some web browsers).
            console.warn('Error playing sound', err)
        }
    }

    const [inputMode, setInputMode] = useState(DEFAULT_INPUT_MODE)
    const [quizContent, setQuizContent] = useState(DEFAULT_QUIZ_CONTENT)
    const [learningMode, setLearningMode] = useState(DEFAULT_LEARNING_MODE)
    // Question 1 waits for the saved settings. Built with the defaults first, it was replaced by a
    // different question a moment later, once the real settings arrived (a visible flash).
    const [settingsLoaded, setSettingsLoaded] = useState(false)

    // Modes after the Quiz Content filter; falls back to all modes if the filter empties the list.
    const allModes = questionModes ?? [{ key: answerKey, label: null }]
    const filteredModes = questionModes && quizContent !== 'mixed'
        ? allModes.filter(m => m.group === quizContent)
        : allModes
    const activeModes = filteredModes.length > 0 ? filteredModes : allModes

    const [current, setCurrent] = useState(0)
    const [options, setOptions] = useState([])
    const [showAnswer, setShowAnswer] = useState(false)
    const [selectedChoice, setSelectedChoice] = useState({})
    const [currentItem, setCurrentItem] = useState(null)
    const [currentMode, setCurrentMode] = useState(allModes[0])
    const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false)
    // Whether this question is a Learning Mode reveal. Fixed per question (not derived from live
    // progress) so a mid-question demotion to 0 stars can't cut off the failure feedback.
    const [teaching, setTeaching] = useState(false)

    const scale = useSharedValue(1)
    const shake = useSharedValue(0)
    const color = useSharedValue(0)

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { translateX: shake.value },
        ],
        color: interpolateColor(
            color.value,
            [-1, 0, 1],
            ['#ef4444', theme.title, TEACH_COLOR]
        ),
    }))

    // Teaching card rides the same `color` value, so on "Got it" it fills solid blue in sync —
    // matching how a correct choice button fills on the normal quiz.
    const teachCardStyle = useAnimatedStyle(() => ({
        borderColor: interpolateColor(color.value, [0, 1], [theme.inactive, TEACH_COLOR]),
        backgroundColor: interpolateColor(color.value, [0, 1], [theme.background, TEACH_COLOR]),
    }))

    // Load the quiz settings when the screen gains focus. In practice that's once per quiz: the
    // quiz unmounts when you leave it, and the settings sheet only exists on the course page.
    useFocusEffect(
        useCallback(() => {
            loadQuizSettings()
                .then((saved) => {
                    setInputMode(saved.inputMode)
                    setQuizContent(saved.quizContent)
                    setLearningMode(saved.learningMode)
                    setSettingsLoaded(true)
                })
                .catch((e) => {
                    console.warn('Error loading settings', e)
                    setSettingsLoaded(true) // start with the defaults rather than never
                })
        }, [])
    )

    // Settings are deps so a change made elsewhere (picked up on focus) rebuilds the question.
    useEffect(() => {
        if (!settingsLoaded) return
        generateQuestion()
        // generateQuestion is recreated each render; excluding it keeps this an explicit whitelist.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current, quizContent, learningMode, settingsLoaded])

    // Learning Mode state (working set + intro queue) between questions; see utils/questionPicker.js.
    const pickerStateRef = useRef(INITIAL_PICKER_STATE)

    const generateQuestion = () => {
        if (Data.length === 0) return

        const { item: nextItem, state } = pickNextItem({
            data: Data,
            idOf: item => item[idKey],
            getStars: item => progress[item[idKey]] ?? 0,
            learningMode,
            currentId: currentItem?.[idKey],
            state: pickerStateRef.current,
        })
        pickerStateRef.current = state

        // Only modes the item has data for; the fallback guards against pathological data.
        const itemModes = activeModes.filter(mode => hasModeData(nextItem, mode))
        const mode = itemModes[Math.floor(Math.random() * itemModes.length)] ?? allModes[0]

        const wrongOptions = pickWrongOptions(Data, nextItem, mode)

        const allOptions = shuffle([...wrongOptions, nextItem])

        setCurrentItem(nextItem)
        setCurrentMode(mode)
        setOptions(allOptions)
        setShowAnswer(false)
        answeredRef.current = false
        setSelectedChoice({})

        // Reveal (don't quiz) a 0-star item under Learning Mode.
        setTeaching(learningMode === 'on' && (progress[nextItem[idKey]] ?? 0) === 0)
    }

    // instantColor: Learning Mode snaps to the success color instead of fading.
    const triggerSuccessAnimation = ({ instantColor = false } = {}) => {
        color.value = instantColor ? 1 : withTiming(1, { duration: 200 })
        scale.value = withSequence(
            withSpring(1.2, { stiffness: 5000, damping: 15, mass: 0.1 }),
            withTiming(1.0, { duration: 300, easing: Easing.out(Easing.quad) })
        )

        if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        if (soundEnabled) playSound(correctPlayer)
    }

    const triggerFailureAnimation = () => {
        color.value = withTiming(-1, { duration: 200 })
        shake.value = withSequence(
            withTiming(-10, { duration: 50 }),
            withRepeat(withTiming(10, { duration: 100 }), 2, true),
            withTiming(0)
        )

        if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        if (soundEnabled) playSound(incorrectPlayer)
    }

    const handleAnswerSubmit = (submission) => {
        if (!currentItem || answeredRef.current) return
        answeredRef.current = true

        // Buttons submit the option object; the keyboard submits a string matched against any
        // accepted alternative. Both compare against the current mode's key.
        const isCorrect = typeof submission === 'string'
            ? typedAnswerMatches(submission, currentItem[currentMode.key])
            : answersMatch(submission[currentMode.key], currentItem[currentMode.key])

        if (typeof submission !== 'string') {
            setSelectedChoice(submission)
        }

        setLastAnswerCorrect(isCorrect)

        if (isCorrect) {
            triggerSuccessAnimation()
            incrementItem(quizId, currentItem[idKey])
        } else {
            triggerFailureAnimation()
            decrementItem(quizId, currentItem[idKey])
        }

        setShowAnswer(true)

        advanceTimeoutRef.current = setTimeout(() => {
            color.value = 0 // instant reset so the next question doesn't inherit a fading color
            setCurrent(prev => prev + 1)
        }, isCorrect ? 350 : 1000)
    }

    const itemProgress = currentItem ? (progress[currentItem[idKey]] ?? 0) : 0
    const learnedCount = getLearnedCount(quizId, Data.map(d => d[idKey]))

    // One entry per active mode the item has data for, so a kanji teaches meaning and readings up front.
    const teachingAnswers = teaching && currentItem
        ? activeModes
            .filter(mode => hasModeData(currentItem, mode))
            .map(mode => ({ label: mode.label, text: answerDisplayText(currentItem[mode.key]) }))
        : []

    // "Got it" resolves like a correct answer; answeredRef guards against double-taps.
    const handleLearningContinue = () => {
        if (!currentItem || answeredRef.current) return
        answeredRef.current = true
        setShowAnswer(true)
        triggerSuccessAnimation({ instantColor: true })
        incrementItem(quizId, currentItem[idKey])

        advanceTimeoutRef.current = setTimeout(() => {
            color.value = 0 // instant reset so the next card doesn't fade from blue
            setCurrent(prev => prev + 1)
        }, 350)
    }

    return {
        currentItem,
        options,
        showAnswer,
        selectedChoice,
        inputMode,
        animatedStyle,
        itemProgress,
        learnedCount,
        lastAnswerCorrect,
        handleAnswerSubmit,
        // Learning Mode: UI shows the answer(s) + a "Got it" button instead of the choice/keyboard input.
        teaching,
        teachingAnswers,
        handleLearningContinue,
        teachCardStyle,
        // Current question's tested field and its display label (null for single-mode quizzes).
        currentAnswerKey: currentMode?.key ?? answerKey,
        questionLabel: currentMode?.label ?? null,
    }
}
