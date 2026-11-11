import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@react-native-vector-icons/ionicons'
import ThemedText from './ThemedText'

// Home's top line: app info on the left, the app name, search and settings on the right.
const HomeTopBar = ({ onOpenInfo, onOpenSearch, onOpenSettings }) => (
    <View style={styles.topBar}>
        <View style={styles.side}>
            <TouchableOpacity onPress={onOpenInfo} accessibilityLabel="App info" accessibilityRole="button">
                <Ionicons name="information-circle-outline" size={28} color="#888" />
            </TouchableOpacity>
        </View>
        <ThemedText style={styles.appName}>KANJI PRO</ThemedText>
        <View style={[styles.side, styles.actions]}>
            <TouchableOpacity onPress={onOpenSearch} accessibilityLabel="Search" accessibilityRole="button">
                <Ionicons name="search-outline" size={24} color="#888" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onOpenSettings} accessibilityLabel="Settings" accessibilityRole="button">
                <Ionicons name="settings-outline" size={26} color="#888" />
            </TouchableOpacity>
        </View>
    </View>
)

export default HomeTopBar

const styles = StyleSheet.create({
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginBottom: 5,
    },
    appName: { fontSize: 14, fontWeight: 'bold', letterSpacing: 2.5, opacity: 0.5, textTransform: 'uppercase' },
    side: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    actions: { justifyContent: 'flex-end', gap: 16 },
})
