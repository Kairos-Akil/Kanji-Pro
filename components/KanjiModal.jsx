import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { answerDisplayText } from '../hooks/useQuizEngine';
import { getFrequencyLabel, formatRadicalList } from '../constants/Courses';
import ThemedView from './ThemedView';

// Detail rows for a kanji, in display order. `format` renders array fields; fields without a value
// are skipped, except `alwaysShow` ones (freq still maps to a real "Rare" label when absent).
const DETAIL_FIELDS = [
    { label: 'Meaning', key: 'meanings', format: answerDisplayText },
    { label: 'Onyomi', key: 'onyomi', format: answerDisplayText },
    { label: 'Kunyomi', key: 'kunyomi', format: answerDisplayText },
    { label: 'Radicals', key: 'radicals', format: formatRadicalList },
    { label: 'Frequency', key: 'freq', format: getFrequencyLabel, alwaysShow: true },
    { label: 'Strokes', key: 'strokes' },
    { label: 'Notes', key: 'notes' },
]

const KanjiModal = ({ visible, item, onClose }) => {
    const { theme } = useTheme();

    if (!item) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <ThemedView style={styles.overlay} safe={true}>
                <View style={[styles.box, { backgroundColor: theme.tile }]}>

                    <Text style={[styles.kanji, { color: theme.title }]}>
                        {item.character}
                    </Text>

                    <Text style={[styles.meaning, { color: theme.text }]}>
                        {answerDisplayText(item.meanings)}
                    </Text>

                    {DETAIL_FIELDS.map(({ label, key, format, alwaysShow }) => (
                        (alwaysShow || item[key]) ? (
                            <View key={key}>
                                <Text style={[styles.label, { color: theme.title }]}>{label}</Text>
                                <Text style={[styles.value, { color: theme.text }]}>
                                    {format ? format(item[key]) : item[key]}
                                </Text>
                            </View>
                        ) : null
                    ))}

                    <TouchableOpacity
                        onPress={onClose}
                        style={[styles.closeBtn, { backgroundColor: theme.background }]}
                        accessibilityLabel="Close"
                        accessibilityRole="button"
                    >
                        <Text style={{ color: theme.text }}>Close</Text>
                    </TouchableOpacity>
                </View>
            </ThemedView>
        </Modal>
    );
};

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
    kanji: {
        fontSize: 48,
        textAlign: 'center',
    },
    meaning: {
        fontSize: 20,
        textAlign: 'center',
        marginBottom: 12,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 10,
    },
    value: {
        fontSize: 16,
        marginTop: 2,
    },
    closeBtn: {
        marginTop: 18,
        padding: 10,
        alignSelf: 'center',
        borderRadius: 10,
    },
});

export default KanjiModal;

