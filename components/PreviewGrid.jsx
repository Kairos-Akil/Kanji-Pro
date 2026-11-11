import { Fragment, useMemo } from 'react'
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native'
import Animated from 'react-native-reanimated'
import { useTheme } from '../context/ThemeContext'
import { useFocusHighlight } from '../hooks/useFocusHighlight'
import ThemedView from './ThemedView'
import FocusLoadingOverlay from './FocusLoadingOverlay'

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity)

// One grid tile with the theme's tile color. Pass renderTile's highlightStyle through: only the
// highlighted tile (a search result) needs the heavier animated component. Other props
// (onPress, accessibility) go to the touchable.
export const PreviewTile = ({ highlightStyle, style, ...props }) => {
    const { theme } = useTheme()
    const Tile = highlightStyle ? AnimatedTouchable : TouchableOpacity
    return <Tile style={[styles.tile, { backgroundColor: theme.tile }, style, highlightStyle]} {...props} />
}

// Split each group into rows of its column count, so one list can hold groups with different
// column counts (Hiragana Basic mixes 5-, 3-, 2- and 1-column rows).
const buildRows = (groupedData) => groupedData.flatMap((group, g) => {
    const rows = []
    for (let i = 0; i < group.items.length; i += group.numColumns) {
        rows.push({ key: `${g}-${i}`, items: group.items.slice(i, i + group.numColumns) })
    }
    return rows
})

// Shared grid for every course preview. One scrolling FlatList of rows, so only rows near the
// screen are rendered (N1 Tier 3 has ~140). A search result (focusChar) is reached with
// scrollToIndex instead of rendering every tile up front.
// renderTile(item, highlightStyle) draws one tile; highlightStyle is only set for the focused one.
const PreviewGrid = ({ groupedData, idKey, focusChar, renderTile }) => {
    const rows = useMemo(() => buildRows(groupedData), [groupedData])
    const targetRow = focusChar
        ? rows.findIndex(row => row.items.some(item => item[idKey] === focusChar))
        : -1
    const { listRef, onScrollToIndexFailed, highlightStyle, loading } = useFocusHighlight(focusChar, targetRow)

    return (
        <ThemedView style={styles.container}>
            <FlatList
                ref={listRef}
                data={rows}
                keyExtractor={row => row.key}
                renderItem={({ item: row }) => (
                    // Tiles use flex: 1, so the tiles of a short last row stretch to fill it.
                    <View style={styles.row}>
                        {row.items.map((item, i) => (
                            <Fragment key={i}>
                                {renderTile(item, item[idKey] === focusChar ? highlightStyle : null)}
                            </Fragment>
                        ))}
                    </View>
                )}
                onScrollToIndexFailed={onScrollToIndexFailed}
                showsVerticalScrollIndicator={false}
            />

            {loading && <FocusLoadingOverlay char={focusChar} />}
        </ThemedView>
    )
}

export default PreviewGrid

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
    },
    tile: {
        flex: 1,
        margin: 4,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
})
