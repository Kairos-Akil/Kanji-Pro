import ExplanationLayout from '../../components/ExplanationLayout'

const KanjiData = {
    title: "Kanji",
    subtitle: "Logographic Characters",
    watermarkChar: "漢",
    intro: "Kanji (漢字) are Chinese characters adopted into Japanese. Unlike Kana which represents sound, Kanji represents meaning. A single character can stand for a whole word or idea.",
    sections: [
        {
            heading: "Why use them?",
            text: "Japanese has many homophones (words that sound the same). Kanji helps distinguish meaning visually. It also makes reading faster by compacting information."
        },
        {
            heading: "Onyomi & Kunyomi",
            text: "Most Kanji have two readings: 'Onyomi' (original Chinese sound) and 'Kunyomi' (native Japanese sound). The reading depends on the context."
        }
    ],
    example: {
        char: "日本",
        reading: "Nihon",
        meaning: "Japan (Sun Origin)"
    }
};

export default function KanjiPage() {
    return <ExplanationLayout data={KanjiData} accentColor="#CE2D4F" icon="book" />;
}