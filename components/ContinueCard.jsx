import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@react-native-vector-icons/ionicons'
import { LinearGradient } from 'expo-linear-gradient'

// Home's big "Current goal" card: the last opened course in its own colors, plus the streak.
const ContinueCard = ({ course, streakCount, onPress }) => (
    <TouchableOpacity
        activeOpacity={0.95}
        style={styles.container}
        onPress={onPress}
        accessibilityLabel={`Continue ${course.title} ${course.subtitle}`}
        accessibilityRole="button"
    >
        <LinearGradient colors={[course.color1, course.color2]} style={styles.gradient}>
            <View style={styles.header}>
                {streakCount > 0 && (
                    <View style={styles.streakPill}>
                        <Ionicons name="flame" size={14} color={course.textColor} />
                        <Text style={[styles.streakText, { color: course.textColor }]}>
                            {streakCount} Day{streakCount === 1 ? '' : 's'} Streak
                        </Text>
                    </View>
                )}
            </View>
            <Text style={styles.watermarkChar}>{course.char}</Text>
            <View style={styles.content}>
                <Text style={[styles.label, { color: course.textColor }]}>CURRENT GOAL</Text>
                <Text style={[styles.title, { color: course.textColor }]}>{course.title}</Text>
                <Text style={[styles.subtitle, { color: course.textColor }]}>{course.subtitle}</Text>
                <View style={styles.playButton}>
                    <Text style={[styles.playText, { color: course.textColor }]}>CONTINUE</Text>
                    <Ionicons name="arrow-forward-circle" size={32} color={course.textColor} />
                </View>
            </View>
        </LinearGradient>
    </TouchableOpacity>
)

export default ContinueCard

const styles = StyleSheet.create({
    container: {
        height: 460,
        marginHorizontal: 10,
        marginBottom: 20,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
    },
    gradient: { flex: 1, padding: 25, justifyContent: 'space-between' },
    header: { flexDirection: 'row', justifyContent: 'flex-start', zIndex: 10 },
    streakPill: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.6)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        alignItems: 'center',
        gap: 6,
    },
    streakText: { fontWeight: '700', fontSize: 12 },
    watermarkChar: {
        position: 'absolute',
        right: -20,
        bottom: -40,
        fontSize: 340,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.4)',
        zIndex: 0,
    },
    content: { zIndex: 10, marginBottom: 15 },
    label: { fontSize: 12, fontWeight: '800', letterSpacing: 2, opacity: 0.7, marginBottom: 5 },
    title: { fontSize: 48, fontWeight: '900', letterSpacing: -1, lineHeight: 50 },
    subtitle: { fontSize: 18, fontWeight: '500', marginTop: 5, marginBottom: 30, opacity: 0.8 },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)',
        alignSelf: 'flex-start',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
        gap: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    playText: { fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
})
