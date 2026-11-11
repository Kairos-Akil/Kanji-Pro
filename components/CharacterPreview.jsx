import { useCallback } from 'react'
import { Text, StyleSheet } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { answerDisplayText } from '../utils/answers'
import PreviewGrid, { PreviewTile } from './PreviewGrid'

// Kana and Radicals preview: tiles showing a character (mainKey) with a label under it (subKey).
// Kanji uses KanjiPreview instead (it opens a details modal on tap).
const CharacterPreview = ({ groupedData, mainKey, subKey, subFontSize = 21, focusChar }) => {
    const { theme } = useTheme()

    const renderTile = useCallback((item, highlightStyle) => (
        <PreviewTile
            highlightStyle={highlightStyle}
            style={styles.tile}
            accessibilityLabel={`${item[mainKey]}, ${answerDisplayText(item[subKey])}`}
        >
            <Text style={[styles.main, { color: theme.title }]}>{item[mainKey]}</Text>
            <Text style={{ color: theme.text, fontSize: subFontSize }}>
                {answerDisplayText(item[subKey])}
            </Text>
        </PreviewTile>
    ), [theme, mainKey, subKey, subFontSize])

    return <PreviewGrid groupedData={groupedData} idKey={mainKey} focusChar={focusChar} renderTile={renderTile} />
}

export default CharacterPreview

const styles = StyleSheet.create({
    tile: {
        height: 99,
    },
    main: {
        fontSize: 29,
    },
})
