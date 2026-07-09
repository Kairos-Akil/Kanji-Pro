import hiraganaBasic from '../assets/data/HiraganaData/hiraganaBasic.json'
import hiraganaVariants from '../assets/data/HiraganaData/hiraganaVariants.json'
import hiraganaCombinations from '../assets/data/HiraganaData/hiraganaCombinations.json'
import katakanaBasic from '../assets/data/KatakanaData/katakanaBasic.json'
import katakanaVariants from '../assets/data/KatakanaData/katakanaVariants.json'
import katakanaCombinations from '../assets/data/KatakanaData/katakanaCombinations.json'

// kana string -> romaji, built from the same kana data files the app teaches from
const KANA_TO_ROMAJI = {}
for (const { kana, romaji } of [
    ...hiraganaBasic, ...hiraganaVariants, ...hiraganaCombinations,
    ...katakanaBasic, ...katakanaVariants, ...katakanaCombinations,
]) {
    KANA_TO_ROMAJI[kana] = romaji
}

// The ぢ combinations are valid kana that KANJIDIC2 readings occasionally use (住:ヂュウ)
// but the kana course files don't teach (they're near-obsolete spellings of じゃ/じゅ/じょ).
Object.assign(KANA_TO_ROMAJI, {
    'ぢゃ': 'ja', 'ぢゅ': 'ju', 'ぢょ': 'jo',
    'ヂャ': 'ja', 'ヂュ': 'ju', 'ヂョ': 'jo',
})

const MAX_KEY_LENGTH = Math.max(...Object.keys(KANA_TO_ROMAJI).map(k => [...k].length))

const VOWELS = 'aeiou'

// Convert a kana reading to typeable romaji by longest-match tokenization, with sokuon (っ)
// doubling the next consonant and ー repeating the previous vowel. Returns null if the reading
// contains something the kana tables can't express.
export const kanaToRomaji = (reading) => {
    const chars = [...reading.replace(/[.\-\s]/g, '')]
    let out = ''
    let pendingSokuon = false

    let i = 0
    while (i < chars.length) {
        const c = chars[i]

        if (c === 'っ' || c === 'ッ') {
            pendingSokuon = true
            i += 1
            continue
        }

        if (c === 'ー') {
            const last = out.slice(-1)
            if (!VOWELS.includes(last)) return null
            out += last
            i += 1
            continue
        }

        let matched = null
        for (let len = MAX_KEY_LENGTH; len >= 1; len--) {
            const slice = chars.slice(i, i + len).join('')
            if (KANA_TO_ROMAJI[slice]) {
                matched = KANA_TO_ROMAJI[slice]
                i += len
                break
            }
        }
        if (!matched) return null

        if (pendingSokuon) {
            out += matched[0]
            pendingSokuon = false
        }
        out += matched
    }

    return out || null
}
