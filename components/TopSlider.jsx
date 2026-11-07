import { useState, useCallback, useEffect } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../context/ThemeContext'
import { StatusBar } from 'expo-status-bar'
import { TopTabs } from 'expo-router/js-top-tabs'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect, usePathname } from 'expo-router'

import BottomBar from './BottomBar'
import QuizSettings, { loadQuizSettings, DEFAULT_MAX_STARS } from './QuizSettings'
import { useProgress } from '../context/ProgressContext'
import { LAST_ACTIVE_STORAGE_KEY } from '../constants/Courses'

// Rendered by a course folder's _layout.jsx. Each tab is a route file in that folder (tab.name =
// file name), so the URL picks the tab: /KanjiN5_Page/kanjiN5Tier2 opens Tier 2 directly.
const TopSlider = ({ tabs = [] }) => {
    const insets = useSafeAreaInsets()
    const { theme } = useTheme()
    const { getLearnedCount } = useProgress()
    const pathname = usePathname()

    const [settingsVisible, setSettingsVisible] = useState(false)
    const [maxStars, setMaxStars] = useState(DEFAULT_MAX_STARS)
    // The active tab is the last path segment, e.g. "hiraganaBasic".
    const activeTabName = pathname.split('/').pop()

    const loadSettings = async () => {
        try {
            const saved = await loadQuizSettings()
            setMaxStars(saved.maxStars)
        } catch (e) {
            console.warn('Error loading settings', e)
        }
    }

    // Reload on focus. settingsVisible is a dep only to re-run when the settings sheet closes.
    useFocusEffect(
        useCallback(() => {
            loadSettings()
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [settingsVisible])
    )

    // "learned / total" for the active tab. No tab matches while another screen (e.g. a quiz) is
    // on top, since the URL then points there.
    const currentTabObj = tabs.find(t => t.name === activeTabName)
    let progressString = ''

    if (currentTabObj) {
        const itemIds = currentTabObj.data.map(item => item[currentTabObj.idKey])
        const learnedCount = getLearnedCount(currentTabObj.id, itemIds, maxStars)
        progressString = `${learnedCount}/${currentTabObj.totalItems}`
    }

    // Remember the active tab so Home's "Continue" card can jump back into it.
    useEffect(() => {
        if (currentTabObj?.id) {
            AsyncStorage.setItem(LAST_ACTIVE_STORAGE_KEY, currentTabObj.id)
        }
    }, [currentTabObj?.id])

    return (
        <>
            <StatusBar style="auto" />

            <QuizSettings
                isVisible={settingsVisible}
                onClose={() => {
                    setSettingsVisible(false)
                    loadSettings()
                }}
                // Quiz Content (meanings/readings) applies only to kanji quizzes.
                showQuizContent={tabs.some(tab => tab.id?.startsWith('kanji_'))}
            />

            <View
                style={{
                    flex: 1,
                    backgroundColor: theme.navBackground,
                    paddingTop: insets.top,
                    paddingBottom: insets.bottom,
                }}
            >
                <TopTabs
                    screenOptions={{
                        headerShown: false,
                        swipeEnabled: true,
                        tabBarStyle: { backgroundColor: theme.navBackground },
                        tabBarIndicatorStyle: {
                            backgroundColor: theme.primary
                        },
                        tabBarActiveTintColor: theme.primary,
                        tabBarInactiveTintColor: theme.title,
                        tabBarLabelStyle: { fontSize: 17 },
                    }}
                >
                    {/* Only declared screens become tabs; the router loads each from its file. */}
                    {tabs.map((tab) => (
                        <TopTabs.Screen
                            key={tab.name}
                            name={tab.name}
                            options={{ title: tab.title }}
                        />
                    ))}
                </TopTabs>

                <BottomBar
                    onOpenSettings={() => setSettingsVisible(true)}
                    progress={progressString}
                />

            </View>
        </>
    )
}

export default TopSlider