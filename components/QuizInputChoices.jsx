import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { answersMatch, answerDisplayText } from '../hooks/useQuizEngine'

const QuizInputChoices = ({
    options,
    onSelect,
    showAnswer,
    selectedChoice,
    correctChoice,
    answerKey = 'romaji' // field shown on the buttons (e.g. 'meanings' for kanji)
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
                        borderStyle = 'solid'
                    }
                    else if (!isCorrect && isSelected) {
                        borderColor = theme.error
                        backgroundColor = 'rgba(239, 68, 68, 0.3)'
                        borderStyle = 'dashed'
                    }
                    else if (isCorrect) {
                        borderColor = theme.success
                        backgroundColor = theme.success
                        borderStyle = 'solid'
                    }
                }

                return (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.option,
                            {
                                backgroundColor,
                                borderColor,
                                borderWidth: 2,
                                borderStyle,
                            }]}
                        onPress={() => !showAnswer && onSelect(option)}
                        activeOpacity={0.7}
                        accessibilityLabel={answerDisplayText(option[answerKey])}
                        accessibilityRole="button"
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
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 8,
    },
    optionText: {
        fontSize: 28,
        fontWeight: '500',
    },
})

export default QuizInputChoices