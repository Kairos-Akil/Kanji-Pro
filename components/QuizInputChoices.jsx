import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { answersMatch, answerDisplayText } from '../utils/answers'

// Multiple-choice answer buttons. After answering (showAnswer) they show the result: the picked
// button fills blue if right or turns dashed red if wrong, and the right answer fills green.
const QuizInputChoices = ({
    options,
    onSelect,
    showAnswer,
    selectedChoice,
    correctChoice,
    answerKey = 'romaji', // field shown on the buttons (e.g. 'meanings' for kanji)
}) => {
    const { theme } = useTheme()

    return (
        <View style={styles.optionsContainer}>
            {options.map((option, index) => {
                const isCorrect = answersMatch(option[answerKey], correctChoice[answerKey])
                const isSelected = selectedChoice && answersMatch(option[answerKey], selectedChoice[answerKey])

                let borderColor = theme.text
                let backgroundColor = theme.background
                let borderStyle = 'solid'

                if (showAnswer) {
                    if (isCorrect && isSelected) {
                        borderColor = theme.primary
                        backgroundColor = theme.primary
                    } else if (isSelected) {
                        borderColor = theme.error
                        backgroundColor = 'rgba(239, 68, 68, 0.3)' // theme.error at 30% opacity
                        borderStyle = 'dashed'
                    } else if (isCorrect) {
                        borderColor = theme.success
                        backgroundColor = theme.success
                    }
                }

                return (
                    <TouchableOpacity
                        key={index}
                        style={[styles.option, { backgroundColor, borderColor, borderStyle }]}
                        onPress={() => !showAnswer && onSelect(option)}
                        activeOpacity={0.7}
                        accessibilityLabel={answerDisplayText(option[answerKey])}
                        accessibilityRole="button"
                        // After answering: buttons are inactive, and the tapped one is "selected".
                        // aria-* (not accessibilityState): works on phones and on web.
                        aria-disabled={showAnswer}
                        aria-selected={showAnswer && isSelected}
                    >
                        <Text style={[styles.optionText, { color: theme.title }]}>
                            {answerDisplayText(option[answerKey])}
                        </Text>
                    </TouchableOpacity>
                )
            })}
        </View>
    )
}

export default QuizInputChoices

const styles = StyleSheet.create({
    optionsContainer: {
        width: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-evenly',
    },
    option: {
        width: '43%',
        paddingVertical: 40,
        borderRadius: 20,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 8,
    },
    optionText: {
        fontSize: 28,
        fontWeight: '500',
    },
})
