import { View, Pressable, StyleSheet, Text } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import { Undo, Play, Ellipsis } from 'lucide-react-native'
import { useTheme } from '../context/ThemeContext'
import { COURSES } from '../constants/Courses'

// Preview route -> quiz route, derived from the Courses registry so it can't drift out of sync.
const QUIZ_ROUTE_MAP = Object.fromEntries(
    Object.values(COURSES).map(course => [course.route, course.quizRoute])
)

const BottomBar = ({ onOpenSettings, progress }) => {
    const { theme } = useTheme()
    const router = useRouter()
    const pathname = usePathname()

    const targetQuizRoute = QUIZ_ROUTE_MAP[pathname] ?? '/'

    const handleSettingsPress = () => {
        if (onOpenSettings) onOpenSettings()
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.navBackground, borderColor: theme.text }]}>
            {/* Home button */}
            <View style={styles.slot}>
                <Pressable
                    style={styles.button}
                    onPress={() => router.replace('/')}
                    accessibilityLabel="Go home"
                    accessibilityRole="button"
                >
                    <Undo color='#e0e0e0' size={22} />
                </Pressable>
            </View>

            {/* Quiz Settings Button */}
            <View style={[styles.slot, styles.centerSlot]}>
                <Pressable
                    style={[styles.playButton, { backgroundColor: theme.primary }]}
                    onPress={handleSettingsPress}
                    accessibilityLabel="Quiz settings"
                    accessibilityRole="button"
                >
                    <Ellipsis color='#000' size={22} />
                </Pressable>
            </View>


            {/* Start Quiz button with progress */}
            <View style={styles.slot}>
                <Pressable
                    style={[styles.playButton, styles.playButtonContent, { backgroundColor: theme.primary }]}
                    onPress={() => router.push(targetQuizRoute)}
                    accessibilityLabel={progress ? `Start quiz, progress ${progress}` : 'Start quiz'}
                    accessibilityRole="button"
                >
                    {progress && (
                        <Text style={styles.progressText}>{progress}</Text>
                    )}
                    <Play color='#000' size={22} fill={progress ? "transparent" : "#000"} />
                </Pressable>
            </View>


        </View>
    )
}

export default BottomBar

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 10,
        borderTopWidth: 1,
    },
    slot: {
        flex: 1,
        alignItems: 'center',
    },

    centerSlot: {
        justifyContent: 'center',
    },
    button: {
        padding: 10,
        borderRadius: 25,
        backgroundColor: '#958888ff',
    },
    playButton: {
        padding: 10,
        borderRadius: 25,
    },
    playButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        gap: 8, // Space between number and arrow
    },
    progressText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    }
})