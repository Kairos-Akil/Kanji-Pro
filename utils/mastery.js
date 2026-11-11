// How stars work. Progress stores one number per character:
//   0-5  still learning (that many stars)
//   6    mastered (MASTERY_STARS)
//   6+N  mastered, then answered correctly N more times in a row: shown as 6 stars "+N"
// A correct answer adds 1, with no cap. A mistake on a mastered character drops it to 5, back into
// practice (so "+N" starts over); otherwise a mistake removes 1 star.
// No React imports, so __tests__/mastery.test.js can check these rules directly.

export const MASTERY_STARS = 6

export const isMastered = (stars) => stars >= MASTERY_STARS

// Correct answers in a row since mastering: the "+N".
export const bonusStars = (stars) => Math.max(stars - MASTERY_STARS, 0)

export const afterCorrect = (stars) => stars + 1

export const afterWrong = (stars) => isMastered(stars) ? MASTERY_STARS - 1 : Math.max(stars - 1, 0)

// How likely a mastered character is to come back in a review: each "+1" halves it, so a freshly
// mastered (shaky) character returns far more often than a solid one.
export const reviewWeight = (stars) => 0.5 ** bonusStars(stars)

// The pool to draw the next learning question from. If its only character is the one just shown
// (one left to learn), use the review pool instead, so it isn't asked twice in a row; it then comes
// back every other question. Without reviews to fall back on, the same character is all there is.
export const avoidRepeat = (pool, reviewPool, currentId, idOf) =>
    pool.length === 1 && idOf(pool[0]) === currentId && reviewPool.length > 0 ? reviewPool : pool

// Random pick where each item's chance is proportional to weightOf(item): weight 1 is twice as
// likely as weight 0.5. `random` is injectable so tests can make it predictable.
export const pickWeighted = (items, weightOf, random = Math.random) => {
    const total = items.reduce((sum, item) => sum + weightOf(item), 0)
    let remaining = random() * total
    for (const item of items) {
        remaining -= weightOf(item)
        if (remaining < 0) return item
    }
    return items[items.length - 1] // floating-point rounding at the very end
}
