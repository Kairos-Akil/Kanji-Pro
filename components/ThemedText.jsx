import { Text } from 'react-native'
import { useTheme } from '../context/ThemeContext'

// Text in the theme's text color; `title` switches to the stronger title color.
const ThemedText = ({ style, title = false, ...props }) => {
    const { theme } = useTheme()

    return <Text style={[{ color: title ? theme.title : theme.text }, style]} {...props} />
}

export default ThemedText
