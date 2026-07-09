import { Stack } from 'expo-router'

const QuizLayout = () => {
    return (
        <>
            <Stack>
                <Stack.Screen name="hiraganaQuiz_Basic" options={{ title: 'Basic Quiz', headerShown: false }} />
                <Stack.Screen name="hiraganaQuiz_Variants" options={{ title: 'Variants Quiz', headerShown: false }} />
                <Stack.Screen name="hiraganaQuiz_Combinations" options={{ title: 'Combinations Quiz', headerShown: false }} />
                <Stack.Screen name="katakanaQuiz_Basic" options={{ title: 'Basic Quiz', headerShown: false }} />
                <Stack.Screen name="katakanaQuiz_Variants" options={{ title: 'Variants Quiz', headerShown: false }} />
                <Stack.Screen name="katakanaQuiz_Combinations" options={{ title: 'Combinations Quiz', headerShown: false }} />
                <Stack.Screen name="kanjiQuiz_N5_Tier1" options={{ title: 'N5 Tier 1 Quiz', headerShown: false }} />
                <Stack.Screen name="kanjiQuiz_N5_Tier2" options={{ title: 'N5 Tier 2 Quiz', headerShown: false }} />
                <Stack.Screen name="kanjiQuiz_N5_Tier3" options={{ title: 'N5 Tier 3 Quiz', headerShown: false }} />
                <Stack.Screen name="kanjiQuiz_N4_Tier1" options={{ title: 'N4 Tier 1 Quiz', headerShown: false }} />
                <Stack.Screen name="kanjiQuiz_N4_Tier2" options={{ title: 'N4 Tier 2 Quiz', headerShown: false }} />
                <Stack.Screen name="kanjiQuiz_N4_Tier3" options={{ title: 'N4 Tier 3 Quiz', headerShown: false }} />
                <Stack.Screen name="kanjiQuiz_N3_Tier1" options={{ title: 'N3 Tier 1 Quiz', headerShown: false }} />
                <Stack.Screen name="kanjiQuiz_N3_Tier2" options={{ title: 'N3 Tier 2 Quiz', headerShown: false }} />
                <Stack.Screen name="kanjiQuiz_N3_Tier3" options={{ title: 'N3 Tier 3 Quiz', headerShown: false }} />
                <Stack.Screen name="kanjiQuiz_N2_Tier1" options={{ title: 'N2 Tier 1 Quiz', headerShown: false }} />
                <Stack.Screen name="kanjiQuiz_N2_Tier2" options={{ title: 'N2 Tier 2 Quiz', headerShown: false }} />
                <Stack.Screen name="kanjiQuiz_N2_Tier3" options={{ title: 'N2 Tier 3 Quiz', headerShown: false }} />
                <Stack.Screen name="kanjiQuiz_N1_Tier1" options={{ title: 'N1 Tier 1 Quiz', headerShown: false }} />
                <Stack.Screen name="kanjiQuiz_N1_Tier2" options={{ title: 'N1 Tier 2 Quiz', headerShown: false }} />
                <Stack.Screen name="kanjiQuiz_N1_Tier3" options={{ title: 'N1 Tier 3 Quiz', headerShown: false }} />
                <Stack.Screen name="radicalsQuiz_Level1" options={{ title: 'Level 1 Quiz', headerShown: false }} />
                <Stack.Screen name="radicalsQuiz_Level2" options={{ title: 'Level 2 Quiz', headerShown: false }} />
                <Stack.Screen name="radicalsQuiz_Level3" options={{ title: 'Level 3 Quiz', headerShown: false }} />
                <Stack.Screen name="radicalsQuiz_Variants" options={{ title: 'Variants Quiz', headerShown: false }} />
            </Stack>
        </>

    )
}

export default QuizLayout