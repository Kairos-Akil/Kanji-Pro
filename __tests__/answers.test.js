import {
    toAnswerList,
    answerDisplayText,
    typedAnswerMatches,
    answersMatch,
    pickWrongOptions,
    answerAnnouncement,
} from '../utils/answers'

describe('typedAnswerMatches (keyboard mode)', () => {
    test('accepts any of several meanings, ignoring case', () => {
        expect(typedAnswerMatches('Sun', ['day', 'sun', 'Japan'])).toBe(true)
        expect(typedAnswerMatches('moon', ['day', 'sun'])).toBe(false)
    })

    test('ignores punctuation the keyboard cannot type', () => {
        expect(typedAnswerMatches('anti', ['anti-'])).toBe(true)
        expect(typedAnswerMatches('what', ['what?'])).toBe(true)
        expect(typedAnswerMatches('pigs head', ['pig’s head'])).toBe(true)
        expect(typedAnswerMatches('bow in archery', ['bow （in archery）'])).toBe(true)
    })

    test('ignores spaces, so hyphenated answers work either way', () => {
        expect(typedAnswerMatches('two mat area', ['two-mat area'])).toBe(true)
        expect(typedAnswerMatches('twomat area', ['two-mat area'])).toBe(true)
    })

    test('accepts romaji for kana readings', () => {
        expect(typedAnswerMatches('nichi', ['ニチ', 'ジツ'])).toBe(true)
        expect(typedAnswerMatches('jitsu', ['ニチ', 'ジツ'])).toBe(true)
        expect(typedAnswerMatches('taberu', ['た.べる'])).toBe(true)
    })

    test('never matches empty or punctuation-only input', () => {
        expect(typedAnswerMatches('', ['anything'])).toBe(false)
        expect(typedAnswerMatches('   ', ['anything'])).toBe(false)
        expect(typedAnswerMatches('?!', ['?!'])).toBe(false)
    })
})

describe('answer helpers', () => {
    test('toAnswerList wraps single answers', () => {
        expect(toAnswerList('ka')).toEqual(['ka'])
        expect(toAnswerList(['a', 'b'])).toEqual(['a', 'b'])
    })

    test('answerDisplayText joins alternatives', () => {
        expect(answerDisplayText(['day', 'sun'])).toBe('day, sun')
        expect(answerDisplayText('ka')).toBe('ka')
    })

    test('answersMatch compares lists by value', () => {
        expect(answersMatch(['a', 'b'], ['a', 'b'])).toBe(true)
        expect(answersMatch(['a', 'b'], ['a'])).toBe(false)
        expect(answersMatch('ka', ['ka'])).toBe(true)
    })

    test('answerAnnouncement says the result for screen readers', () => {
        expect(answerAnnouncement(true, ['sun'])).toBe('Correct')
        expect(answerAnnouncement(false, ['day', 'sun'])).toBe('Wrong. The answer is day, sun')
    })
})

describe('pickWrongOptions', () => {
    const mode = { key: 'reading' }
    const data = [
        { char: '二', reading: ['ニ', 'ジ'] },
        { char: '時', reading: ['ジ'] },          // shares ジ with 二: must never be "wrong" for 二
        { char: '日', reading: ['ニチ'] },
        { char: '月', reading: ['ゲツ'] },
        { char: '火', reading: ['カ'] },
        { char: '何', reading: ['カ'] },          // same label as 火: shown at most once
        { char: '空', reading: [] },              // no data for this mode: never an option
    ]

    test('excludes items that share an accepted answer with the correct one', () => {
        for (let i = 0; i < 50; i++) {
            const picked = pickWrongOptions(data, data[0], mode).map(item => item.char)
            expect(picked).not.toContain('時')
            expect(picked).not.toContain('二')
        }
    })

    test('never shows the same label twice and skips items without data', () => {
        for (let i = 0; i < 50; i++) {
            const picked = pickWrongOptions(data, data[2], mode)
            const labels = picked.map(item => answerDisplayText(item.reading))
            expect(new Set(labels).size).toBe(labels.length)
            expect(picked.map(item => item.char)).not.toContain('空')
        }
    })

    test('returns at most `count` options', () => {
        expect(pickWrongOptions(data, data[2], mode, 2)).toHaveLength(2)
    })
})
