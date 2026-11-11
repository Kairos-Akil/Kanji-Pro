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

describe('date moved back (flying west, clock set back)', () => {
    // Last practiced on the 12th in Tokyo; in Los Angeles it is still the 11th.
    const streak = { count: 40, lastActiveDate: '2026-11-12' }

    test('the streak keeps showing', () => {
        expect(displayedStreak(streak, '2026-11-11')).toBe(40)
    })

    test('practicing does not reset it', () => {
        expect(recordDay(streak, '2026-11-11')).toBe(streak)
    })

    test('it continues normally once the dates line up again', () => {
        expect(recordDay(streak, '2026-11-13')).toEqual({ count: 41, lastActiveDate: '2026-11-13' })
    })
})

describe('clock that was badly wrong', () => {
    test('a last active day far in the future does not freeze the streak', () => {
        const streak = { count: 5, lastActiveDate: '2030-01-01' } // clock was set years ahead
        expect(displayedStreak(streak, '2026-11-11')).toBe(0)
        expect(recordDay(streak, '2026-11-11')).toEqual({ count: 1, lastActiveDate: '2026-11-11' })
    })
})
