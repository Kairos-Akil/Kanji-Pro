import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTheme } from '../context/ThemeContext'

// Row of mutually-exclusive icon+label buttons (e.g. Light/Dark/OLED, Buttons/Keyboard).
// Each option is { value, label, Icon, accessibilityLabel? } — accessibilityLabel defaults
// to label when the visible text alone isn't descriptive enough (e.g. "Light" -> "Light theme").
const SegmentedToggle = ({ options, value, onChange }) => {
    const { theme } = useTheme()

    return (
        <View style={styles.container}>
            {options.map(({ value: optionValue, label, Icon, accessibilityLabel }, index) => {
                const isActive = value === optionValue
                return (
                    <React.Fragment key={optionValue}>
                        {index > 0 && <View style={{ width: 12 }} />}
                        <TouchableOpacity
                            style={[
                                styles.button,
                                isActive && { backgroundColor: theme.primary, borderColor: theme.primary },
                                !isActive && { borderColor: theme.inactive },
                            ]}
                            onPress={() => onChange(optionValue)}
                            accessibilityLabel={accessibilityLabel ?? label}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: isActive }}
                        >
                            <Icon size={20} color={isActive ? '#000' : theme.text} />
                            <Text style={[styles.text, { color: isActive ? '#000' : theme.text }]}>
                                {label}
                            </Text>
                        </TouchableOpacity>
                    </React.Fragment>
                )
            })}
        </View>
    )
}

export default SegmentedToggle

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 15,
        borderWidth: 1,
    },
    text: {
        marginLeft: 8,
        fontWeight: '600',
    },
})
