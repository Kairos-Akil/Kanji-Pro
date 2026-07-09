import { createContext, useContext } from 'react'
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import { usePersistedState } from '../hooks/usePersistedState'

const AppSettingsContext = createContext(null)

const STORAGE_KEYS = {
    HAPTICS: 'KANJI_PRO_HAPTICS_ENABLED',
    SOUND: 'KANJI_PRO_SOUND_ENABLED',
    REMINDER_ENABLED: 'KANJI_PRO_REMINDER_ENABLED',
    REMINDER_HOUR: 'KANJI_PRO_REMINDER_HOUR',
    REMINDER_MINUTE: 'KANJI_PRO_REMINDER_MINUTE',
}

const DEFAULT_REMINDER_HOUR = 19
const DEFAULT_REMINDER_MINUTE = 0
const REMINDER_CHANNEL_ID = 'reminders'

// Show the reminder notification even while the app is in the foreground.
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
})

export const AppSettingsProvider = ({ children }) => {
    const [hapticsEnabled, setHapticsEnabled] = usePersistedState(STORAGE_KEYS.HAPTICS, true)
    const [soundEnabled, setSoundEnabled] = usePersistedState(STORAGE_KEYS.SOUND, true)
    const [reminderEnabled, setReminderEnabledRaw] = usePersistedState(STORAGE_KEYS.REMINDER_ENABLED, false)
    const [reminderHour, setReminderHour] = usePersistedState(STORAGE_KEYS.REMINDER_HOUR, DEFAULT_REMINDER_HOUR)
    const [reminderMinute, setReminderMinute] = usePersistedState(STORAGE_KEYS.REMINDER_MINUTE, DEFAULT_REMINDER_MINUTE)

    // Reschedule (or cancel) the daily reminder. Cancel-all-then-reschedule avoids tracking
    // notification ids; the result lets callers detect a denied permission.
    const applyReminder = async (enabled, hour, minute) => {
        if (Platform.OS === 'web') return { success: true } // not supported on web

        try {
            await Notifications.cancelAllScheduledNotificationsAsync()

            if (!enabled) return { success: true }

            const { granted } = await Notifications.requestPermissionsAsync()
            if (!granted) return { success: false, reason: 'permission-denied' }

            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
                    name: 'Study Reminders',
                    importance: Notifications.AndroidImportance.DEFAULT,
                    sound: 'default',
                })
            }

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Kanji Pro',
                    body: 'Time for a quick study session — keep your streak going!',
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                    hour,
                    minute,
                    channelId: REMINDER_CHANNEL_ID,
                },
            })
            return { success: true }
        } catch (err) {
            console.warn('Failed to schedule reminder notification:', err)
            return { success: false, reason: 'error' }
        }
    }

    // Only persist "enabled" once the reminder was actually scheduled.
    const setReminderEnabled = async (value) => {
        if (!value) {
            setReminderEnabledRaw(false)
            applyReminder(false, reminderHour, reminderMinute)
            return { success: true }
        }

        const result = await applyReminder(true, reminderHour, reminderMinute)
        setReminderEnabledRaw(result.success)
        return result
    }

    const setReminderTime = (hour, minute) => {
        setReminderHour(hour)
        setReminderMinute(minute)
        if (reminderEnabled) applyReminder(true, hour, minute)
    }

    return (
        <AppSettingsContext.Provider
            value={{
                hapticsEnabled,
                setHapticsEnabled,
                soundEnabled,
                setSoundEnabled,
                reminderEnabled,
                setReminderEnabled,
                reminderHour,
                reminderMinute,
                setReminderTime,
            }}
        >
            {children}
        </AppSettingsContext.Provider>
    )
}

export const useAppSettings = () => {
    const ctx = useContext(AppSettingsContext)
    if (!ctx) {
        throw new Error('useAppSettings must be used inside AppSettingsProvider')
    }
    return ctx
}
