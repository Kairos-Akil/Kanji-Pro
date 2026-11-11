import { kanaToRomaji } from './kanaToRomaji'

// Pure answer logic shared by the quiz engine and the UI. No React or React Native imports, so the
// tests in __tests__/ can check it directly.

// Typed answers compare letters and digits only: the quiz keyboard has no punctuation keys, so
// "anti" matches "anti-" and "pigs head" matches "pig’s head". Spaces are dropped too, so both
// "two mat area" and "twomat area" match "two-mat area".
const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

// Normalize an answerKey value (a single string, or an array of accepted alternatives) to an array.
export const toAnswerList = (value) => Array.isArray(value) ? value : [value]

// Accepted alternatives joined into one display string.
export const answerDisplayText = (value) => toAnswerList(value).join(', ')

// True if the typed text matches any accepted alternative or its romaji ("nichi" matches ニチ).
export const typedAnswerMatches = (typed, correctValue) => {
    const typedNormalized = normalize(typed)
    if (!typedNormalized) return false // only punctuation typed; an empty string must not match
    return toAnswerList(correctValue).some(part => {
        if (normalize(part) === typedNormalized) return true
        const romaji = kanaToRomaji(part)
        return romaji != null && normalize(romaji) === typedNormalized
    })
}

// Value comparison for answer lists (arrays never compare equal by reference).
export const answersMatch = (a, b) => {
    const listA = toAnswerList(a)
    const listB = toAnswerList(b)
    return listA.length === listB.length && listA.every((v, i) => v === listB[i])
}

// Whether an item has data for a mode's field (e.g. a kanji with no kunyomi skips Kun questions).
export const hasModeData = (item, mode) => toAnswerList(item[mode.key] ?? []).length > 0

// Fisher-Yates shuffle (unbiased, unlike the sort(() => Math.random() - 0.5) trick).
export const shuffle = (arr) => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

// Wrong options for a multiple-choice question about `correctItem`. They need data for this mode's
// field, or their button renders blank. They must share no accepted answer with the correct item
// (生 is セイ, so another kanji's "セイ" isn't wrong), and identical labels (じ/ぢ both "ji") are
// shown once.
export const pickWrongOptions = (data, correctItem, mode, count = 3) => {
    const correctAnswers = toAnswerList(correctItem[mode.key])
    const seenLabels = new Set()
    return shuffle(
        data.filter(item => hasModeData(item, mode) &&
            !toAnswerList(item[mode.key]).some(answer => correctAnswers.includes(answer)))
    ).filter(item => {
        const label = answerDisplayText(item[mode.key])
        if (seenLabels.has(label)) return false
        seenLabels.add(label)
        return true
    }).slice(0, count)
}

// What a screen reader says after an answer, since it can't see the color/sound feedback.
export const answerAnnouncement = (isCorrect, correctValue) =>
    isCorrect ? 'Correct' : `Wrong. The answer is ${answerDisplayText(correctValue)}`
