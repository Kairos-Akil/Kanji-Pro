import { createContext, useContext, useCallback, useState } from 'react'
import AlertModal from '../components/AlertModal'

const AlertContext = createContext(null)

const DEFAULT_BUTTONS = [{ text: 'OK' }]

export const AlertProvider = ({ children }) => {
    const [alertState, setAlertState] = useState(null) // { title, message, buttons } | null

    // Same call shape as Alert.alert(title, message, buttons).
    const showAlert = useCallback((title, message, buttons = DEFAULT_BUTTONS) => {
        setAlertState({ title, message, buttons })
    }, [])

    const handleButtonPress = (button) => {
        setAlertState(null)
        if (button.onPress) button.onPress()
    }

    return (
        <AlertContext.Provider value={showAlert}>
            {children}
            <AlertModal
                visible={!!alertState}
                title={alertState?.title}
                message={alertState?.message}
                buttons={alertState?.buttons ?? DEFAULT_BUTTONS}
                onButtonPress={handleButtonPress}
            />
        </AlertContext.Provider>
    )
}

// Returns showAlert(title, message, buttons) — a drop-in Alert.alert replacement that works on web.
export const useAlert = () => {
    const ctx = useContext(AlertContext)
    if (!ctx) {
        throw new Error('useAlert must be used inside AlertProvider')
    }
    return ctx
}
