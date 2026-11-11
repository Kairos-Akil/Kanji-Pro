import { useEffect, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { Stack, ThemeProvider as NavigationThemeProvider, DarkTheme, DefaultTheme } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
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
    }).catch((e) => console.warn('Failed to configure audio mode', e))
}

// Course screen titles. Never shown as a heading (those headers are hidden), but the quiz's back
// button is named after the screen below it: its label on iOS and for screen readers ("KanjiN5,
// back"). Without a title it would fall back to the folder name ("KanjiN5_Page").
const COURSE_SCREEN_TITLES = {
    Hiragana_Page: 'Hiragana',
    Katakana_Page: 'Katakana',
    KanjiN5_Page: 'KanjiN5',
    KanjiN4_Page: 'KanjiN4',
    KanjiN3_Page: 'KanjiN3',
    KanjiN2_Page: 'KanjiN2',
    KanjiN1_Page: 'KanjiN1',
    RadicalsLevel1_Page: 'Radicals Level 1',
    RadicalsLevel2_Page: 'Radicals Level 2',
    RadicalsLevel3_Page: 'Radicals Level 3',
    RadicalsVariants_Page: 'Radicals Variants',
}

// Keep the native splash (black logo screen) up until the saved theme is known; otherwise Light and
// OLED users would see the default dark theme for a moment at app start.
SplashScreen.preventAutoHideAsync().catch(() => {})
const hideSplash = () => SplashScreen.hideAsync().catch(() => {})

const RootLayoutNav = () => {
    const { theme, mode, themeLoaded } = useTheme()

    // Every screen sits on a navigation "card". Without our colors here, its default light gray
    // shows through whenever a screen draws nothing for a moment (e.g. while a quiz loads its
    // settings).
    const navigationTheme = useMemo(() => {
        const base = mode === 'light' ? DefaultTheme : DarkTheme
        return {
            ...base,
            colors: {
                ...base.colors,
                background: theme.background,
                card: theme.navBackground,
                text: theme.title,
                primary: theme.primary,
            },
        }
    }, [theme, mode])

    // Nothing to draw yet: the splash still covers the screen. themeLoaded also turns true when the
    // read fails (defaults are used then), so the splash can never stay up forever.
    if (!themeLoaded) return null

    return (
        <NavigationThemeProvider value={navigationTheme}>
            {/* onLayout: hide the splash once the first frame with the right theme is laid out. */}
            <View style={[styles.container, { backgroundColor: theme.background }]} onLayout={hideSplash}>
                <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
                {/* Screens draw their own headers; only the quiz uses the navigation header (back
                    button). Screens not listed here are added automatically from app/. */}
                <Stack screenOptions={{
                    headerShown: false,
                    headerStyle: { backgroundColor: theme.navBackground },
                    headerTintColor: theme.title,
                }}>
                    <Stack.Screen name="index" options={{ title: 'Home' }} />
                    {Object.entries(COURSE_SCREEN_TITLES).map(([name, title]) => (
                        <Stack.Screen key={name} name={name} options={{ title }} />
                    ))}
                    <Stack.Screen name="Quiz_Page" options={{ title: '', headerShown: true }} />
                </Stack>
            </View>
        </NavigationThemeProvider>
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
    },
})
