import { Redirect, useLocalSearchParams } from 'expo-router'
import { CATEGORIES } from '../../constants/Categories'
import ExplanationLayout from '../../components/ExplanationLayout'

// /Explain_Page/Kana, /Explain_Page/Kanji, /Explain_Page/Radicals: one page, texts from
// constants/Categories.js.
const ExplainPage = () => {
    const { topic } = useLocalSearchParams()
    // hasOwn, not CATEGORIES[topic]: built-in keys like "constructor" would pass that check.
    if (!Object.hasOwn(CATEGORIES, topic)) return <Redirect href="/" />
    const { explanation, accentColor, icon } = CATEGORIES[topic]

    return <ExplanationLayout data={explanation} accentColor={accentColor} icon={icon} />
}

export default ExplainPage
