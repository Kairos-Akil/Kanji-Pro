import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
} from 'react-native'
import { Sun, Moon, Contrast, Vibrate, Volume2, Bell, Clock, Trash2 } from 'lucide-react-native'
import { useTheme } from '../context/ThemeContext'
import { useAppSettings } from '../context/AppSettingsContext'
import { useProgressActions } from '../context/ProgressContext'
import { useAlert } from '../context/AlertContext'
import BottomSheet from './BottomSheet'
import SegmentedToggle from './SegmentedToggle'
import Stepper from './Stepper'
import Spacer from './Spacer'

const THEME_OPTIONS = [
    { value: 'light', label: 'Light', Icon: Sun, accessibilityLabel: 'Light theme' },
    { value: 'dark', label: 'Dark', Icon: Moon, accessibilityLabel: 'Dark theme' },
    { value: 'oled', label: 'OLED', Icon: Contrast, accessibilityLabel: 'OLED theme' },
]

const pad = (n) => n.toString().padStart(2, '0')

// One settings line: icon and label on the left, the control (children) on the right.
const SettingRow = ({ Icon, label, children }) => {
    const { theme } = useTheme()
    return (
        <View style={styles.row}>
            <View style={styles.rowLabel}>
                <Icon size={20} color={theme.text} />
                <Text style={[styles.rowLabelText, { color: theme.text }]}>{label}</Text>
            </View>
            {children}
        </View>
    )
}

// A SettingRow with an on/off switch.
const SwitchRow = ({ Icon, label, value, onValueChange, accessibilityLabel }) => {
    const { theme } = useTheme()
    return (
        <SettingRow Icon={Icon} label={label}>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: theme.inactive, true: theme.primary }}
                thumbColor="#fff"
                accessibilityLabel={accessibilityLabel}
            />
        </SettingRow>
    )
}

const AppSettings = ({ isVisible, onClose }) => {
    const { theme, mode, setMode } = useTheme()
    const {
        hapticsEnabled, setHapticsEnabled,
        soundEnabled, setSoundEnabled,
        reminderEnabled, setReminderEnabled,
        reminderHour, reminderMinute, setReminderTime,
    } = useAppSettings()
    // Stable actions: this sheet stays mounted under Home, so the live progress context would
    // re-render it on every quiz answer.
    const { resetProgress } = useProgressActions()
    const showAlert = useAlert()

    const adjustHour = (amount) => {
        const newHour = (reminderHour + amount + 24) % 24
        setReminderTime(newHour, reminderMinute)
    }

    const adjustMinute = (amount) => {
        const newMinute = (reminderMinute + amount + 60) % 60
        setReminderTime(reminderHour, newMinute)
    }

    const handleResetProgress = () => {
        showAlert(
            'Reset all progress?',
            'This permanently deletes your star progress across every Kana, Kanji, and Radicals quiz. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: resetProgress },
            ]
        )
    }

    const handleReminderToggle = async (value) => {
        const result = await setReminderEnabled(value)
        if (value && result?.reason === 'permission-denied') {
            showAlert(
                'Notifications disabled',
                'Kanji Pro needs notification permission to send a daily reminder. Enable it in your device settings, then try again.'
            )
        }
    }

    return (
        <BottomSheet isVisible={isVisible} onClose={onClose} title="Settings" heightPercent="75%">
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {/* --- Appearance --- */}
                <View>
                    <Text style={[styles.label, { color: theme.text }]}>Appearance</Text>
                    <SegmentedToggle options={THEME_OPTIONS} value={mode} onChange={setMode} />
                </View>

                <Spacer height={25} />

                {/* --- Feedback --- */}
                <View>
                    <Text style={[styles.label, { color: theme.text }]}>Feedback</Text>

                    <SwitchRow
                        Icon={Vibrate}
                        label="Haptics"
                        value={hapticsEnabled}
                        onValueChange={setHapticsEnabled}
                        accessibilityLabel="Haptics"
                    />

                    <Spacer height={14} />

                    <SwitchRow
                        Icon={Volume2}
                        label="Sound Effects"
                        value={soundEnabled}
                        onValueChange={setSoundEnabled}
                        accessibilityLabel="Sound effects"
                    />
                </View>

                <Spacer height={25} />

                {/* --- Reminders --- */}
                <View>
                    <Text style={[styles.label, { color: theme.text }]}>Reminders</Text>

                    <SwitchRow
                        Icon={Bell}
                        label="Daily Reminder"
                        value={reminderEnabled}
                        onValueChange={handleReminderToggle}
                        accessibilityLabel="Daily reminder"
                    />

                    {reminderEnabled && (
                        <>
                            <Spacer height={14} />
                            <SettingRow Icon={Clock} label="Time">
                                <View style={styles.timeRow}>
                                    <Stepper
                                        value={pad(reminderHour)}
                                        onDecrement={() => adjustHour(-1)}
                                        onIncrement={() => adjustHour(1)}
                                        decrementLabel="Decrease hour"
                                        incrementLabel="Increase hour"
                                        compact
                                    />

                                    <Text style={[styles.timeColon, { color: theme.text }]}>:</Text>

                                    <Stepper
                                        value={pad(reminderMinute)}
                                        onDecrement={() => adjustMinute(-5)}
                                        onIncrement={() => adjustMinute(5)}
                                        decrementLabel="Decrease minute"
                                        incrementLabel="Increase minute"
                                        compact
                                    />
                                </View>
                            </SettingRow>
                        </>
                    )}
                </View>

                <Spacer height={25} />

                {/* --- Data --- */}
                <View>
                    <Text style={[styles.label, { color: theme.text }]}>Data</Text>

                    <TouchableOpacity
                        style={[styles.resetBtn, { borderColor: theme.error }]}
                        onPress={handleResetProgress}
                        accessibilityLabel="Reset all progress"
                        accessibilityRole="button"
                    >
                        <Trash2 size={18} color={theme.error} />
                        <Text style={[styles.resetText, { color: theme.error }]}>Reset All Progress</Text>
                    </TouchableOpacity>
                </View>

                <Spacer height={15} />
            </ScrollView>
        </BottomSheet>
    )
}

export default AppSettings

const styles = StyleSheet.create({
    label: {
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rowLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    rowLabelText: {
        fontSize: 16,
        fontWeight: '500',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeColon: {
        fontSize: 18,
        fontWeight: 'bold',
        marginHorizontal: 6,
    },
    resetBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 15,
        borderWidth: 1,
    },
    resetText: {
        fontSize: 16,
        fontWeight: '600',
    },
})
