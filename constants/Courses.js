import hiraganaBasic from '../assets/data/HiraganaData/hiraganaBasic.json'
import hiraganaVariants from '../assets/data/HiraganaData/hiraganaVariants.json'
import hiraganaCombinations from '../assets/data/HiraganaData/hiraganaCombinations.json'
import katakanaBasic from '../assets/data/KatakanaData/katakanaBasic.json'
import katakanaVariants from '../assets/data/KatakanaData/katakanaVariants.json'
import katakanaCombinations from '../assets/data/KatakanaData/katakanaCombinations.json'
import kanjiN5 from '../assets/data/KanjiData/kanjiN5.json'
import kanjiN4 from '../assets/data/KanjiData/kanjiN4.json'
import kanjiN3 from '../assets/data/KanjiData/kanjiN3.json'
import kanjiN2 from '../assets/data/KanjiData/kanjiN2.json'
import kanjiN1 from '../assets/data/KanjiData/kanjiN1.json'
import radicalsData from '../assets/data/RadicalsData/radicals.json'

// AsyncStorage key for the last-focused course, shared by TopSlider (writes) and HomePage (reads).
export const LAST_ACTIVE_STORAGE_KEY = 'KANJI_PRO_LAST_ACTIVE_V1'

// KANJIDIC2 frequency ranks bucketed into 3 even ranges for KanjiModal's label; the max is derived
// from the data so it survives regeneration. Kanji with no freq rank are labeled Rare.
const ALL_KANJI_FREQS = [...kanjiN5, ...kanjiN4, ...kanjiN3, ...kanjiN2, ...kanjiN1]
    .map(k => k.freq)
    .filter(f => f != null)
const KANJI_FREQ_MAX = Math.max(...ALL_KANJI_FREQS)
const KANJI_FREQ_BUCKET = Math.ceil(KANJI_FREQ_MAX / 3)

export const getFrequencyLabel = (freq) => {
    if (freq == null) return 'Rare'
    if (freq <= KANJI_FREQ_BUCKET) return 'Common'
    if (freq <= KANJI_FREQ_BUCKET * 2) return 'Normal'
    return 'Uncommon'
}

// char -> first meaning, for annotating a kanji's component list in KanjiModal.
const RADICAL_MEANING_BY_CHAR = Object.fromEntries(
    radicalsData.map(r => [r.radical, r.meanings[0]])
)

// "⺡ (water), 母 (mother)" — components not in the radicals list show as the bare character.
export const formatRadicalList = (radicals) =>
    radicals
        .map(c => RADICAL_MEANING_BY_CHAR[c] ? `${c} (${RADICAL_MEANING_BY_CHAR[c]})` : c)
        .join(', ')

// Kana tile layout: rows of 5 for the bulk of a basic set, smaller trailing rows for the leftovers.
const BASIC_GROUP_LAYOUT = [
    { numColumns: 5, count: 35 },
    { numColumns: 3, count: 3 },
    { numColumns: 5, count: 5 },
    { numColumns: 2, count: 2 },
    { numColumns: 1, count: 1 },
]

// The 214 Kangxi radicals split into 3 stroke-ordered levels, plus a Variants set (e.g. さんずい).
const RADICAL_LEVEL_COUNT = 3

// Ordered radical set ids, so HomePage renders one card per set in a stable order.
export const RADICAL_CATEGORY_IDS = [
    ...Array.from({ length: RADICAL_LEVEL_COUNT }, (_, i) => `radicals_level${i + 1}`),
    'radicals_variants',
]

