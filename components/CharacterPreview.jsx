import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import Animated from 'react-native-reanimated'
import { useTheme } from '../context/ThemeContext'
import { answerDisplayText } from '../hooks/useQuizEngine'
import { useFocusHighlight } from '../hooks/useFocusHighlight'

import ThemedView from './ThemedView'
import FocusLoadingOverlay from './FocusLoadingOverlay'

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity)

// Shared preview grid for Kana and Radicals: tiles showing a character (mainKey) with a label
// under it (subKey). Kanji uses KanjiPreview instead (it opens a details modal on tap).
const CharacterPreview = ({ groupedData, mainKey = 'kana', subKey = 'romaji', subFontSize = 21, focusChar }) => {
    const { theme } = useTheme()
    const { scrollRef, contentRef, targetRef, highlightStyle, loading } = useFocusHighlight(focusChar)

    return (
        <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
            >
              <View ref={contentRef}>
                {groupedData.map((group, index) => (
                    <FlatList
                        key={index}
                        data={group.items}
                        numColumns={group.numColumns}
                        scrollEnabled={false} // scroll only the outer ScrollView
                        initialNumToRender={focusChar ? group.items.length : 10}
                        keyExtractor={(item, i) => i.toString()}
                        renderItem={({ item }) => {
                            const isFocus = item[mainKey] === focusChar
                            return (
                                <AnimatedTouchable
                                    ref={isFocus ? targetRef : undefined}
                                    style={[styles.tile, { backgroundColor: theme.tile }, isFocus && highlightStyle]}
                                    accessibilityLabel={`${item[mainKey]}, ${answerDisplayText(item[subKey])}`}
                                >
                                    <Text style={[styles.main, { color: theme.title }]}>{item[mainKey]}</Text>
                                    <Text style={[styles.sub, { color: theme.text, fontSize: subFontSize }]}>{answerDisplayText(item[subKey])}</Text>
                                </AnimatedTouchable>
                            )
                        }}
                    />
                ))}
              </View>
            </ScrollView>

            {loading && <FocusLoadingOverlay char={focusChar} />}
        </ThemedView>
    )
}

export default CharacterPreview


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-evenly',
    },
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
    sub: {},
})
