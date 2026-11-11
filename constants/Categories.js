// The three content categories. accentColor tints their row on Home and their "What are …?"
// page, icon (an Ionicons name) is shown on that page; tagline is the row's subtitle on Home;
// explanation is the text of that page. The keys are
// also the page URLs (/Explain_Page/Kana), see app/Explain_Page/[topic].jsx.
export const CATEGORIES = {
    Kana: {
        icon: 'school',
        accentColor: '#4facfe',
        tagline: 'Native japanese writing system',
        explanation: {
            title: 'Kana Systems',
            subtitle: 'Hiragana & Katakana',
            watermarkChar: 'あ',
            intro: "Kana are the phonetic syllabaries of Japanese. Unlike English letters, each character represents a full syllable (like 'ka', 'mi', or 'su'). There are two main kana systems used together.",
            sections: [
                {
                    heading: 'Hiragana (ひらがな)',
                    text: 'Used for native Japanese words and grammar particles. It has a curvy, flowing appearance. It is the first "alphabet" children learn.',
                },
                {
                    heading: 'Katakana (カタカナ)',
                    text: "Used primarily for foreign loanwords (like 'coffee' or 'computer'), names of foreign places, and for emphasis (like italics in English). It looks sharp and angular.",
                },
            ],
            example: {
                char: 'あり\nがと\nう',
                reading: 'Arigatou',
                meaning: 'Thank You (Hiragana)',
            },
        },
    },
    Kanji: {
        icon: 'book',
        accentColor: '#CE2D4F',
        tagline: 'Characters originally from China',
        explanation: {
            title: 'Kanji',
            subtitle: 'Logographic Characters',
            watermarkChar: '漢',
            intro: 'Kanji (漢字) are Chinese characters adopted into Japanese. Unlike Kana which represents sound, Kanji represents meaning. A single character can stand for a whole word or idea.',
            sections: [
                {
                    heading: 'Why use them?',
                    text: 'Japanese has many homophones (words that sound the same). Kanji helps distinguish meaning visually. It also makes reading faster by compacting information.',
                },
                {
                    heading: 'Onyomi & Kunyomi',
                    text: "Most Kanji have two readings: 'Onyomi' (original Chinese sound) and 'Kunyomi' (native Japanese sound). The reading depends on the context.",
                },
            ],
            example: {
                char: '日本',
                reading: 'Nihon',
                meaning: 'Japan (Sun Origin)',
            },
        },
    },
    Radicals: {
        icon: 'leaf',
        accentColor: '#00b09b',
        tagline: 'Building blocks or components of kanji characters',
        explanation: {
            title: 'Radicals',
            subtitle: 'Building Blocks',
            watermarkChar: '木',
            intro: 'Radicals (Bushu) are the component parts that make up a Kanji character. Every Kanji has a primary radical that gives a hint to its meaning or category.',
            sections: [
                {
                    heading: 'Semantic Components',
                    text: "Many radicals tell you the 'theme' of the word. For example, the 'Water' radical (氵) appears in characters for sea, swim, and liquid.",
                },
                {
                    heading: 'Learning Strategy',
                    text: 'Instead of memorizing thousands of complex strokes, learning radicals allows you to break complex Kanji into simple, recognizable Lego pieces.',
                },
                {
                    heading: 'Traditional Radicals vs. Variants',
                    text: "The 214 'Kangxi radicals' are the traditional set used to index every character in Japanese and Chinese dictionaries, named after the 18th-century Kangxi Dictionary that established them. Many of these actually change shape depending on where they sit in a character — 'water' (水) becomes 氵 on the left, and 'heart' (心) becomes 忄. These reshaped forms are called variants: same origin and meaning, just written differently depending on position. This app covers the traditional 214 first (split into three levels by stroke count), then the variant forms as their own set.",
                },
            ],
            example: {
                char: '休',
                reading: 'Person (人) + Tree (木)',
                meaning: 'To Rest (Like a person\nleaning on a tree)',
            },
        },
    },
}
