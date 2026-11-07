import { Stack } from 'expo-router'

// Every quiz screen hides its own header; the root Quiz_Page header (back button) is enough.
const QuizLayout = () => <Stack screenOptions={{ headerShown: false }} />

export default QuizLayout
