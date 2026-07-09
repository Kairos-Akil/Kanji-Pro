import { useState, useCallback, useEffect } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../context/ThemeContext'
import { StatusBar } from 'expo-status-bar'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native'

import BottomBar from './BottomBar'
import QuizSettings, { loadQuizSettings, DEFAULT_MAX_STARS } from './QuizSettings'
import { useProgress } from '../context/ProgressContext'
import { LAST_ACTIVE_STORAGE_KEY } from '../constants/Courses'

const Tab = createMaterialTopTabNavigator()

const TopSlider = ({ tabs = [] }) => {
    const insets = useSafeAreaInsets()
    const { theme } = useTheme()
    const { getLearnedCount } = useProgress()

    const [settingsVisible, setSettingsVisible] = useState(false)
    const [maxStars, setMaxStars] = useState(DEFAULT_MAX_STARS)
    const [activeTabName, setActiveTabName] = useState(tabs[0]?.name || '')

    const loadSettings = async () => {
        try {
            const saved = await loadQuizSettings()
            setMaxStars(saved.maxStars)
        } catch (e) {
            console.log('Error loading settings', e)
        }
    }

    // Reload on focus. settingsVisible is a dep only to re-run when the settings sheet closes.
    useFocusEffect(
        useCallback(() => {
            loadSettings()
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [settingsVisible])
    )

    // "learned / total" for the active tab. idKey lets non-kana tracks point at their own field.
    const currentTabObj = tabs.find(t => t.name === activeTabName)
    let progressString = ""

    if (currentTabObj && currentTabObj.id && currentTabObj.data) {
        const idKey = currentTabObj.idKey || 'kana'
        const itemIds = currentTabObj.data.map(item => item[idKey])
        const learnedCount = getLearnedCount(currentTabObj.id, itemIds, maxStars)
        progressString = `${learnedCount}/${currentTabObj.totalItems}`
    } else if (currentTabObj) {
        progressString = `0/${currentTabObj.totalItems}`
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
                <Tab.Navigator
                    // Track the active tab so the progress string reflects the visible track.
                    screenListeners={{
                        state: (e) => {
                            const index = e.data.state.index
                            const routeName = e.data.state.routeNames[index]
                            setActiveTabName(routeName)
                        },
                    }}
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
                    {tabs.map((tab) => (
                        <Tab.Screen
                            key={tab.name}
                            name={tab.name}
                            component={tab.component}
                            options={{ title: tab.title }}
                        />
                    ))}
                </Tab.Navigator>

                <BottomBar
                    onOpenSettings={() => setSettingsVisible(true)}
                    progress={progressString}
                />

            </View>
        </>
    )
}

export default TopSlider