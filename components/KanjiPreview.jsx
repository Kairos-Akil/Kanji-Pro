import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useState } from 'react';
import Animated from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { answerDisplayText } from '../hooks/useQuizEngine';
import { useFocusHighlight } from '../hooks/useFocusHighlight';
import ThemedView from './ThemedView';
import KanjiModal from './KanjiModal';
import FocusLoadingOverlay from './FocusLoadingOverlay';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const KanjiPreview = ({ groupedData, focusChar }) => {
    const { theme } = useTheme();

    const [selectedItem, setSelectedItem] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const { scrollRef, contentRef, targetRef, highlightStyle, loading } = useFocusHighlight(focusChar);

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
                        scrollEnabled={false}
                        // From search: render every tile up front so a deep target mounts
                        // immediately instead of after the default render trickle (~2s).
                        initialNumToRender={focusChar ? group.items.length : 10}
                        keyExtractor={(item, i) => i.toString()}
                        renderItem={({ item }) => {
                            const isFocus = item.character === focusChar;
                            return (
                                <AnimatedTouchable
                                    ref={isFocus ? targetRef : undefined}
                                    style={[styles.tile, { backgroundColor: theme.tile }, isFocus && highlightStyle]}
                                    onPress={() => {
                                        setSelectedItem(item);
                                        setModalVisible(true);
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
                                </AnimatedTouchable>
                            );
                        }}
                    />
                ))}
              </View>
            </ScrollView>

            <KanjiModal
                visible={modalVisible}
                item={selectedItem}
                onClose={() => setModalVisible(false)}
            />

            {loading && <FocusLoadingOverlay char={focusChar} />}
        </ThemedView>
    );
};

export default KanjiPreview;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 0,
    },
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
        marginBottom: 0,
    }
});

