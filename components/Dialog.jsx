import { Modal, View, StyleSheet } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import ThemedView from './ThemedView'

// A centered box over a dimmed screen, used by AlertModal and KanjiModal. onRequestClose runs on
// Android's back button. boxStyle adds size limits per dialog.
const Dialog = ({ isVisible, onRequestClose, boxStyle, children }) => {
    const { theme } = useTheme()

    return (
        <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onRequestClose}>
            <ThemedView style={styles.overlay} safe>
                <View style={[styles.box, { backgroundColor: theme.tile }, boxStyle]}>
                    {children}
                </View>
            </ThemedView>
        </Modal>
    )
}

export default Dialog

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
    },
})
