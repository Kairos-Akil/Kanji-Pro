import {
    MASTERY_STARS,
    isMastered,
    bonusStars,
    afterCorrect,
    afterWrong,
    reviewWeight,
    pickWeighted,
    avoidRepeat,
} from '../utils/mastery'

describe('stars and mastery', () => {
    test('mastered at 6 stars', () => {
        expect(MASTERY_STARS).toBe(6)
        expect(isMastered(5)).toBe(false)
        expect(isMastered(6)).toBe(true)
        expect(isMastered(9)).toBe(true)
    })

    test('"+N" counts the correct answers since mastering', () => {
        expect(bonusStars(4)).toBe(0)
        expect(bonusStars(6)).toBe(0)
        expect(bonusStars(9)).toBe(3)
    })

    test('a correct answer adds one, with no cap', () => {
        expect(afterCorrect(0)).toBe(1)
        expect(afterCorrect(6)).toBe(7)
        expect(afterCorrect(20)).toBe(21)
    })

    test('a mistake on a mastered item drops it back into practice and resets "+N"', () => {
        expect(afterWrong(6)).toBe(5)
        expect(afterWrong(13)).toBe(5)
        expect(isMastered(afterWrong(13))).toBe(false)
    })

    test('a mistake on an unmastered item removes one star, never below 0', () => {
        expect(afterWrong(4)).toBe(3)
        expect(afterWrong(0)).toBe(0)
    })

    test('old progress from a higher mastery level keeps its stars as "+N"', () => {
        // Someone who had mastery level 10 and an item at 10 stars:
        expect(isMastered(10)).toBe(true)
        expect(bonusStars(10)).toBe(4)
    })
})

describe('reviews', () => {
    test('each "+1" halves how often a mastered item comes back', () => {
        expect(reviewWeight(6)).toBe(1)
        expect(reviewWeight(7)).toBe(0.5)
        expect(reviewWeight(9)).toBe(0.125)
    })

    test('pickWeighted follows the weights exactly at the boundaries', () => {
        const items = ['a', 'b'] // weights 1 and 3: 'a' covers the first quarter of the range
        const weight = item => (item === 'a' ? 1 : 3)
        expect(pickWeighted(items, weight, () => 0)).toBe('a')
        expect(pickWeighted(items, weight, () => 0.24)).toBe('a')
        expect(pickWeighted(items, weight, () => 0.26)).toBe('b')
        expect(pickWeighted(items, weight, () => 0.9999)).toBe('b')
    })

    test('a freshly mastered item is reviewed far more often than a solid one', () => {
        const stars = { shaky: 6, solid: 10 } // "+0" vs "+4": weights 1 vs 1/16
        const counts = { shaky: 0, solid: 0 }
        for (let i = 0; i < 10000; i++) {
            counts[pickWeighted(['shaky', 'solid'], id => reviewWeight(stars[id]))]++
        }
        // Expected ratio 16:1, i.e. the solid item comes back about 6% of the time.
        expect(counts.solid / 10000).toBeGreaterThan(0.03)
        expect(counts.solid / 10000).toBeLessThan(0.09)
    })
})

describe('avoidRepeat (one character left to learn)', () => {
    const id = item => item.c
    const learning = [{ c: '日' }]
    const reviews = [{ c: '一' }, { c: '人' }]

    test('switches to reviews when the only learning character was just shown', () => {
        expect(avoidRepeat(learning, reviews, '日', id)).toBe(reviews)
    })

    test('keeps the learning pool when the last question was something else', () => {
        expect(avoidRepeat(learning, reviews, '一', id)).toBe(learning)
        expect(avoidRepeat(learning, reviews, undefined, id)).toBe(learning) // first question
    })

    test('keeps the learning pool when several characters are left', () => {
        const several = [{ c: '日' }, { c: '月' }]
        expect(avoidRepeat(several, reviews, '日', id)).toBe(several)
    })

    test('repeats only when there is nothing to review', () => {
        expect(avoidRepeat(learning, [], '日', id)).toBe(learning)
    })
})

describe('avoidRepeat, the other direction (first character just mastered)', () => {
    const id = item => item.c
    test('a review pool holding only the on-screen character falls back to learning questions', () => {
        const mastered = [{ c: '日' }]          // the only mastered character, just answered
        const learning = [{ c: '月' }, { c: '火' }]
        expect(avoidRepeat(mastered, learning, '日', id)).toBe(learning)
    })
})
