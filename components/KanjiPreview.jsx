import { useCallback, useState } from 'react'
import { Text, TouchableOpacity, StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'
import { useTheme } from '../context/ThemeContext'
import { answerDisplayText } from '../utils/answers'
import PreviewGrid from './PreviewGrid'
import KanjiModal from './KanjiModal'

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity)

// Kanji preview: tiles with character + meaning; tapping one opens KanjiModal with the details.
const KanjiPreview = ({ groupedData, focusChar }) => {
    const { theme } = useTheme()

    const [selectedItem, setSelectedItem] = useState(null)
    const [modalVisible, setModalVisible] = useState(false)

    // Only the highlighted tile needs the heavier animated component.
    const renderTile = useCallback((item, highlightStyle) => {
        const Tile = highlightStyle ? AnimatedTouchable : TouchableOpacity
        return (
            <Tile
                style={[styles.tile, { backgroundColor: theme.tile }, highlightStyle]}
                onPress={() => {
                    setSelectedItem(item)
                    setModalVisible(true)
                }}
                accessibilityLabel={`${item.character}, ${answerDisplayText(item.meanings)}, tap for more info`}
                accessibilityRole="button"
            >
                <Text style={[styles.kanji, { color: theme.title }]}>
                    {item.character}
                </Text>

                <Text style={[styles.meaning, { color: theme.text }]} numberOfLines={2}>
                    {answerDisplayText(item.meanings)}
                </Text>

                <Text style={[styles.info, { color: theme.text }]}>tap for more info</Text>
            </Tile>
        )
    }, [theme])

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
        flex: 1,
        margin: 4,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
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
