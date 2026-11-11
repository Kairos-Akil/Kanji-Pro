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
import { isMastered, reviewWeight, pickWeighted, avoidRepeat } from '../utils/mastery'

const correctSound = require('../assets/sounds/correct.wav')
const incorrectSound = require('../assets/sounds/incorrect.wav')

// Shared "positive" blue for the success glow and the teaching card's border.
const TEACH_COLOR = '#00e1ffff'

// Learning Mode drills only a small "working set" of unmastered items at a time, so a fresh
// course doesn't throw all characters at the user at once. The set fills instantly to the minimum,
// then grows by chance per question up to the maximum; mastering an item frees its slot.
// With Learning Mode off, the quiz draws from all unmastered items (plain test).
const WORKING_SET_MIN = 5
const WORKING_SET_MAX = 15
const NEW_ITEM_CHANCE = 0.1

// Chance of re-drilling a mastered item, so mastery can still be lost and the quiz never runs dry.
// Which mastered item is weighted by its "+N" (see reviewWeight in utils/mastery.js).
const REVIEW_CHANCE = 0.15

// Shared drill logic for every quiz (Kana, Kanji, Radicals): tracks per-item star progress,
// generates multiple-choice questions, and drives the success/failure animation. idKey identifies
// an item, answerKey is the tested field. questionModes (kanji) rotates the tested field per
// question instead of always using answerKey.
export const useQuizEngine = ({ Data, quizId, idKey, answerKey, allowKeyboard = true, questionModes = null }) => {
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

    // Reload on every focus: quiz screens stay mounted in the tab navigator, so settings changed
    // elsewhere must be picked up on return.
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

    // Active learning pool: ids of the (at most WORKING_SET_MAX) unmastered items drilled right now.
    const workingSetRef = useRef(null)
    // Ids that rolled into the set but haven't been shown yet, they're presented back-to-back
    // (teach cards in Learning Mode) before normal quizzing resumes.
    const introQueueRef = useRef([])

    // Sync the working set with current progress/settings; returns its items. Runs before every
    // question, so it self-heals after mastery-level changes or a progress reset.
    const updateWorkingSet = (unmastered, getStars) => {
        const inProgress = unmastered.filter(item => getStars(item) > 0)

        // First run: resume the items already in progress, so prior partial stars stay active.
        if (workingSetRef.current === null) {
            workingSetRef.current = shuffle(inProgress).slice(0, WORKING_SET_MAX).map(item => item[idKey])
        }

        const unmasteredIds = new Set(unmastered.map(item => item[idKey]))
        const set = workingSetRef.current.filter(id => unmasteredIds.has(id)) // drop mastered items

        const setIds = new Set(set)
        const enroll = (item) => { set.push(item[idKey]); setIds.add(item[idKey]) }

        // Partially-starred items outside the set (e.g. after raising the mastery level) re-enter
        // before brand-new ones.
        for (const item of shuffle(inProgress)) {
            if (set.length >= WORKING_SET_MAX) break
            if (!setIds.has(item[idKey])) enroll(item)
        }

        // Fill instantly up to the minimum, then let new items trickle in by chance.
        const fresh = shuffle(unmastered.filter(item => !setIds.has(item[idKey])))
        const enrollFresh = () => {
            const item = fresh.pop()
            enroll(item)
            introQueueRef.current.push(item[idKey])
        }
        while (set.length < WORKING_SET_MIN && fresh.length > 0) enrollFresh()
        if (set.length < WORKING_SET_MAX && fresh.length > 0 && Math.random() < NEW_ITEM_CHANCE) {
            enrollFresh()
        }

        workingSetRef.current = set
        return unmastered.filter(item => setIds.has(item[idKey]))
    }

    const generateQuestion = () => {
        if (Data.length === 0) return

        const getStars = (item) => progress[item[idKey]] ?? 0
        const unmastered = Data.filter(item => !isMastered(getStars(item)))
        const mastered = Data.filter(item => isMastered(getStars(item)))

        let nextItem = null
        let pool

        // The working set (and its teach-first queue) is Learning Mode's pacing. With Learning
        // Mode off the quiz is a plain test drawing from every unmastered item at once.
        if (learningMode === 'on') {
            const workingSet = updateWorkingSet(unmastered, getStars)

            // Drop queued ids that left the set in the meantime (e.g. after a progress reset).
            introQueueRef.current = introQueueRef.current.filter(id =>
                workingSet.some(item => item[idKey] === id))

            if (introQueueRef.current.length > 0) {
                // Freshly rolled-in characters are shown back-to-back, before quizzing resumes.
                const nextId = introQueueRef.current.shift()
                nextItem = workingSet.find(item => item[idKey] === nextId)
            } else if (workingSet.length === 0) {
                pool = mastered // everything mastered: reviews are all that's left
            } else if (mastered.length > 0 && Math.random() < REVIEW_CHANCE) {
                pool = mastered
            } else {
                pool = workingSet
            }
        } else if (unmastered.length === 0) {
            pool = mastered // everything mastered: reviews are all that's left
        } else if (mastered.length > 0 && Math.random() < REVIEW_CHANCE) {
            pool = mastered
        } else {
            pool = unmastered
        }

        if (!nextItem) {
            // One character left to learn and it was just shown: take a review instead.
            if (pool !== mastered) {
                pool = avoidRepeat(pool, mastered, currentItem?.[idKey], item => item[idKey])
            }

            // Don't re-ask the on-screen character (skipped only if it's the only candidate).
            const candidates = pool.length > 1 && currentItem
                ? pool.filter(item => item[idKey] !== currentItem[idKey])
                : pool
            // Reviews favor shaky items: a high "+N" (solidly known) makes an item come back rarely.
            nextItem = pool === mastered
                ? pickWeighted(candidates, item => reviewWeight(getStars(item)))
                : candidates[Math.floor(Math.random() * candidates.length)]
        }

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
        // Callers can force choice-only for answer sets the keyboard can't represent.
        inputMode: allowKeyboard ? inputMode : 'choice',
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
