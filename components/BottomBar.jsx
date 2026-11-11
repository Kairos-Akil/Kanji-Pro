import { View, Pressable, StyleSheet, Text } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import { Undo, Play, Ellipsis } from 'lucide-react-native'
import { useTheme } from '../context/ThemeContext'
import { COURSES } from '../constants/Courses'
import { useNavigateOnce } from '../hooks/useNavigateOnce'

// Preview route -> quiz route. Every quiz is app/Quiz_Page/[courseId].jsx, so its URL is the id.
const QUIZ_ROUTE_MAP = Object.fromEntries(
    Object.values(COURSES).map(course => [course.route, `/Quiz_Page/${course.id}`])
)

const BottomBar = ({ onOpenSettings, progress }) => {
    const { theme } = useTheme()
    const router = useRouter()
    const navigateOnce = useNavigateOnce()
    const pathname = usePathname()

    const targetQuizRoute = QUIZ_ROUTE_MAP[pathname] ?? '/'

    const handleSettingsPress = () => {
        if (onOpenSettings) onOpenSettings()
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.navBackground, borderColor: theme.text }]}>
            {/* Home button: go *back* to the Home underneath. replace('/') put a second Home on top of
                it, so Android back then needed two presses to leave the app. dismissTo still
                replaces when there's no Home underneath (app opened directly on a course page). */}
            <View style={styles.slot}>
                <Pressable
                    style={styles.button}
                    onPress={() => navigateOnce(() => router.dismissTo('/'))}
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
                    onPress={() => navigateOnce(() => router.push(targetQuizRoute))}
                    accessibilityLabel={progress ? `Start quiz, progress ${progress}` : 'Start quiz'}
                    accessibilityRole="button"
                >
                    {/* Ternary, not &&: an empty progress string would be rendered as bare text. */}
                    {progress ? (
                        <Text style={styles.progressText}>{progress}</Text>
                    ) : null}
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