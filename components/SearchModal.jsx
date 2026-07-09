import { useState, useMemo, useEffect } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../context/ThemeContext'
import { answerDisplayText } from '../hooks/useQuizEngine'
import { SEARCH_INDEX } from '../constants/Courses'
import BottomSheet from './BottomSheet'

const MAX_RESULTS = 50

// Global search over every course's data (kana, kanji, radicals) by character or meaning/romaji.
// Tapping a result opens that item's course page and passes `focus` so the grid scrolls to and
// highlights the item.
const SearchModal = ({ isVisible, onClose }) => {
    const { theme } = useTheme()
    const [query, setQuery] = useState('')

    // Start fresh each time the modal opens rather than showing a stale search.
    useEffect(() => {
        if (isVisible) setQuery('')
    }, [isVisible])

    const results = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return []

        return SEARCH_INDEX
            .filter(entry =>
                entry.char.toLowerCase().includes(q) ||
                answerDisplayText(entry.answer).toLowerCase().includes(q)
            )
            .slice(0, MAX_RESULTS)
    }, [query])

    const handleSelect = (item) => {
        onClose()
        router.push({ pathname: item.route, params: { focus: item.char } })
    }

    return (
        <BottomSheet isVisible={isVisible} onClose={onClose} title="Search" heightPercent="90%">
            <View style={[styles.inputRow, { backgroundColor: theme.tile }]}>
                <Ionicons name="search-outline" size={20} color={theme.text} />
                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search by character or meaning"
                    placeholderTextColor={theme.inactive}
                    style={[styles.input, { color: theme.title }]}
                    autoFocus
                    autoCorrect={false}
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search">
                        <Ionicons name="close-circle" size={20} color={theme.inactive} />
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={results}
                keyExtractor={item => item.key}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <Text style={[styles.emptyText, { color: theme.inactive }]}>
                        {query.trim() ? 'No matches found' : 'Type a character or meaning to search'}
                    </Text>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.resultRow, { borderBottomColor: theme.tile }]}
                        onPress={() => handleSelect(item)}
                        accessibilityLabel={`${item.char}, ${answerDisplayText(item.answer)}, ${item.courseTitle} ${item.courseSubtitle}`}
                        accessibilityRole="button"
                    >
                        <Text style={[styles.resultChar, { color: theme.title }]}>{item.char}</Text>
                        <View style={styles.resultTextCol}>
                            <Text style={[styles.resultAnswer, { color: theme.text }]} numberOfLines={1}>
                                {answerDisplayText(item.answer)}
                            </Text>
                            <Text style={[styles.resultCourse, { color: theme.inactive }]}>
                                {item.courseTitle} · {item.courseSubtitle}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </BottomSheet>
    )
}

export default SearchModal

const styles = StyleSheet.create({
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 46,
        gap: 10,
        marginBottom: 15,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    resultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        gap: 14,
    },
    resultChar: {
        fontSize: 28,
        width: 46,
        textAlign: 'center',
    },
    resultTextCol: {
        flex: 1,
    },
    resultAnswer: {
        fontSize: 16,
        fontWeight: '600',
    },
    resultCourse: {
        fontSize: 12,
        opacity: 0.7,
        marginTop: 2,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 14,
    },
})
