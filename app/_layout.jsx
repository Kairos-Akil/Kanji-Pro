import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { setAudioModeAsync } from 'expo-audio'
import { ProgressProvider } from '../context/ProgressContext'
import { ThemeProvider, useTheme } from '../context/ThemeContext'
import { AppSettingsProvider } from '../context/AppSettingsContext'
import { AlertProvider } from '../context/AlertContext'

// 'mixWithOthers' skips the Android audio-focus request whose latency dropped the first sound of
// a session; playsInSilentMode lets effects play on iOS with the ringer off.
const configureAudio = () => {
  setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'mixWithOthers',
    shouldPlayInBackground: false,
  }).catch((e) => console.log('Failed to configure audio mode', e))
}

const RootLayoutNav = () => {
  const { theme, mode } = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
      <Stack screenOptions={{
        headerStyle: { backgroundColor: theme.navBackground },
        headerTintColor: theme.title,
      }}>
        <Stack.Screen name="index" options={{ title: 'Home', headerShown: false }} />
        <Stack.Screen name="Hiragana_Page" options={{ title: 'Hiragana', headerShown: false }} />
        <Stack.Screen name="Katakana_Page" options={{ title: 'Katakana', headerShown: false }} />
        <Stack.Screen name="KanjiN5_Page" options={{ title: 'KanjiN5', headerShown: false }} />
        <Stack.Screen name="KanjiN4_Page" options={{ title: 'KanjiN4', headerShown: false }} />
        <Stack.Screen name="KanjiN3_Page" options={{ title: 'KanjiN3', headerShown: false }} />
        <Stack.Screen name="KanjiN2_Page" options={{ title: 'KanjiN2', headerShown: false }} />
        <Stack.Screen name="KanjiN1_Page" options={{ title: 'KanjiN1', headerShown: false }} />
        <Stack.Screen name="RadicalsLevel1_Page" options={{ title: 'Radicals Level 1', headerShown: false }} />
        <Stack.Screen name="RadicalsLevel2_Page" options={{ title: 'Radicals Level 2', headerShown: false }} />
        <Stack.Screen name="RadicalsLevel3_Page" options={{ title: 'Radicals Level 3', headerShown: false }} />
        <Stack.Screen name="RadicalsVariants_Page" options={{ title: 'Radicals Variants', headerShown: false }} />
        <Stack.Screen name="Explain_Page/Kana" options={{ title: '', headerShown: false }} />
        <Stack.Screen name="Explain_Page/Kanji" options={{ title: '', headerShown: false }} />
        <Stack.Screen name="Explain_Page/Radicals" options={{ title: '', headerShown: false }} />
        <Stack.Screen name="Quiz_Page" options={{ title: '', headerShown: true }} />
      </Stack>
    </View>
  )
}

const RootLayout = () => {
  useEffect(() => {
    configureAudio()
  }, [])

  return (
    <ThemeProvider>
      <AlertProvider>
        <AppSettingsProvider>
          <ProgressProvider>
            <RootLayoutNav />
          </ProgressProvider>
        </AppSettingsProvider>
      </AlertProvider>
    </ThemeProvider>
  )
}

export default RootLayout

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
})
