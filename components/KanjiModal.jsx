import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { answerDisplayText } from '../utils/answers'
import { getFrequencyLabel, formatRadicalList } from '../constants/Courses'
import ThemedView from './ThemedView'

// Detail rows for a kanji, in display order. `format` renders array fields; fields without a value
// are skipped, except `alwaysShow` ones (freq still maps to a real "Rare" label when absent) and
// ones with `emptyText`, which say so instead of disappearing (383 kanji have no kun reading).
const DETAIL_FIELDS = [
    { label: 'Meaning', key: 'meanings', format: answerDisplayText },
    { label: 'Onyomi', key: 'onyomi', format: answerDisplayText, emptyText: 'No on reading' },
    { label: 'Kunyomi', key: 'kunyomi', format: answerDisplayText, emptyText: 'No kun reading' },
    { label: 'Radicals', key: 'radicals', format: formatRadicalList },
    { label: 'Frequency', key: 'freq', format: getFrequencyLabel, alwaysShow: true },
    { label: 'Strokes', key: 'strokes' },
    { label: 'Notes', key: 'notes' },
]

// An empty array counts as "no value" too; plain `if (value)` treats [] as present.
const hasValue = (value) => Array.isArray(value) ? value.length > 0 : value != null && value !== ''

const KanjiModal = ({ isVisible, item, onClose }) => {
    const { theme } = useTheme()

    if (!item) return null

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <ThemedView style={styles.overlay} safe>
                <View style={[styles.box, { backgroundColor: theme.tile }]}>
                    {/* Scrolls when a kanji's details don't fit (small phone, large font); Close
                        stays below it, always reachable. */}
                    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                        <Text style={[styles.kanji, { color: theme.title }]}>
                            {item.character}
                        </Text>

                        <Text style={[styles.meaning, { color: theme.text }]}>
                            {answerDisplayText(item.meanings)}
                        </Text>

                        {DETAIL_FIELDS.map(({ label, key, format, alwaysShow, emptyText }) => {
                            const present = hasValue(item[key])
                            if (!present && !alwaysShow && !emptyText) return null
                            return (
                                <View key={key}>
                                    <Text style={[styles.label, { color: theme.title }]}>{label}</Text>
                                    {present || alwaysShow ? (
                                        <Text style={[styles.value, { color: theme.text }]}>
                                            {format ? format(item[key]) : item[key]}
                                        </Text>
                                    ) : (
                                        <Text style={[styles.value, styles.emptyValue, { color: theme.text }]}>
                                            {emptyText}
                                        </Text>
                                    )}
                                </View>
                            )
                        })}
                    </ScrollView>

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
    )
}

export default KanjiModal

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
        maxHeight: '90%',
    },
    scroll: {
        flexGrow: 0, // as tall as its content, but shrinks (and scrolls) within the box's maxHeight
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
    emptyValue: {
        fontStyle: 'italic',
        opacity: 0.6,
    },
    closeBtn: {
        marginTop: 18,
        padding: 10,
        alignSelf: 'center',
        borderRadius: 10,
    },
})
