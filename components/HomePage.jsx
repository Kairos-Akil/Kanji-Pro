import { useState, useCallback, useEffect } from 'react'
import { StyleSheet, ScrollView } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAlert } from '../context/AlertContext'
import { useProgressActions, useProgressMeta } from '../context/ProgressContext'
import { useNavigateOnce } from '../hooks/useNavigateOnce'
import { COURSES, DEFAULT_COURSE_ID, LAST_ACTIVE_STORAGE_KEY, RADICAL_CATEGORY_IDS, KANJI_TIER_IDS_BY_LEVEL } from '../constants/Courses'
import { CATEGORIES } from '../constants/Categories'
import ThemedView from './ThemedView'
import HomeTopBar from './HomeTopBar'
import ContinueCard from './ContinueCard'
import CourseRow from './CourseRow'
import AppSettings from './AppSettings'
import SearchModal from './SearchModal'
import InfoModal from './InfoModal'

// Course-id groups behind each card's progress bar (a card can span several courses).
const CARD_COURSE_GROUPS = {
    hiragana: ['hiragana_basic', 'hiragana_variants', 'hiragana_combinations'],
    katakana: ['katakana_basic', 'katakana_variants', 'katakana_combinations'],
    ...KANJI_TIER_IDS_BY_LEVEL,
    ...Object.fromEntries(RADICAL_CATEGORY_IDS.map(id => [id, [id]])),
}

// Percent learned per card key. Runs on focus (not per render): HomePage stays mounted under the
// navigation stack, and counting every course live would re-run on each answered quiz question.
const computeCardPercents = (getLearnedCount) => {
    const percents = {}
    Object.entries(CARD_COURSE_GROUPS).forEach(([key, courseIds]) => {
        let learned = 0
        let total = 0
        courseIds.forEach(id => {
            const course = COURSES[id]
            if (!course) return
            const itemIds = course.data.map(item => item[course.idKey])
            learned += getLearnedCount(course.id, itemIds)
            total += course.data.length
        })
        percents[key] = total > 0 ? Math.round((learned / total) * 100) : 0
    })
    return percents
}

const HomePage = () => {
    const router = useRouter()
    const navigateOnce = useNavigateOnce()
    const open = (route) => navigateOnce(() => router.push(route))
    // Stable actions (not the live context), so answering quiz questions doesn't re-render Home.
    const { getLearnedCount } = useProgressActions()
    const { streakCount, progressLoaded, progressLoadFailed } = useProgressMeta()
    const showAlert = useAlert()

    // Saved progress couldn't be read (even after a retry), so nothing is saved this session to
    // protect it. Say so once instead of letting the user study for nothing.
    useEffect(() => {
        if (!progressLoadFailed) return
        showAlert(
            'Progress could not be loaded',
            'Your saved progress could not be read. To protect it, nothing you do now will be saved. Please close and restart the app.'
        )
    }, [progressLoadFailed, showAlert])

    const [settingsVisible, setSettingsVisible] = useState(false)
    const [searchVisible, setSearchVisible] = useState(false)
    const [infoVisible, setInfoVisible] = useState(false)
    const [activeCourseId, setActiveCourseId] = useState(DEFAULT_COURSE_ID)
    // Keyed by CARD_COURSE_GROUPS; empty until the first refresh computes it (bars render blank).
    const [cardPercents, setCardPercents] = useState({})

    // getLearnedCount comes from the stable actions context, so this callback never goes stale.
    const refreshPercents = useCallback(() => {
        setCardPercents(computeCardPercents(getLearnedCount))
    }, [getLearnedCount])

    // Refresh on focus so the "Continue" card and percentages reflect changes made elsewhere.
    useFocusEffect(
        useCallback(() => {
            AsyncStorage.getItem(LAST_ACTIVE_STORAGE_KEY)
                .then(lastActive => {
                    if (lastActive && COURSES[lastActive]) setActiveCourseId(lastActive)
                })
                .catch(err => console.warn('Error loading last active course', err))

            refreshPercents()
        }, [refreshPercents])
    )

    // The first focus can run before the persisted progress finishes loading; recompute once it has.
    useEffect(() => {
        if (progressLoaded) refreshPercents()
    }, [progressLoaded, refreshPercents])

    const activeCourse = COURSES[activeCourseId] ?? COURSES[DEFAULT_COURSE_ID]

    const kanaCourses = [
        { title: 'What are Kana?', sub: 'Kana explained', icon: 'bulb', route: '/Explain_Page/Kana' },
        {
            title: 'Hiragana', sub: 'Native Words', icon: 'school', route: '/Hiragana_Page/hiraganaBasic',
            percent: cardPercents.hiragana,
        },
        {
            title: 'Katakana', sub: 'Foreign Words', icon: 'school', route: '/Katakana_Page/katakanaBasic',
            percent: cardPercents.katakana,
        },
    ]

    // Each N-level card links to its first tier and aggregates progress across all 3 tiers.
    const kanjiLevelCard = (id, title, sub) => {
        const tierIds = KANJI_TIER_IDS_BY_LEVEL[id]
        return { title, sub, icon: 'book', route: COURSES[tierIds[0]].route, percent: cardPercents[id] }
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
                percent: cardPercents[id],
            }
        }),
    ]

    // The three category rows, in display order.
    const rows = [
        ['Kana', kanaCourses],
        ['Kanji', kanjiCourses],
        ['Radicals', radicalCourses],
    ]

    return (
        <ThemedView safe style={styles.container}>
            {/* Refresh on close: "Reset All Progress" lives in this sheet and fires no focus event. */}
            <AppSettings
                isVisible={settingsVisible}
                onClose={() => {
                    setSettingsVisible(false)
                    refreshPercents()
                }}
            />
            <SearchModal isVisible={searchVisible} onClose={() => setSearchVisible(false)} />
            <InfoModal isVisible={infoVisible} onClose={() => setInfoVisible(false)} />

            <HomeTopBar
                onOpenInfo={() => setInfoVisible(true)}
                onOpenSearch={() => setSearchVisible(true)}
                onOpenSettings={() => setSettingsVisible(true)}
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <ContinueCard
                    course={activeCourse}
                    streakCount={streakCount}
                    onPress={() => open(activeCourse.route)}
                />

                {rows.map(([name, cards]) => (
                    <CourseRow
                        key={name}
                        title={name}
                        subtitle={CATEGORIES[name].tagline}
                        cards={cards}
                        accentColor={CATEGORIES[name].accentColor}
                        onOpen={open}
                    />
                ))}
            </ScrollView>
        </ThemedView>
    )
}

export default HomePage

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 50 },
})
