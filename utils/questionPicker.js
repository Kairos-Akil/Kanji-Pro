import { shuffle } from './answers'
import { isMastered, reviewWeight, pickWeighted, avoidRepeat } from './mastery'

// Which character the quiz asks next. Pure: no React, no refs; the Learning Mode state goes in and
// a new state comes out, and `random` is injectable. So __tests__/questionPicker.test.js can check
// it directly.

// Learning Mode drills only a small "working set" of unmastered items at a time, so a fresh
// course doesn't throw all characters at the user at once. The set fills instantly to the minimum,
// then grows by chance per question up to the maximum; mastering an item frees its slot.
// With Learning Mode off, the quiz draws from all unmastered items (plain test).
export const WORKING_SET_MIN = 5
export const WORKING_SET_MAX = 15
export const NEW_ITEM_CHANCE = 0.1

// Chance of re-drilling a mastered item, so mastery can still be lost and the quiz never runs dry.
// Which mastered item is weighted by its "+N" (see reviewWeight in utils/mastery.js).
export const REVIEW_CHANCE = 0.15

// Learning Mode state at quiz start. workingSet: ids drilled right now (null = not built yet).
// introQueue: ids that rolled into the set but haven't been shown; they come back-to-back (as
// teach cards) before normal quizzing resumes.
export const INITIAL_PICKER_STATE = { workingSet: null, introQueue: [] }

// Sync the working set with current progress; returns the new set, intro queue and the set's items.
// Runs before every question, so it self-heals when an item changes state (e.g. a missed review
// drops a mastered item back to 5 stars).
export const updateWorkingSet = (state, unmastered, getStars, idOf, random = Math.random) => {
    const inProgress = unmastered.filter(item => getStars(item) > 0)

    // First run: resume the items already in progress, so prior partial stars stay active.
    const previous = state.workingSet === null
        ? shuffle(inProgress, random).slice(0, WORKING_SET_MAX).map(idOf)
        : state.workingSet

    const unmasteredIds = new Set(unmastered.map(idOf))
    const set = previous.filter(id => unmasteredIds.has(id)) // drop mastered items
    const setIds = new Set(set)
    const introQueue = [...state.introQueue]
    const enroll = (item) => { set.push(idOf(item)); setIds.add(idOf(item)) }

    // Partially-starred items outside the set (e.g. a mastered item demoted by a missed review)
    // re-enter before brand-new ones.
    for (const item of shuffle(inProgress, random)) {
        if (set.length >= WORKING_SET_MAX) break
        if (!setIds.has(idOf(item))) enroll(item)
    }

    // Fill instantly up to the minimum, then let new items trickle in by chance.
    const fresh = shuffle(unmastered.filter(item => !setIds.has(idOf(item))), random)
    const enrollFresh = () => {
        const item = fresh.pop()
        enroll(item)
        introQueue.push(idOf(item))
    }
    while (set.length < WORKING_SET_MIN && fresh.length > 0) enrollFresh()
    if (set.length < WORKING_SET_MAX && fresh.length > 0 && random() < NEW_ITEM_CHANCE) {
        enrollFresh()
    }

    return {
        workingSet: set,
        introQueue,
        items: unmastered.filter(item => setIds.has(idOf(item))),
    }
}

// The next item to ask, plus the new Learning Mode state (unchanged when Learning Mode is off).
// currentId: the item on screen right now (undefined before the first question).
export const pickNextItem = ({ data, idOf, getStars, learningMode, currentId, state, random = Math.random }) => {
    const unmastered = data.filter(item => !isMastered(getStars(item)))
    const mastered = data.filter(item => isMastered(getStars(item)))

    let nextState = state
    let item = null
    let pool
    // Where learning questions come from: the working set with Learning Mode on, else every
    // unmastered item. Needed below to swap pools when one holds only the on-screen character.
    let learningPool = unmastered

    // The working set (and its teach-first queue) is Learning Mode's pacing. With Learning Mode off
    // the quiz is a plain test drawing from every unmastered item at once.
    if (learningMode === 'on') {
        const updated = updateWorkingSet(state, unmastered, getStars, idOf, random)
        learningPool = updated.items

        // Drop queued ids that left the set in the meantime (e.g. after a progress reset).
        let introQueue = updated.introQueue.filter(id => updated.items.some(i => idOf(i) === id))

        if (introQueue.length > 0) {
            // Freshly rolled-in characters are shown back-to-back, before quizzing resumes.
            const [nextId, ...rest] = introQueue
            item = updated.items.find(i => idOf(i) === nextId)
            introQueue = rest
        } else if (updated.items.length === 0) {
            pool = mastered // everything mastered: reviews are all that's left
        } else if (mastered.length > 0 && random() < REVIEW_CHANCE) {
            pool = mastered
        } else {
            pool = updated.items
        }
        nextState = { workingSet: updated.workingSet, introQueue }
    } else if (unmastered.length === 0) {
        pool = mastered // everything mastered: reviews are all that's left
    } else if (mastered.length > 0 && random() < REVIEW_CHANCE) {
        pool = mastered
    } else {
        pool = unmastered
    }

    if (!item) {
        // If the chosen pool holds only the character that was just shown, take the other pool
        // instead: one character left to learn -> a review; only one character mastered so far
        // (e.g. right after the first mastery) -> a learning question.
        pool = pool === mastered
            ? avoidRepeat(mastered, learningPool, currentId, idOf)
            : avoidRepeat(pool, mastered, currentId, idOf)

        // Don't re-ask the on-screen character (skipped only if it's the only candidate).
        const candidates = pool.length > 1 && currentId !== undefined
            ? pool.filter(i => idOf(i) !== currentId)
            : pool
        // Reviews favor shaky items: a high "+N" (solidly known) makes an item come back rarely.
        item = pool === mastered
            ? pickWeighted(candidates, i => reviewWeight(getStars(i)), random)
            : candidates[Math.floor(random() * candidates.length)]
    }

    return { item, state: nextState }
}
