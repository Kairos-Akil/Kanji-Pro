import { useCallback, useState } from 'react'
import { Text, StyleSheet } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { answerDisplayText } from '../utils/answers'
import PreviewGrid, { PreviewTile } from './PreviewGrid'
import KanjiModal from './KanjiModal'

// Kanji preview: tiles with character + meaning; tapping one opens KanjiModal with the details.
const KanjiPreview = ({ groupedData, focusChar }) => {
    const { theme } = useTheme()

    const [selectedItem, setSelectedItem] = useState(null)
    const [modalVisible, setModalVisible] = useState(false)

    const renderTile = useCallback((item, highlightStyle) => (
        <PreviewTile
            highlightStyle={highlightStyle}
            style={styles.tile}
            onPress={() => {
                setSelectedItem(item)
                setModalVisible(true)
            }}
            accessibilityLabel={`${item.character}, ${answerDisplayText(item.meanings)}, tap for more info`}
            accessibilityRole="button"
        >
            <Text style={[styles.kanji, { color: theme.title }]}>{item.character}</Text>
            <Text style={[styles.meaning, { color: theme.text }]} numberOfLines={2}>
                {answerDisplayText(item.meanings)}
            </Text>
            <Text style={[styles.info, { color: theme.text }]}>tap for more info</Text>
        </PreviewTile>
    ), [theme])

    return (
        <>
            <PreviewGrid groupedData={groupedData} idKey="character" focusChar={focusChar} renderTile={renderTile} />

            <KanjiModal
                isVisible={modalVisible}
                item={selectedItem}
                onClose={() => setModalVisible(false)}
            />
        </>
    )
}

export default KanjiPreview

const styles = StyleSheet.create({
    tile: {
        padding: 10,
        minHeight: 140,
    },
    kanji: {
        fontSize: 40,
        fontWeight: '600',
    },
    meaning: {
        fontSize: 17,
        marginTop: 4,
    },
    info: {
        fontSize: 10,
        marginTop: 4,
    },
})
