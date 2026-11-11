import { kanaToRomaji } from '../utils/kanaToRomaji'

describe('kanaToRomaji', () => {
    test('converts single kana and combinations', () => {
        expect(kanaToRomaji('か')).toBe('ka')
        expect(kanaToRomaji('しゃ')).toBe('sha')
        expect(kanaToRomaji('ニチ')).toBe('nichi')
    })

    test('doubles the next consonant after small tsu', () => {
        expect(kanaToRomaji('がっこう')).toBe('gakkou')
    })

    test('drops a small tsu at the end (shortened readings like 十 ジッ, 合 ガッ)', () => {
        expect(kanaToRomaji('ジッ')).toBe('ji')
        expect(kanaToRomaji('ガッ')).toBe('ga')
    })

    test('repeats the previous vowel for the long-vowel mark', () => {
        expect(kanaToRomaji('コーヒー')).toBe('koohii')
    })

    test('ignores the dots and dashes used in kun readings', () => {
        expect(kanaToRomaji('た.べる')).toBe('taberu')
        expect(kanaToRomaji('-づ.く')).toBe('zuku')
    })

    test('returns null for text it cannot express', () => {
        expect(kanaToRomaji('abc')).toBe(null)
        expect(kanaToRomaji('漢')).toBe(null)
    })
})
