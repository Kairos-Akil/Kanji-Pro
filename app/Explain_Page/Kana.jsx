import ExplanationLayout from '../../components/ExplanationLayout'

const KanaData = {
    title: "Kana Systems",
    subtitle: "Hiragana & Katakana",
    watermarkChar: "あ",
    intro: "Kana are the phonetic syllabaries of Japanese. Unlike English letters, each character represents a full syllable (like 'ka', 'mi', or 'su'). There are two main kana systems used together.",
    sections: [
        {
            heading: "Hiragana (ひらがな)",
            text: 'Used for native Japanese words and grammar particles. It has a curvy, flowing appearance. It is the first "alphabet" children learn.'
        },
        {
            heading: "Katakana (カタカナ)",
            text: "Used primarily for foreign loanwords (like 'coffee' or 'computer'), names of foreign places, and for emphasis (like italics in English). It looks sharp and angular."
        }
    ],
    example: {
        char: "あり\nがと\nう",
        reading: "Arigatou",
        meaning: "Thank You (Hiragana)"
    }
};

export default function KanaPage() {
    return <ExplanationLayout data={KanaData} accentColor="#4facfe" icon="school" />;
}