// Build the radicals_* COURSES entries from radicals.json.
const buildRadicalCourses = (allRadicals) => {
    const variants = allRadicals.filter(r => r.category === 'Variants')
    // Stable sort by stroke count; ties keep the source's dictionary order.
    const traditional = allRadicals
        .filter(r => r.category !== 'Variants')
        .sort((a, b) => a.strokes - b.strokes)

    const chunkSize = Math.ceil(traditional.length / RADICAL_LEVEL_COUNT)
    const entries = {}

    for (let i = 0; i < RADICAL_LEVEL_COUNT; i++) {
        const data = traditional.slice(i * chunkSize, (i + 1) * chunkSize)
        const id = `radicals_level${i + 1}`
        const strokeRange = data.length ? `${data[0].strokes}-${data[data.length - 1].strokes} strokes` : ''
        entries[id] = {
            id,
            title: 'Radicals', subtitle: `Level ${i + 1} (${strokeRange})`, tabLabel: `Level ${i + 1}`,
            char: data[0]?.radical ?? '?',
            color1: '#00b09b', color2: '#4facfe', textColor: '#0b3d3a',
            route: `/RadicalsLevel${i + 1}_Page/radicalsLevel${i + 1}`,
            quizRoute: `/Quiz_Page/radicalsQuiz_Level${i + 1}`,
            data, idKey: 'radical', answerKey: 'meanings',
            groupLayout: [{ numColumns: 3 }], previewType: 'character', subFontSize: 17,
            icon: 'school',
        }
    }

    entries.radicals_variants = {
        id: 'radicals_variants',
        title: 'Radicals', subtitle: 'Variants (positional)', tabLabel: 'Variants',
        char: variants[0]?.radical ?? '?',
        color1: '#00b09b', color2: '#4facfe', textColor: '#0b3d3a',
        route: '/RadicalsVariants_Page/radicalsVariants',
        quizRoute: '/Quiz_Page/radicalsQuiz_Variants',
        data: variants, idKey: 'radical', answerKey: 'meanings',
        groupLayout: [{ numColumns: 3 }], previewType: 'character', subFontSize: 17,
        icon: 'git-branch',
    }

    return entries
}

// Each JLPT level (N5-N1) splits into 3 tiers; the source files are pre-sorted by frequency, so
// positional chunks double as frequency tiers. Labels are deliberately NOT "Common/Normal/Uncommon"
// — KanjiModal uses those for the global freq bucketing, a different categorization.
const KANJI_TIER_COUNT = 3
const KANJI_TIER_KEYS = ['Tier1', 'Tier2', 'Tier3']
const KANJI_TIER_DISPLAY_LABELS = ['Tier 1', 'Tier 2', 'Tier 3']

// Each question randomly tests one mode's key; `group` ties modes to the Quiz Content setting.
// Modes a kanji has no data for are skipped per-item by the engine.
export const KANJI_QUESTION_MODES = [
    { key: 'meanings', label: 'Meaning', group: 'meanings' },
    { key: 'onyomi', label: 'On Reading', group: 'readings' },
    { key: 'kunyomi', label: 'Kun Reading', group: 'readings' },
]

// Per-level metadata for building each level's 3 tier entries.
const KANJI_LEVELS = [
    { id: 'kanji_n5', data: kanjiN5, subtitle: 'N5', folder: 'KanjiN5_Page', file: 'kanjiN5', quizBase: 'kanjiQuiz_N5' },
    { id: 'kanji_n4', data: kanjiN4, subtitle: 'N4', folder: 'KanjiN4_Page', file: 'kanjiN4', quizBase: 'kanjiQuiz_N4' },
    { id: 'kanji_n3', data: kanjiN3, subtitle: 'N3', folder: 'KanjiN3_Page', file: 'kanjiN3', quizBase: 'kanjiQuiz_N3' },
    { id: 'kanji_n2', data: kanjiN2, subtitle: 'N2', folder: 'KanjiN2_Page', file: 'kanjiN2', quizBase: 'kanjiQuiz_N2' },
    { id: 'kanji_n1', data: kanjiN1, subtitle: 'N1', folder: 'KanjiN1_Page', file: 'kanjiN1', quizBase: 'kanjiQuiz_N1' },
]

// {levelId: [tierIds]}, so HomePage can aggregate a level's tiers into one card.
export const KANJI_TIER_IDS_BY_LEVEL = {}

const buildKanjiCourses = (levels) => {
    const entries = {}

    levels.forEach(level => {
        const chunkSize = Math.ceil(level.data.length / KANJI_TIER_COUNT)
        const tierIds = []

        for (let i = 0; i < KANJI_TIER_COUNT; i++) {
            const data = level.data.slice(i * chunkSize, (i + 1) * chunkSize)
            if (data.length === 0) continue

            const key = KANJI_TIER_KEYS[i]
            const displayLabel = KANJI_TIER_DISPLAY_LABELS[i]
            const id = `${level.id}_${key.toLowerCase()}`
            entries[id] = {
                id,
                title: 'Kanji', subtitle: `${level.subtitle} · ${displayLabel}`, tabLabel: displayLabel,
                char: data[0]?.character ?? '?',
                color1: '#ff6b6b', color2: '#CE2D4F', textColor: '#5c1a1a',
                route: `/${level.folder}/${level.file}${key}`,
                quizRoute: `/Quiz_Page/${level.quizBase}_${key}`,
                data, idKey: 'character', answerKey: 'meanings',
                questionModes: KANJI_QUESTION_MODES,
                groupLayout: [{ numColumns: 3 }], previewType: 'kanji',
            }
            tierIds.push(id)
        }

        KANJI_TIER_IDS_BY_LEVEL[level.id] = tierIds
    })

    return entries
}

