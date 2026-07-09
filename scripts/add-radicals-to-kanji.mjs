// Adds a `radicals` array (component decomposition) to every kanji in the 5
// assets/data/KanjiData/kanjiN*.json files, sourced from KRADFILE-U (scripts/kradfile-u.txt).
//
//
// Idempotent: re-running just rewrites the same field, so it's safe to run again after
// the kanji files are regenerated/expanded.
//
// Terminal command: node scripts/add-radicals-to-kanji.mjs

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const KRADFILE = path.join(ROOT, 'scripts/kradfile-u.txt')
const KANJI_DIR = path.join(ROOT, 'assets/data/KanjiData')
const LEVELS = ['kanjiN5', 'kanjiN4', 'kanjiN3', 'kanjiN2', 'kanjiN1']

// KRADFILE components normalized to the exact codepoints assets/data/RadicalsData/
// radicals.json uses, so KanjiModal can look each one up and show its meaning
const COMPONENT_MAP = {
    'ノ': '丿', '｜': '丨', 'ハ': '八', 'ヨ': '⺕',
    // KRADFILE writes 辶 as the compatibility ideograph U+FA66, not U+8FB6 — map both.
    '氵': '⺡', '⺾': '⾋', '扌': '⺘', '辶': '⻌', '辶': '⻌', '灬': '⺣',
    '刂': '⺉', '忄': '⺖', '礻': '⺭', '⺹': '⽼', '犭': '⺨',
    '衤': '⻂', '入': '⼊', '斉': '⻫',
    '滴': '啇', '并': '丷',
}

// ---- Parse KRADFILE-U: "kanji : comp1 comp2 ..." lines, # comments ----
const krad = {}
for (const line of fs.readFileSync(KRADFILE, 'utf8').split('\n')) {
    if (!line || line.startsWith('#')) continue
    const [kanji, comps] = line.split(' : ')
    if (!kanji || !comps) continue
    krad[kanji.trim()] = comps.trim().split(/\s+/).map(c => COMPONENT_MAP[c] ?? c)
}

// ---- Merge into the level files ----
let missing = []
for (const level of LEVELS) {
    const file = path.join(KANJI_DIR, `${level}.json`)
    const kanjiList = JSON.parse(fs.readFileSync(file, 'utf8'))

    for (const entry of kanjiList) {
        const radicals = krad[entry.character]
        if (!radicals) {
            missing.push(entry.character)
            continue
        }
        entry.radicals = radicals
    }

    fs.writeFileSync(file, JSON.stringify(kanjiList, null, 2) + '\n')
    console.log(`${level}: ${kanjiList.length} kanji updated`)
}

if (missing.length) {
    console.warn(`WARNING — no decomposition found for: ${missing.join(' ')}`)
} else {
    console.log('Done — every kanji has a radicals list.')
}
