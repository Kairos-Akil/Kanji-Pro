// Pure streak logic used by ProgressContext. No React imports, so __tests__/streak.test.js can
// check it directly. A streak is stored as { count, lastActiveDate: 'YYYY-MM-DD' | null }.

// Local (not UTC) YYYY-MM-DD, so the streak's "day" boundary matches the device's clock.
export const getLocalDateString = (date = new Date()) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

export const isYesterday = (dateStr, todayStr) => {
    const d = new Date(`${dateStr}T00:00:00`)
    d.setDate(d.getDate() + 1)
    return getLocalDateString(d) === todayStr
}

// Count today as practiced: extend the streak if the last active day was yesterday, reset to 1 on
// a gap, or leave it unchanged (same object) if today is already recorded.
export const recordDay = (streak, today) => {
    if (streak.lastActiveDate === today) return streak
    if (streak.lastActiveDate && isYesterday(streak.lastActiveDate, today)) {
        return { count: streak.count + 1, lastActiveDate: today }
    }
    return { count: 1, lastActiveDate: today }
}

// The streak to show. The stored count only changes on activity, so a broken streak would keep
// showing until the next answer; show 0 once the last active day is older than yesterday.
export const displayedStreak = (streak, today) =>
    streak.lastActiveDate === today ||
        (streak.lastActiveDate && isYesterday(streak.lastActiveDate, today))
        ? streak.count
        : 0
