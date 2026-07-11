import { useState, useEffect, useCallback, useRef } from 'react'
import { useFocusEffect } from '@react-navigation/native'
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
    DEFAULT_MAX_STARS,
    DEFAULT_INPUT_MODE,
    DEFAULT_QUIZ_CONTENT,
    DEFAULT_LEARNING_MODE,
} from '../components/QuizSettings'
import { useProgress } from '../context/ProgressContext'
import { useTheme } from '../context/ThemeContext'
import { useAppSettings } from '../context/AppSettingsContext'
import { kanaToRomaji } from '../utils/kanaToRomaji'

const correctSound = require('../assets/sounds/correct.wav')
const incorrectSound = require('../assets/sounds/incorrect.wav')

const normalize = (s) => s.trim().toLowerCase().replace(/\s+/g, ' ')

// Normalize an answerKey value (a single string, or an array of accepted alternatives) to an array.
export const toAnswerList = (value) => Array.isArray(value) ? value : [value]

// Accepted alternatives joined into one display string.
export const answerDisplayText = (value) => toAnswerList(value).join(', ')

// True if the typed text matches any accepted alternative or its romaji ("nichi" matches ニチ).
const typedAnswerMatches = (typed, correctValue) => {
    const typedNormalized = normalize(typed)
    return toAnswerList(correctValue).some(part => {
        if (normalize(part) === typedNormalized) return true
        const romaji = kanaToRomaji(part)
        return romaji != null && normalize(romaji) === typedNormalized
    })
}

// Value comparison for answer lists (arrays never compare equal by reference).
export const answersMatch = (a, b) => {
    const listA = toAnswerList(a)
    const listB = toAnswerList(b)
    return listA.length === listB.length && listA.every((v, i) => v === listB[i])
}

// Whether an item has data for a mode's field (e.g. a kanji with no kunyomi skips Kun questions).
const hasModeData = (item, mode) => toAnswerList(item[mode.key] ?? []).length > 0

// Fisher-Yates shuffle (unbiased, unlike the sort(() => Math.random() - 0.5) trick).
const shuffle = (arr) => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

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

    const playSound = (player) => {
        try {
            // seekTo is deliberately not awaited: native commands run in dispatch order anyway,
            // and awaiting would queue play() behind the answer-tap re-render (audibly late sound).
            player.seekTo(0).catch(() => {})
            player.play()
        } catch (err) {
            // Non-fatal: playback isn't available on every platform (e.g. some web browsers).
            console.log('Error playing sound', err)
        }
    }

    const [maxStars, setMaxStars] = useState(DEFAULT_MAX_STARS)
    const [inputMode, setInputMode] = useState(DEFAULT_INPUT_MODE)
    const [quizContent, setQuizContent] = useState(DEFAULT_QUIZ_CONTENT)
    const [learningMode, setLearningMode] = useState(DEFAULT_LEARNING_MODE)

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
                    setMaxStars(saved.maxStars)
                    setInputMode(saved.inputMode)
                    setQuizContent(saved.quizContent)
                    setLearningMode(saved.learningMode)
                })
                .catch((e) => console.log('Error loading settings', e))
        }, [])
    )

    // quizContent is included so question 1 rebuilds once the async settings load resolves.
    useEffect(() => {
        generateQuestion()
        // generateQuestion is recreated each render; excluding it keeps this an explicit whitelist.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current, maxStars, quizContent, learningMode])

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
        if (maxStars === 0 || Data.length === 0) return

        const getStars = (item) => progress[item[idKey]] ?? 0
        const unmastered = Data.filter(item => getStars(item) < maxStars)
        const mastered = Data.filter(item => getStars(item) >= maxStars)

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
            // Don't re-ask the on-screen character (skipped only if it's the only candidate).
            const candidates = pool.length > 1 && currentItem
                ? pool.filter(item => item[idKey] !== currentItem[idKey])
                : pool
            nextItem = candidates[Math.floor(Math.random() * candidates.length)]
        }

        // Only modes the item has data for; the fallback guards against pathological data.
        const itemModes = activeModes.filter(mode => hasModeData(nextItem, mode))
        const mode = itemModes[Math.floor(Math.random() * itemModes.length)] ?? allModes[0]

        // Wrong options also need data for this mode's field, or their button renders blank.
        const wrongOptions = shuffle(
            Data.filter(item => hasModeData(item, mode) && !answersMatch(item[mode.key], nextItem[mode.key]))
        ).slice(0, 3)

        const allOptions = shuffle([...wrongOptions, nextItem])

        setCurrentItem(nextItem)
        setCurrentMode(mode)
        setOptions(allOptions)
        setShowAnswer(false)
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
        if (!currentItem) return

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
            incrementItem(quizId, currentItem[idKey], maxStars)
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
    const learnedCount = getLearnedCount(quizId, Data.map(d => d[idKey]), maxStars)

    // One entry per active mode the item has data for, so a kanji teaches meaning and readings up front.
    const teachingAnswers = teaching && currentItem
        ? activeModes
            .filter(mode => hasModeData(currentItem, mode))
            .map(mode => ({ label: mode.label, text: answerDisplayText(currentItem[mode.key]) }))
        : []

    // "Got it" resolves like a correct answer; showAnswer guards against double-taps.
    const handleLearningContinue = () => {
        if (!currentItem || showAnswer) return
        setShowAnswer(true)
        triggerSuccessAnimation({ instantColor: true })
        incrementItem(quizId, currentItem[idKey], maxStars)

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
        maxStars,
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
