import { useState, useCallback, useEffect } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../context/ThemeContext'
import { StatusBar } from 'expo-status-bar'
import { TopTabs } from 'expo-router/js-top-tabs'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect, usePathname } from 'expo-router'

import BottomBar from './BottomBar'
import QuizSettings from './QuizSettings'
import { useProgressActions, useProgressMeta } from '../context/ProgressContext'
import { LAST_ACTIVE_STORAGE_KEY } from '../constants/Courses'

// Rendered by a course folder's _layout.jsx. Each tab is a route file in that folder (tab.name =
// file name), so the URL picks the tab: /KanjiN5_Page/kanjiN5Tier2 opens Tier 2 directly.
const TopSlider = ({ tabs = [] }) => {
    const insets = useSafeAreaInsets()
    const { theme } = useTheme()
    // Stable actions, not the live progress: this page stays mounted (hidden) under an open quiz,
    // and subscribing to live progress re-rendered it on every answer.
    const { getLearnedCount } = useProgressActions()
    const { progressLoaded } = useProgressMeta()
    const pathname = usePathname()

    const [settingsVisible, setSettingsVisible] = useState(false)
    // Learned count per tab id, recomputed when the page is shown again (see below).
    const [learnedByTab, setLearnedByTab] = useState({})
    // The active tab is the last path segment, e.g. "hiraganaBasic".
    const activeTabName = pathname.split('/').pop()

    const refreshCounts = () => {
        setLearnedByTab(Object.fromEntries(tabs.map(tab => [
            tab.id,
            getLearnedCount(tab.id, tab.data.map(item => item[tab.idKey])),
        ])))
    }

    // Recount when the page is shown again, e.g. back from a quiz.
    useFocusEffect(
        useCallback(() => {
            refreshCounts()
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [])
    )

    // Opened before the saved progress finished loading (e.g. straight from a link): count again
    // once it has, since nothing else would trigger a recount.
    useEffect(() => {
        if (progressLoaded) refreshCounts()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [progressLoaded])

    // "learned / total" for the active tab. No tab matches while another screen (e.g. a quiz) is
    // on top, since the URL then points there.
    const currentTabObj = tabs.find(t => t.name === activeTabName)
    const progressString = currentTabObj
        ? `${learnedByTab[currentTabObj.id] ?? 0}/${currentTabObj.totalItems}`
        : ''

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
                onClose={() => setSettingsVisible(false)}
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