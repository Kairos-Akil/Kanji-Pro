import { getLocalDateString, isYesterday, recordDay, displayedStreak } from '../utils/streak'

describe('isYesterday', () => {
    test('works across month and year boundaries', () => {
        expect(isYesterday('2026-11-10', '2026-11-11')).toBe(true)
        expect(isYesterday('2026-10-31', '2026-11-01')).toBe(true)
        expect(isYesterday('2025-12-31', '2026-01-01')).toBe(true)
        expect(isYesterday('2028-02-28', '2028-02-29')).toBe(true) // leap year
    })

    test('is false for the same day or a gap', () => {
        expect(isYesterday('2026-11-11', '2026-11-11')).toBe(false)
        expect(isYesterday('2026-11-09', '2026-11-11')).toBe(false)
    })
})

describe('getLocalDateString', () => {
    test('formats the local date with zero padding', () => {
        expect(getLocalDateString(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
    })
})

describe('recordDay (practicing)', () => {
    test('starts a streak on the first day', () => {
        expect(recordDay({ count: 0, lastActiveDate: null }, '2026-11-11')).toEqual({ count: 1, lastActiveDate: '2026-11-11' })
    })

    test('extends the streak the day after', () => {
        expect(recordDay({ count: 3, lastActiveDate: '2026-11-10' }, '2026-11-11')).toEqual({ count: 4, lastActiveDate: '2026-11-11' })
    })

    test('keeps the same object when today is already recorded', () => {
        const streak = { count: 3, lastActiveDate: '2026-11-11' }
        expect(recordDay(streak, '2026-11-11')).toBe(streak)
    })

    test('restarts at 1 after a gap', () => {
        expect(recordDay({ count: 9, lastActiveDate: '2026-11-08' }, '2026-11-11')).toEqual({ count: 1, lastActiveDate: '2026-11-11' })
    })
})

describe('displayedStreak (what Home shows)', () => {
    test('shows the count if the last practice was today or yesterday', () => {
        expect(displayedStreak({ count: 3, lastActiveDate: '2026-11-11' }, '2026-11-11')).toBe(3)
        expect(displayedStreak({ count: 3, lastActiveDate: '2026-11-10' }, '2026-11-11')).toBe(3)
    })

    test('shows 0 once a day was missed (the stale-streak bug)', () => {
        expect(displayedStreak({ count: 3, lastActiveDate: '2026-11-10' }, '2026-11-12')).toBe(0)
        expect(displayedStreak({ count: 0, lastActiveDate: null }, '2026-11-12')).toBe(0)
    })
})
