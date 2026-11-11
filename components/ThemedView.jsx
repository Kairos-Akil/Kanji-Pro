import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../context/ThemeContext'

// View with the theme background. `safe` adds padding for the status bar / navigation bar.
// Not `0` when unsafe: paddingTop would beat a caller's `padding` shorthand; undefined is ignored.
const ThemedView = ({ style, safe = false, ...props }) => {
    const { theme } = useTheme()
    const insets = useSafeAreaInsets()

    return (
        <View
            style={[
                {
                    backgroundColor: theme.background,
                    paddingTop: safe ? insets.top : undefined,
                    paddingBottom: safe ? insets.bottom : undefined,
                },
                style,
            ]}
            {...props}
        />
    )
}

export default ThemedView
