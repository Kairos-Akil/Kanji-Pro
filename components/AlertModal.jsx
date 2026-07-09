import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import ThemedView from './ThemedView'

// Renders an alert as a real Modal instead of OS-level Alert.alert, which doesn't render on web.
// Driven by the useAlert() hook in AlertContext.
const AlertModal = ({ visible, title, message, buttons, onButtonPress }) => {
    const { theme } = useTheme()

    // Android back button acts like Cancel (or a plain dismiss if there's no Cancel button), so it
    // never triggers a destructive action's onPress.
    const handleRequestClose = () => {
        onButtonPress(buttons.find(b => b.style === 'cancel') ?? { text: 'Dismiss' })
    }

    return (
        <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={handleRequestClose}>
            <ThemedView style={styles.overlay} safe={true}>
                <View style={[styles.box, { backgroundColor: theme.tile }]}>
                    {title ? <Text style={[styles.title, { color: theme.title }]}>{title}</Text> : null}
                    {message ? <Text style={[styles.message, { color: theme.text }]}>{message}</Text> : null}

                    <View style={styles.buttonRow}>
                        {buttons.map((button, index) => {
                            const isCancel = button.style === 'cancel'
                            const isDestructive = button.style === 'destructive'
                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.button,
                                        isCancel && { backgroundColor: theme.navBackground },
                                        isDestructive && { backgroundColor: theme.error },
                                        !isCancel && !isDestructive && { backgroundColor: theme.primary },
                                    ]}
                                    onPress={() => onButtonPress(button)}
                                    accessibilityLabel={button.text}
                                    accessibilityRole="button"
                                >
                                    <Text style={[styles.buttonText, { color: isCancel ? theme.text : '#000' }]}>
                                        {button.text}
                                    </Text>
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                </View>
            </ThemedView>
        </Modal>
    )
}

export default AlertModal

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    box: {
        padding: 20,
        borderRadius: 14,
        width: '90%',
        maxWidth: 400,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 21,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 15,
        fontWeight: '700',
    },
})
