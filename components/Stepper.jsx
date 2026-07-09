import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Minus, Plus } from 'lucide-react-native'
import { useTheme } from '../context/ThemeContext'

// Generic -/value/+ stepper row (e.g. Mastery Level stars, reminder hour/minute).
// `compact` shrinks it for use side-by-side (e.g. two steppers with a ":" between them).
const Stepper = ({ value, onDecrement, onIncrement, decrementLabel = 'Decrease', incrementLabel = 'Increase', compact = false }) => {
    const { theme } = useTheme()

    const iconSize = compact ? 16 : 20
    const buttonPadding = compact ? 8 : 10
    const valueFontSize = compact ? 16 : 20
    const valueMargin = compact ? 6 : 12

    return (
        <View style={[styles.container, { backgroundColor: theme.navBackground }]}>
            <TouchableOpacity
                style={{ padding: buttonPadding }}
                onPress={onDecrement}
                accessibilityLabel={decrementLabel}
                accessibilityRole="button"
            >
                <Minus size={iconSize} color={theme.text} />
            </TouchableOpacity>

            <Text style={[styles.value, { color: theme.primary, fontSize: valueFontSize, marginHorizontal: valueMargin }]}>
                {value}
            </Text>

            <TouchableOpacity
                style={{ padding: buttonPadding }}
                onPress={onIncrement}
                accessibilityLabel={incrementLabel}
                accessibilityRole="button"
            >
                <Plus size={iconSize} color={theme.text} />
            </TouchableOpacity>
        </View>
    )
}

export default Stepper

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        padding: 4,
    },
    value: {
        fontWeight: 'bold',
        minWidth: 24,
        textAlign: 'center',
    },
})
