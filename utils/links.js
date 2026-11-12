import { Linking } from 'react-native'
import Constants from 'expo-constants'

// The version from app.json, copied into the app at build time (e.g. "1.3.0").
export const APP_VERSION = Constants.expoConfig?.version ?? 'unknown'

export const GITHUB_URL = 'https://github.com/Kairos-Akil/Kanji-Pro'
export const EDRDG_LICENCE_URL = 'https://www.edrdg.org/edrdg/licence.html'
// Tally form, no account needed. The app version goes into the form's hidden "version" field, so
// feedback shows which release it came from (Tally ignores it if the field doesn't exist).
export const FEEDBACK_URL = `https://tally.so/r/DqkeNZ?version=${encodeURIComponent(APP_VERSION)}`

// Opens a web page in the browser.
export const openLink = (url) => {
    Linking.openURL(url).catch(err => console.warn('Failed to open link:', err))
}
