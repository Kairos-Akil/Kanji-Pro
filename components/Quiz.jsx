import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Star, ArrowRight } from 'lucide-react-native'

import { useTheme } from '../context/ThemeContext'
import ThemedView from './ThemedView'
import Spacer from './Spacer'
import QuizInputChoices from './QuizInputChoices'
import QuizInputKeyboard from './QuizInputKeyboard'
import { useQuizEngine, answerDisplayText } from '../hooks/useQuizEngine'

// Learning Mode card: reveals every quizzable answer, with a "Got it" button that grants the first star.
const LearningCard = ({ answers, cardStyle, onContinue, theme }) => (
    <View style={styles.learnCard}>
        <Text style={[styles.learnHint, { color: theme.text }]}>
            Learn this character
        </Text>
        <Animated.View style={[styles.learnAnswerBox, cardStyle]}>
            {answers.map(({ label, text }) => (
                <View key={label ?? 'answer'} style={styles.learnAnswerRow}>
                    {label && (
                        <Text style={[styles.learnAnswerLabel, { color: theme.text }]}>
                            {label}
                        </Text>
                    )}
                    <Text
                        style={[
                            styles.learnAnswer,
                            answers.length > 1 && styles.learnAnswerMulti,
                            { color: theme.title },
                        ]}
                    >
                        {text}
                    </Text>
                </View>
            ))}
        </Animated.View>
        <Pressable
            style={({ pressed }) => [
                styles.gotItBtn,
                { backgroundColor: theme.primary, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={onContinue}
            accessibilityLabel="Got it, next question"
            accessibilityRole="button"
        >
            <Text style={styles.gotItText}>Got it</Text>
            <ArrowRight size={22} color="#000" style={{ marginLeft: 6 }} />
        </Pressable>
    </View>
)

// Multiple-choice/keyboard drill quiz for Kana, Kanji, and Radicals. idKey/answerKey identify an
// item and its answer field; questionModes (kanji) rotates the tested field. See useQuizEngine.
const Quiz = ({ Data, quizId, idKey = 'kana', answerKey = 'romaji', allowKeyboard = true, questionModes = null }) => {
    const { theme } = useTheme()
    const {
        currentItem,
        options,
        showAnswer,
        selectedChoice,
        maxStars,
        inputMode,
        animatedStyle,
        itemProgress,
        learnedCount,
        lastAnswerCorrect,
        handleAnswerSubmit,
        teaching,
        teachingAnswers,
        handleLearningContinue,
        teachCardStyle,
        currentAnswerKey,
        questionLabel,
    } = useQuizEngine({ Data, quizId, idKey, answerKey, allowKeyboard, questionModes })

    // Bottom inset only: the Quiz_Page header already covers the top, so `safe` would double it.
    const insets = useSafeAreaInsets()

    if (!currentItem) return null

    return (
        <ThemedView style={[styles.container, { backgroundColor: theme.background, paddingBottom: insets.bottom }]}>
            {/* Stars + progress row; sits above the flex:1 body so it stays put while it scrolls. */}
            <View style={styles.header}>
                <View style={styles.starRow}>
                    {[...Array(maxStars)].map((_, i) => (
                        <Star
                            key={i}
                            size={20}
                            color={i < itemProgress ? theme.primary : theme.inactive}
                            fill={i < itemProgress ? theme.primary : 'none'}
                            style={styles.star}
                        />
                    ))}
                </View>

                <Text style={[styles.progress, { color: theme.text }]}>
                    {learnedCount} / {Data.length}
                </Text>
            </View>

            {/* Scrollable so a tall keyboard scrolls instead of clipping; centered when it fits. */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Question label (multi-mode only); hidden while teaching, the card shows every field. */}
                {questionLabel && !teaching && (
                    <Text style={[styles.questionLabel, { color: theme.text }]}>
                        {questionLabel}
                    </Text>
                )}

                <Animated.Text style={[styles.char, animatedStyle]}>
                    {currentItem[idKey]}
                </Animated.Text>

                <Spacer height={24} />

                {/* Learning Mode reveals the answers; otherwise keyboard or choice input per setting. */}
                {teaching ? (
                    <LearningCard
                        answers={teachingAnswers}
                        cardStyle={teachCardStyle}
                        onContinue={handleLearningContinue}
                        theme={theme}
                    />
                ) : inputMode === 'keyboard' ? (
                    <QuizInputKeyboard
                        onSubmit={handleAnswerSubmit}
                        showAnswer={showAnswer}
                        correctAnswerText={answerDisplayText(currentItem[currentAnswerKey])}
                        isCorrect={lastAnswerCorrect}
                    />
                ) : (
                    <QuizInputChoices
                        options={options}
                        onSelect={handleAnswerSubmit}
                        selectedChoice={selectedChoice}
                        correctChoice={currentItem}
                        showAnswer={showAnswer}
                        answerKey={currentAnswerKey}
                    />
                )}
            </ScrollView>
        </ThemedView>
    )
}

export default Quiz

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingTop: 15,
        paddingBottom: 5,
        gap: 10,
    },
    starRow: {
        flexDirection: 'row',
        flexWrap: 'wrap', // up to 15 stars wrap instead of pushing the progress numbers off-screen
        justifyContent: 'flex-start',
        flexShrink: 1,
    },
    star: {
        marginHorizontal: 1,
    },
    progress: {
        fontSize: 18,
    },
    questionLabel: {
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 2,
        textTransform: 'uppercase',
        opacity: 0.55,
        marginBottom: 4,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    char: {
        fontSize: 180,
        fontWeight: '500',
        textAlign: 'center',
    },
    learnCard: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    learnHint: {
        fontSize: 15,
        opacity: 0.6,
        marginBottom: 14,
    },
    learnAnswerBox: {
        borderWidth: 2,
        borderRadius: 20,
        paddingVertical: 24,
        paddingHorizontal: 28,
        marginBottom: 28,
        minWidth: '60%',
        alignItems: 'center',
    },
    learnAnswerRow: {
        alignItems: 'center',
        marginVertical: 6,
    },
    learnAnswerLabel: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 2,
        textTransform: 'uppercase',
        opacity: 0.55,
        marginBottom: 2,
    },
    learnAnswer: {
        fontSize: 30,
        fontWeight: '600',
        textAlign: 'center',
    },
    // Smaller text for multi-field cards (kanji), so all rows fit above the button.
    learnAnswerMulti: {
        fontSize: 22,
    },
    gotItBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 48,
        borderRadius: 30,
    },
    gotItText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    },
})
