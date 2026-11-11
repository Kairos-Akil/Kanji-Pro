import { renderHook, act } from '@testing-library/react-native'
import { AppState } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { usePersistedState } from '../hooks/usePersistedState'

jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock'))

// These pin the guarantees that protect saved progress: nothing is written before a successful
// read, a failed read is retried once and then reported, corrupt data is backed up, saves are
// debounced, and a pending save is written at once when the app goes to the background.

const KEY = 'TEST_KEY'
let appStateHandler

beforeEach(async () => {
    jest.useFakeTimers()
    await AsyncStorage.clear()
    jest.clearAllMocks()
    appStateHandler = null
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, handler) => {
        appStateHandler = handler
        return { remove: jest.fn() }
    })
})

afterEach(() => {
    jest.useRealTimers()
})

// Let pending promises run (the async storage read and its .then chain), move the fake clock
// forward by `ms` once, then let the promises that started run too.
const flushPromises = async () => {
    for (let i = 0; i < 10; i++) await act(async () => { await Promise.resolve() })
}
const settle = async (ms = 0) => {
    await flushPromises()
    await act(async () => { jest.advanceTimersByTime(ms) })
    await flushPromises()
}

const writesTo = (key) => AsyncStorage.setItem.mock.calls.filter(([k]) => k === key)

describe('loading', () => {
    test('loads the stored value', async () => {
        await AsyncStorage.setItem(KEY, JSON.stringify({ a: 3 }))
        const { result } = await renderHook(() => usePersistedState(KEY, {}))
        await settle()
        const [value, , isLoaded, loadFailed] = result.current
        expect(value).toEqual({ a: 3 })
        expect(isLoaded).toBe(true)
        expect(loadFailed).toBe(false)
    })

    test('uses the default when nothing is stored', async () => {
        const { result } = await renderHook(() => usePersistedState(KEY, { fresh: true }))
        await settle()
        expect(result.current[0]).toEqual({ fresh: true })
        expect(result.current[2]).toBe(true)
    })

    test('retries a failed read once, then works normally', async () => {
        await AsyncStorage.setItem(KEY, JSON.stringify(7))
        AsyncStorage.getItem.mockRejectedValueOnce(new Error('storage hiccup'))
        const { result } = await renderHook(() => usePersistedState(KEY, 0))
        await settle(300) // the retry pause
        expect(result.current[0]).toBe(7)
        expect(result.current[3]).toBe(false)
    })
})

describe('protecting stored data', () => {
    test('a read that fails twice never writes, and reports the failure', async () => {
        AsyncStorage.getItem
            .mockRejectedValueOnce(new Error('disk error'))
            .mockRejectedValueOnce(new Error('disk error'))
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
        const { result } = await renderHook(() => usePersistedState(KEY, {}))
        await settle(300)
        expect(result.current[2]).toBe(true) // isLoaded: callers stop waiting
        expect(result.current[3]).toBe(true) // loadFailed: the app can tell the user

        // Even after a change and well past the save delay, the unknown stored data is untouched.
        await act(async () => result.current[1]({ overwrite: 'me' }))
        await settle(2000)
        expect(writesTo(KEY)).toEqual([])
        warn.mockRestore()
    })

    test('corrupt data is backed up, then saving works again', async () => {
        await AsyncStorage.setItem(KEY, '{not json')
        jest.clearAllMocks()
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
        const { result } = await renderHook(() => usePersistedState(KEY, { n: 0 }))
        await settle()
        expect(writesTo(`${KEY}_CORRUPT_BACKUP`)).toEqual([[`${KEY}_CORRUPT_BACKUP`, '{not json']])
        expect(result.current[0]).toEqual({ n: 0 })

        await act(async () => result.current[1]({ n: 1 }))
        await settle(600)
        expect(writesTo(KEY).pop()).toEqual([KEY, JSON.stringify({ n: 1 })])
        warn.mockRestore()
    })
})

describe('saving', () => {
    // Load and let the post-load save run, so each test starts from a quiet state.
    const loaded = async () => {
        const hook = await renderHook(() => usePersistedState(KEY, 0))
        await settle(600)
        jest.clearAllMocks()
        return hook
    }

    test('a burst of changes is written once, after the debounce', async () => {
        const { result } = await loaded()
        await act(async () => { result.current[1](1) })
        await act(async () => { result.current[1](2) })
        await act(async () => { result.current[1](3) })
        await settle(400)
        expect(writesTo(KEY)).toEqual([]) // still within the 500 ms debounce
        await settle(200)
        expect(writesTo(KEY)).toEqual([[KEY, '3']])
    })

    test('going to the background writes the pending change immediately', async () => {
        const { result } = await loaded()
        await act(async () => { result.current[1](42) })
        expect(writesTo(KEY)).toEqual([])
        await act(async () => appStateHandler('background'))
        expect(writesTo(KEY)).toEqual([[KEY, '42']])
    })
})
