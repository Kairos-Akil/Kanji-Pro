import { useState, useCallback } from 'react'
import { StyleSheet, View, TouchableOpacity, ScrollView, Text } from 'react-native'
import { router } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import AsyncStorage from '@react-native-async-storage/async-storage'

import ThemedView from './ThemedView'
import ThemedText from './ThemedText'
import AppSettings from './AppSettings'
import SearchModal from './SearchModal'
import InfoModal from './InfoModal'
import { loadQuizSettings, DEFAULT_MAX_STARS } from './QuizSettings'
import { useTheme } from '../context/ThemeContext'
import { useProgress } from '../context/ProgressContext'
import { COURSES, DEFAULT_COURSE_ID, LAST_ACTIVE_STORAGE_KEY, RADICAL_CATEGORY_IDS, KANJI_TIER_IDS_BY_LEVEL } from '../constants/Courses'

const HomePage = () => {
    const { theme } = useTheme()
    const { streakCount, getLearnedCount } = useProgress()
    const [settingsVisible, setSettingsVisible] = useState(false)
    const [searchVisible, setSearchVisible] = useState(false)
    const [infoVisible, setInfoVisible] = useState(false)
    const [activeCourseId, setActiveCourseId] = useState(DEFAULT_COURSE_ID)
    const [maxStars, setMaxStars] = useState(DEFAULT_MAX_STARS)

    // Refresh on focus so the "Continue" card and progress percentages reflect changes made elsewhere.
    useFocusEffect(
        useCallback(() => {
            AsyncStorage.getItem(LAST_ACTIVE_STORAGE_KEY)
                .then(lastActive => {
                    if (lastActive && COURSES[lastActive]) setActiveCourseId(lastActive)
                })
                .catch(err => console.log('Error loading last active course', err))

            loadQuizSettings()
                .then(saved => setMaxStars(saved.maxStars))
                .catch(err => console.log('Error loading mastery level', err))
        }, [])
    )

    const activeCourse = COURSES[activeCourseId] ?? COURSES[DEFAULT_COURSE_ID]

    // Percent learned across the given course ids (a card can span several, e.g. Hiragana's
    // basic/variants/combinations). Null for id-less explainer cards, which skip the progress bar.
    const getCardProgress = (courseIds) => {
        if (!courseIds || courseIds.length === 0) return null

        let learned = 0
        let total = 0
        courseIds.forEach(id => {
            const course = COURSES[id]
            if (!course) return
            const itemIds = course.data.map(item => item[course.idKey])
            learned += getLearnedCount(course.id, itemIds, maxStars)
            total += course.data.length
        })

        return total > 0 ? Math.round((learned / total) * 100) : 0
    }

    const kanaCourses = [
        { title: 'What are Kana?', sub: 'Kana explained', icon: 'bulb', route: '/Explain_Page/Kana' },
        {
            title: 'Hiragana', sub: 'Native Words', icon: 'school', route: '/Hiragana_Page/hiraganaBasic',
            percent: getCardProgress(['hiragana_basic', 'hiragana_variants', 'hiragana_combinations']),
        },
        {
            title: 'Katakana', sub: 'Foreign Words', icon: 'school', route: '/Katakana_Page/katakanaBasic',
            percent: getCardProgress(['katakana_basic', 'katakana_variants', 'katakana_combinations']),
        },
    ]

    // Each N-level card links to its first tier and aggregates progress across all 3 tiers.
    const kanjiLevelCard = (id, title, sub) => {
        const tierIds = KANJI_TIER_IDS_BY_LEVEL[id]
        return { title, sub, icon: 'book', route: COURSES[tierIds[0]].route, percent: getCardProgress(tierIds) }
    }
    const kanjiCourses = [
        { title: 'What are Kanji?', sub: 'Kanji explained', icon: 'bulb', route: '/Explain_Page/Kanji' },
        kanjiLevelCard('kanji_n5', 'Kanji N5', 'Beginner'),
        kanjiLevelCard('kanji_n4', 'Kanji N4', 'Elementary'),
        kanjiLevelCard('kanji_n3', 'Kanji N3', 'Intermediate'),
        kanjiLevelCard('kanji_n2', 'Kanji N2', 'Advanced'),
        kanjiLevelCard('kanji_n1', 'Kanji N1', 'Mastery'),
    ]

    // One card per radical set (3 levels + Variants), sourced from the Courses registry.
    const radicalCourses = [
        { title: 'What are Radicals?', sub: 'Radicals explained', icon: 'bulb', route: '/Explain_Page/Radicals' },
        ...RADICAL_CATEGORY_IDS.map(id => {
            const course = COURSES[id]
            return {
                title: course.subtitle,
                sub: `${course.data.length} radicals`,
                icon: course.icon,
                route: course.route,
                percent: getCardProgress([id]),
            }
        }),
    ]

    // Renders one category's horizontal row of course cards, tinted with accentColor.
    const renderHorizontalSection = (title, subtitle, data, accentColor) => (
        <View style={styles.sectionContainer}>

            <View style={styles.sectionHeader}>
                <View style={styles.titleWrapper}>
                    <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
                    <View>
                        <ThemedText style={styles.sectionTitle} title={true}>{title}</ThemedText>
                        <ThemedText style={styles.sectionSubtitle}>{subtitle}</ThemedText>
                    </View>
                </View>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScrollContent}
                decelerationRate="fast"
                snapToInterval={160}
            >
                {data.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.pathCard,
                            { backgroundColor: theme.uiBackground, borderColor: theme.text }
                        ]}
                        activeOpacity={0.8}
                        onPress={() => router.push(item.route)}
                        accessibilityLabel={`${item.title}, ${item.sub}`}
                        accessibilityRole="button"
                    >
                        {/* '20'/'25' are hex alpha suffixes, tinting the accent color. */}
                        <View style={[styles.iconCircle, { backgroundColor: accentColor + '20' }]}>
                            <Ionicons name={item.icon} size={24} color={accentColor} />
                        </View>

                        <View>
                            <ThemedText style={styles.cardTitle} title={true}>{item.title}</ThemedText>
                            <ThemedText style={styles.cardSub}>{item.sub}</ThemedText>
                        </View>

                        <View style={styles.cardFooter}>
                            {item.percent != null ? (
                                <View style={styles.progressGroup}>
                                    <View style={[styles.progressTrack, { backgroundColor: accentColor + '25' }]}>
                                        <View style={[styles.progressFill, { width: `${item.percent}%`, backgroundColor: accentColor }]} />
                                    </View>
                                    <ThemedText style={styles.progressPercent}>{item.percent}%</ThemedText>
                                </View>
                            ) : <View />}

                            <View style={[styles.arrowBox, { backgroundColor: accentColor }]}>
                                <Ionicons name="arrow-forward" size={16} color="#FFF" />
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    )

    return (
        <ThemedView safe={true} style={styles.container} backgroundColor={theme.background}>

            <AppSettings
                isVisible={settingsVisible}
                onClose={() => setSettingsVisible(false)}
            />

            <SearchModal
                isVisible={searchVisible}
                onClose={() => setSearchVisible(false)}
            />

            <InfoModal
                isVisible={infoVisible}
                onClose={() => setInfoVisible(false)}
            />

            <View style={styles.topBar}>
                <View style={styles.topBarSide}>
                    <TouchableOpacity
                        onPress={() => setInfoVisible(true)}
                        accessibilityLabel="App info"
                        accessibilityRole="button"
                    >
                        <Ionicons name="information-circle-outline" size={28} color="#888" />
                    </TouchableOpacity>
                </View>
                <ThemedText style={styles.appName}>KANJI PRO</ThemedText>
                <View style={[styles.topBarSide, styles.topBarActions]}>
                    <TouchableOpacity
                        onPress={() => setSearchVisible(true)}
                        accessibilityLabel="Search"
                        accessibilityRole="button"
                    >
                        <Ionicons name="search-outline" size={24} color="#888" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setSettingsVisible(true)}
                        accessibilityLabel="Settings"
                        accessibilityRole="button"
                    >
                        <Ionicons name="settings-outline" size={26} color="#888" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 50 }}
            >
                {/* ACTIVE COURSE */}
                <TouchableOpacity
                    activeOpacity={0.95}
                    style={styles.focusContainer}
                    onPress={() => router.push(activeCourse.route)}
                    accessibilityLabel={`Continue ${activeCourse.title} ${activeCourse.subtitle}`}
                    accessibilityRole="button"
                >
                    <LinearGradient
                        colors={[activeCourse.color1, activeCourse.color2]}
                        style={styles.gradientBackground}
                    >
                        <View style={styles.cardHeader}>
                            {streakCount > 0 && (
                                <View style={styles.streakPill}>
                                    <Ionicons name="flame" size={14} color={activeCourse.textColor} />
                                    <Text style={[styles.streakText, { color: activeCourse.textColor }]}>
                                        {streakCount} Day{streakCount === 1 ? '' : 's'} Streak
                                    </Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.watermarkChar}>{activeCourse.char}</Text>
                        <View style={styles.focusContent}>
                            <Text style={[styles.focusLabel, { color: activeCourse.textColor }]}>CURRENT GOAL</Text>
                            <Text style={[styles.focusTitle, { color: activeCourse.textColor }]}>{activeCourse.title}</Text>
                            <Text style={[styles.focusSubtitle, { color: activeCourse.textColor }]}>{activeCourse.subtitle}</Text>
                            <View style={styles.playButton}>
                                <Text style={[styles.playText, { color: activeCourse.textColor }]}>CONTINUE</Text>
                                <Ionicons name="arrow-forward-circle" size={32} color={activeCourse.textColor} />
                            </View>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/*--- CATEGORIES WITH DISTINCT COLORS ---*/}
                {renderHorizontalSection("Kana", "Native japanese writing system", kanaCourses, "#4facfe")}
                {renderHorizontalSection("Kanji", "Characters originally from China", kanjiCourses, "#CE2D4F")}
                {renderHorizontalSection("Radicals", "Building blocks or components of kanji characters", radicalCourses, "#00b09b")}

            </ScrollView>

        </ThemedView>
    )
}

