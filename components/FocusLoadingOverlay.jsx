import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { useTheme } from '../context/ThemeContext'

// Centered spinner shown while a preview scrolls to a searched character, so a jump into a large
// list doesn't look like nothing happened. Non-interactive (taps pass through to the grid).
const FocusLoadingOverlay = ({ char }) => {
    const { theme } = useTheme()
    return (
        <View style={styles.overlay} pointerEvents="none">
            <View style={[styles.pill, { backgroundColor: theme.tile }]}>
                <ActivityIndicator color={theme.primary} />
                <Text style={[styles.text, { color: theme.text }]}>
                    {char ? `Locating ${char}` : 'Locating'}
                </Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 22,
        borderRadius: 16,
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
})

export default FocusLoadingOverlay
