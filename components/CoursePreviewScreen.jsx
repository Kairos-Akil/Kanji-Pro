import { useLocalSearchParams } from 'expo-router'
import { COURSES } from '../constants/Courses'
import CharacterPreview from './CharacterPreview'
import KanjiPreview from './KanjiPreview'

// Slice a course's flat data array into FlatList groups per its groupLayout. A group with no
// `count` takes all remaining items (the common case: one group holding the whole set).
const buildGroupedData = (data, groupLayout) => {
    let offset = 0
    const grouped = groupLayout.map(({ numColumns, count }) => {
        const items = count != null ? data.slice(offset, offset + count) : data.slice(offset)
        offset += items.length
        return { numColumns, items }
    })

    // Warn if a fixed-count layout doesn't cover the whole data set, since the leftover items
    // would otherwise silently vanish from the grid.
    if (offset < data.length) {
        console.warn(
            `CoursePreviewScreen: groupLayout only accounts for ${offset} of ${data.length} items — ` +
            `${data.length - offset} item(s) won't be shown. Update this course's groupLayout.`
        )
    }

    return grouped
}

// Preview screen for any course: looks up its data/layout and renders the right grid. Kanji uses
// KanjiPreview (it opens a details modal on tap); Kana and Radicals use CharacterPreview.
const CoursePreviewScreen = ({ courseId }) => {
    const course = COURSES[courseId]
    const groupedData = buildGroupedData(course.data, course.groupLayout)

    // Character to scroll to and highlight (set by search). Route params are shared across sibling
    // tier tabs, so only engage on the tab whose data contains the character.
    const { focus } = useLocalSearchParams()
    const focusRaw = Array.isArray(focus) ? focus[0] : focus
    const focusChar = focusRaw && course.data.some(item => item[course.idKey] === focusRaw)
        ? focusRaw
        : undefined

    if (course.previewType === 'kanji') {
        return <KanjiPreview groupedData={groupedData} focusChar={focusChar} />
    }

    return (
        <CharacterPreview
            groupedData={groupedData}
            mainKey={course.idKey}
            subKey={course.answerKey}
            subFontSize={course.subFontSize}
            focusChar={focusChar}
        />
    )
}

export default CoursePreviewScreen
