import {
    pickNextItem,
    updateWorkingSet,
    INITIAL_PICKER_STATE,
    WORKING_SET_MIN,
    WORKING_SET_MAX,
} from '../utils/questionPicker'
import { MASTERY_STARS, afterCorrect } from '../utils/mastery'

// Seeded random numbers (mulberry32): the same seed always gives the same sequence, so the tests
// are reproducible but still exercise varied random paths.
const seeded = (seed) => () => {
    seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const always = (value) => () => value // e.g. always(0): every chance roll "hits"

const items = (n) => Array.from({ length: n }, (_, i) => ({ c: `k${i}` }))
const idOf = item => item.c

// Picks `count` questions in a row, answering each correctly (+1 star), like a user would.
const simulate = ({ data, learningMode, count, random, stars = {} }) => {
    let state = INITIAL_PICKER_STATE
    let currentId
    const picks = []
    for (let i = 0; i < count; i++) {
        const result = pickNextItem({
            data, idOf, getStars: item => stars[idOf(item)] ?? 0, learningMode, currentId, state, random,
        })
        picks.push({ id: idOf(result.item), state: result.state, starsBefore: { ...stars } })
        state = result.state
        currentId = idOf(result.item)
        stars[currentId] = afterCorrect(stars[currentId] ?? 0)
    }
    return picks
}

describe('Learning Mode: a fresh course', () => {
    test('starts with 5 new characters, shown back-to-back as teach cards', () => {
        const picks = simulate({ data: items(40), learningMode: 'on', count: WORKING_SET_MIN, random: seeded(1) })
        expect(picks[0].state.workingSet).toHaveLength(WORKING_SET_MIN)
        // Each of the first 5 questions introduces a different, brand-new character.
        expect(new Set(picks.map(p => p.id)).size).toBe(WORKING_SET_MIN)
        expect(picks.every(p => (p.starsBefore[p.id] ?? 0) === 0)).toBe(true)
        // Anything still queued came in through the 10% trickle: also new and not shown yet.
        const shown = new Set(picks.map(p => p.id))
        expect(picks[WORKING_SET_MIN - 1].state.introQueue.filter(id => shown.has(id))).toEqual([])
    })

    test('the working set never exceeds 15 and never holds a mastered character', () => {
        for (const seed of [1, 2, 3]) {
            const stars = {}
            const picks = simulate({ data: items(60), learningMode: 'on', count: 400, random: seeded(seed), stars })
            for (const { state, starsBefore } of picks) {
                expect(state.workingSet.length).toBeLessThanOrEqual(WORKING_SET_MAX)
                // The set is built from the stars at pick time, so check against those.
                expect(state.workingSet.filter(id => (starsBefore[id] ?? 0) >= MASTERY_STARS)).toEqual([])
            }
        }
    })

    test('eventually masters the whole course and then only reviews', () => {
        const stars = {}
        const picks = simulate({ data: items(20), learningMode: 'on', count: 400, random: seeded(4), stars })
        expect(Object.values(stars).filter(s => s >= MASTERY_STARS)).toHaveLength(20)
        expect(picks[picks.length - 1].state.workingSet).toEqual([])
    })

    test('a mastered character demoted to 5 stars re-enters before brand-new ones (no teach card)', () => {
        const data = items(30)
        const stars = { k0: 5 } // was mastered, then a missed review dropped it to 5
        const state = { workingSet: ['k1', 'k2', 'k3', 'k4', 'k5'], introQueue: [] }
        for (const id of state.workingSet) stars[id] = 2
        const updated = updateWorkingSet(state, data, item => stars[idOf(item)] ?? 0, idOf, always(0.99))
        expect(updated.workingSet).toContain('k0')
        expect(updated.introQueue).not.toContain('k0')
    })

    test('queued teach cards that were mastered in the meantime are dropped', () => {
        const data = items(10)
        const stars = { k0: MASTERY_STARS } // queued, but already mastered
        const state = { workingSet: ['k0', 'k1', 'k2', 'k3', 'k4', 'k5'], introQueue: ['k0', 'k1'] }
        const { item } = pickNextItem({
            data, idOf, getStars: i => stars[idOf(i)] ?? 0, learningMode: 'on', currentId: undefined, state, random: always(0.99),
        })
        expect(idOf(item)).toBe('k1')
    })
})

describe('Learning Mode off', () => {
    const data = items(10)
    const stars = { k0: MASTERY_STARS, k1: MASTERY_STARS } // two mastered, eight to learn
    const pick = (random, currentId) => idOf(pickNextItem({
        data, idOf, getStars: i => stars[idOf(i)] ?? 0, learningMode: 'off', currentId, state: INITIAL_PICKER_STATE, random,
    }).item)

    test('draws learning questions unless the 15% review roll hits', () => {
        expect(['k0', 'k1']).not.toContain(pick(always(0.99)))
        expect(['k0', 'k1']).toContain(pick(always(0)))
    })

    test('never asks the on-screen character again when there is another candidate', () => {
        for (let seed = 1; seed <= 50; seed++) expect(pick(seeded(seed), 'k5')).not.toBe('k5')
    })
})

describe('no immediate repeats at the edges', () => {
    test('one character left to learn and it was just shown: a review instead', () => {
        const data = items(3)
        const stars = { k0: 1, k1: MASTERY_STARS, k2: MASTERY_STARS }
        const { item } = pickNextItem({
            data, idOf, getStars: i => stars[idOf(i)] ?? 0, learningMode: 'off', currentId: 'k0', state: INITIAL_PICKER_STATE, random: always(0.99),
        })
        expect(idOf(item)).not.toBe('k0')
    })

    test('only one character mastered and it was just shown: a learning question instead', () => {
        const data = items(3)
        const stars = { k0: MASTERY_STARS } // the first mastery, just answered
        const { item } = pickNextItem({
            data, idOf, getStars: i => stars[idOf(i)] ?? 0, learningMode: 'off', currentId: 'k0', state: INITIAL_PICKER_STATE, random: always(0), // review roll hits
        })
        expect(idOf(item)).not.toBe('k0')
    })

    test('in a long run, no character is ever asked twice in a row while others exist', () => {
        for (const learningMode of ['on', 'off']) {
            const picks = simulate({ data: items(12), learningMode, count: 300, random: seeded(7) })
            for (let i = 1; i < picks.length; i++) expect(picks[i].id).not.toBe(picks[i - 1].id)
        }
    })
})
