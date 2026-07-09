import { View } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { useSafeAreaInsets } from 'react-native-safe-area-context'


const ThemedView = ({ style, safe = false, ...props }) => {
  const { theme } = useTheme()
  // Called unconditionally (only the `safe` branch uses it) so hook order stays stable.
  const insets = useSafeAreaInsets()

  if (!safe) return (
    <View
      style={[{ backgroundColor: theme.background }, style]}
      {...props}
    />
  )

  return (
    <View
      style={[{
        backgroundColor: theme.background,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      },
        style
      ]}
      {...props}
    />
  )

}

export default ThemedView