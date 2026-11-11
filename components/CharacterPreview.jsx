import { useCallback } from 'react'
import { Text, TouchableOpacity, StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'
import { useTheme } from '../context/ThemeContext'
import { answerDisplayText } from '../utils/answers'
import PreviewGrid from './PreviewGrid'

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity)

// Kana and Radicals preview: tiles showing a character (mainKey) with a label under it (subKey).
// Kanji uses KanjiPreview instead (it opens a details modal on tap).
const CharacterPreview = ({ groupedData, mainKey, subKey, subFontSize = 21, focusChar }) => {
    const { theme } = useTheme()

    // Only the highlighted tile needs the heavier animated component.
    const renderTile = useCallback((item, highlightStyle) => {
        const Tile = highlightStyle ? AnimatedTouchable : TouchableOpacity
        return (
            <Tile
                style={[styles.tile, { backgroundColor: theme.tile }, highlightStyle]}
                accessibilityLabel={`${item[mainKey]}, ${answerDisplayText(item[subKey])}`}
            >
                <Text style={[styles.main, { color: theme.title }]}>{item[mainKey]}</Text>
                <Text style={{ color: theme.text, fontSize: subFontSize }}>
                    {answerDisplayText(item[subKey])}
                </Text>
            </Tile>
        )
    }, [theme, mainKey, subKey, subFontSize])

    return <PreviewGrid groupedData={groupedData} idKey={mainKey} focusChar={focusChar} renderTile={renderTile} />
}

export default CharacterPreview

const styles = StyleSheet.create({
    tile: {
        flex: 1,
        margin: 4,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        height: 99,
    },
    main: {
        fontSize: 29,
    },
})
