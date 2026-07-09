import ExplanationLayout from '../../components/ExplanationLayout'

const RadicalsData = {
    title: "Radicals",
    subtitle: "Building Blocks",
    watermarkChar: "木",
    intro: "Radicals (Bushu) are the component parts that make up a Kanji character. Every Kanji has a primary radical that gives a hint to its meaning or category.",
    sections: [
        {
            heading: "Semantic Components",
            text: "Many radicals tell you the 'theme' of the word. For example, the 'Water' radical (氵) appears in characters for sea, swim, and liquid."
        },
        {
            heading: "Learning Strategy",
            text: "Instead of memorizing thousands of complex strokes, learning radicals allows you to break complex Kanji into simple, recognizable Lego pieces."
        },
        {
            heading: "Traditional Radicals vs. Variants",
            text: "The 214 'Kangxi radicals' are the traditional set used to index every character in Japanese and Chinese dictionaries, named after the 18th-century Kangxi Dictionary that established them. Many of these actually change shape depending on where they sit in a character — 'water' (水) becomes 氵 on the left, and 'heart' (心) becomes 忄. These reshaped forms are called variants: same origin and meaning, just written differently depending on position. This app covers the traditional 214 first (split into three levels by stroke count), then the variant forms as their own set."
        }
    ],
    example: {
        char: "休",
        reading: "Person (人) + Tree (木)",
        meaning: "To Rest (Like a person\nleaning on a tree)"
    }
};

export default function RadicalsPage() {
    return <ExplanationLayout data={RadicalsData} accentColor="#00b09b" icon="leaf" />;
}