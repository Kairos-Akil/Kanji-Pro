import { useCallback } from 'react'
import { useFocusEffect } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAlert } from '../context/AlertContext'
import { useProgressActions, useProgressMeta } from '../context/ProgressContext'
import { COURSES } from '../constants/Courses'
import { FEEDBACK_URL, openLink } from '../utils/links'

const ASKED_STORAGE_KEY = 'KANJI_PRO_FEEDBACK_ASKED_V1'
const MASTERED_BEFORE_ASKING = 4

const countMastered = (getLearnedCount) => Object.values(COURSES).reduce(
    (sum, course) => sum + getLearnedCount(course.id, course.data.map(item => item[course.idKey])),
    0
)

// Asks for feedback once, on the screen using this (Home), after the user has mastered
// MASTERED_BEFORE_ASKING characters across all courses. Never during a quiz. It's marked as asked
// when shown, so whatever the answer (even closing the app), it never comes back.
export const useFeedbackPrompt = () => {
    const showAlert = useAlert()
    const { getLearnedCount } = useProgressActions()
    const { progressLoaded, progressLoadFailed } = useProgressMeta()

    useFocusEffect(
        useCallback(() => {
            // A failed load already shows its own alert; only one alert fits on screen.
            if (!progressLoaded || progressLoadFailed) return
            if (countMastered(getLearnedCount) < MASTERED_BEFORE_ASKING) return

            let cancelled = false // left Home before storage answered
            AsyncStorage.getItem(ASKED_STORAGE_KEY)
                .then(asked => {
                    if (asked || cancelled) return
                    AsyncStorage.setItem(ASKED_STORAGE_KEY, 'asked')
                        .catch(err => console.warn('Failed to save feedback prompt state', err))
                    showAlert(
                        'Liking the app?',
                        'Want to send me feedback? It takes a minute and needs no account (it opens a Tally form).',
                        [
                            // 'cancel': also what Android's back button picks.
                            { text: "Don't ask again", style: 'cancel' },
                            { text: 'Yes', onPress: () => openLink(FEEDBACK_URL) },
                        ]
                    )
                })
                .catch(err => console.warn('Failed to read feedback prompt state', err))
            return () => { cancelled = true }
        }, [progressLoaded, progressLoadFailed, getLearnedCount, showAlert])
    )
}