// Registry of every learnable course, keyed by the id used as its quizId. `route` is the preview
// page, `quizRoute` its quiz; `groupLayout`/`previewType` describe the preview grid.
export const COURSES = {
    hiragana_basic: {
        id: 'hiragana_basic',
        title: 'Hiragana', subtitle: 'Basic', tabLabel: 'Basic', char: 'あ',
        color1: '#00e1ff', color2: '#8d89c5', textColor: '#702d57',
        route: '/Hiragana_Page/hiraganaBasic',
        quizRoute: '/Quiz_Page/hiraganaQuiz_Basic',
        data: hiraganaBasic, idKey: 'kana', answerKey: 'romaji',
        groupLayout: BASIC_GROUP_LAYOUT, previewType: 'character',
    },
    hiragana_variants: {
        id: 'hiragana_variants',
        title: 'Hiragana', subtitle: 'Variants', tabLabel: 'Variants', char: 'が',
        color1: '#00e1ff', color2: '#8d89c5', textColor: '#702d57',
        route: '/Hiragana_Page/hiraganaVariants',
        quizRoute: '/Quiz_Page/hiraganaQuiz_Variants',
        data: hiraganaVariants, idKey: 'kana', answerKey: 'romaji',
        groupLayout: [{ numColumns: 5 }], previewType: 'character',
    },
    hiragana_combinations: {
        id: 'hiragana_combinations',
        title: 'Hiragana', subtitle: 'Combinations', tabLabel: 'Combinations', char: 'しゃ',
        color1: '#00e1ff', color2: '#8d89c5', textColor: '#702d57',
        route: '/Hiragana_Page/hiraganaCombinations',
        quizRoute: '/Quiz_Page/hiraganaQuiz_Combinations',
        data: hiraganaCombinations, idKey: 'kana', answerKey: 'romaji',
        groupLayout: [{ numColumns: 3 }], previewType: 'character',
    },
    katakana_basic: {
        id: 'katakana_basic',
        title: 'Katakana', subtitle: 'Basic', tabLabel: 'Basic', char: 'ア',
        color1: '#4facfe', color2: '#c86dd7', textColor: '#3d2352',
        route: '/Katakana_Page/katakanaBasic',
        quizRoute: '/Quiz_Page/katakanaQuiz_Basic',
        data: katakanaBasic, idKey: 'kana', answerKey: 'romaji',
        groupLayout: BASIC_GROUP_LAYOUT, previewType: 'character',
    },
    katakana_variants: {
        id: 'katakana_variants',
        title: 'Katakana', subtitle: 'Variants', tabLabel: 'Variants', char: 'ガ',
        color1: '#4facfe', color2: '#c86dd7', textColor: '#3d2352',
        route: '/Katakana_Page/katakanaVariants',
        quizRoute: '/Quiz_Page/katakanaQuiz_Variants',
        data: katakanaVariants, idKey: 'kana', answerKey: 'romaji',
        groupLayout: [{ numColumns: 5 }], previewType: 'character',
    },
    katakana_combinations: {
        id: 'katakana_combinations',
        title: 'Katakana', subtitle: 'Combinations', tabLabel: 'Combinations', char: 'シャ',
        color1: '#4facfe', color2: '#c86dd7', textColor: '#3d2352',
        route: '/Katakana_Page/katakanaCombinations',
        quizRoute: '/Quiz_Page/katakanaQuiz_Combinations',
        data: katakanaCombinations, idKey: 'kana', answerKey: 'romaji',
        groupLayout: [{ numColumns: 3 }], previewType: 'character',
    },
    ...buildKanjiCourses(KANJI_LEVELS),
    ...buildRadicalCourses(radicalsData),
}

export const DEFAULT_COURSE_ID = 'hiragana_basic'

// Every learnable item tagged with its course and route; backs the Home search.
export const SEARCH_INDEX = Object.values(COURSES).flatMap(course =>
    course.data.map((item, i) => ({
        key: `${course.id}_${i}`,
        char: item[course.idKey],
        answer: item[course.answerKey],
        courseTitle: course.title,
        courseSubtitle: course.subtitle,
        route: course.route,
    }))
)

// Build a TopSlider tab entry from a course id; each _layout.jsx only supplies name + component.
export const buildTab = (name, component, courseId) => {
    const course = COURSES[courseId]
    return {
        name,
        component,
        title: course.tabLabel,
        totalItems: course.data.length,
        id: course.id,
        data: course.data,
        idKey: course.idKey,
    }
}