export default HomePage

const styles = StyleSheet.create({
    container: { flex: 1 },

    // --- TOP BAR ---
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginBottom: 5,
    },
    appName: { fontSize: 14, fontWeight: 'bold', letterSpacing: 2.5, opacity: 0.5, textTransform: 'uppercase' },
    topBarSide: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    topBarActions: { justifyContent: 'flex-end', gap: 16 },

    // --- FOCUS ZONE ---
    focusContainer: {
        height: 460,
        marginHorizontal: 10,
        marginBottom: 20,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
    },
    gradientBackground: { flex: 1, padding: 25, justifyContent: 'space-between' },
    cardHeader: { flexDirection: 'row', justifyContent: 'flex-start', zIndex: 10 },
    streakPill: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.6)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        alignItems: 'center',
        gap: 6,
    },
    streakText: { fontWeight: '700', fontSize: 12 },
    watermarkChar: {
        position: 'absolute',
        right: -20,
        bottom: -40,
        fontSize: 340,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.4)',
        zIndex: 0,
    },
    focusContent: { zIndex: 10, marginBottom: 15 },
    focusLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 2, opacity: 0.7, marginBottom: 5 },
    focusTitle: { fontSize: 48, fontWeight: '900', letterSpacing: -1, lineHeight: 50 },
    focusSubtitle: { fontSize: 18, fontWeight: '500', marginTop: 5, marginBottom: 30, opacity: 0.8 },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)',
        alignSelf: 'flex-start',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
        gap: 10,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    playText: { fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },

    // --- SECTIONS ---
    sectionContainer: { marginBottom: 20 },
    sectionHeader: { paddingHorizontal: 10, marginBottom: 15 },

    // New Styles for Header Distinction
    titleWrapper: { flexDirection: 'row', alignItems: 'center' },
    accentBar: {
        width: 5,
        height: 45,
        borderRadius: 5,
        marginRight: 10,
    },
    sectionTitle: { fontSize: 22, fontWeight: '800' },
    sectionSubtitle: { fontSize: 14, opacity: 0.5, marginTop: -2 },

    horizontalScrollContent: { paddingLeft: 16, paddingRight: 20, alignItems: 'center' },

    // Card Styles
    pathCard: {
        width: 160,
        height: 180,
        marginRight: 16,
        borderRadius: 20,
        padding: 15,
        justifyContent: 'space-between',
        borderWidth: 1,
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 10 },
    cardSub: { fontSize: 12, opacity: 0.6 },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    progressTrack: {
        width: 40,
        height: 4,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressPercent: { fontSize: 13, fontWeight: '700', opacity: 0.85 },
    arrowBox: {
        width: 35,
        height: 35,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
})