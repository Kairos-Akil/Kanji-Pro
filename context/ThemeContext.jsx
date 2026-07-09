import { createContext, useContext } from 'react'
import { Colors } from '../constants/Colors'
import { usePersistedState } from '../hooks/usePersistedState'

const ThemeContext = createContext(null)

const STORAGE_KEY = 'KANJI_PRO_THEME_MODE'
const MODES = ['light', 'dark', 'oled']
const DEFAULT_MODE = 'dark'

// Stored as a plain string (not JSON) for backward compatibility; invalid values fall back to default.
const modeCodec = {
    serialize: (mode) => mode,
    deserialize: (stored) => (MODES.includes(stored) ? stored : DEFAULT_MODE),
}

export const ThemeProvider = ({ children }) => {
    const [mode, setModeRaw] = usePersistedState(STORAGE_KEY, DEFAULT_MODE, modeCodec)

    const setMode = (newMode) => {
        if (MODES.includes(newMode)) setModeRaw(newMode)
    }

    // Semantic colors are shared across modes, so they're merged in from the top level of Colors.
    const theme = {
        ...(Colors[mode] ?? Colors.dark),
        primary: Colors.primary,
        success: Colors.success,
        error: Colors.error,
        inactive: Colors.inactive,
    }

    return (
        <ThemeContext.Provider value={{ mode, setMode, theme, modes: MODES }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => {
    const ctx = useContext(ThemeContext)
    if (!ctx) {
        throw new Error('useTheme must be used inside ThemeProvider')
    }
    return ctx
}
