import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { ExternalLink } from 'lucide-react-native'
import { Ionicons } from '@react-native-vector-icons/ionicons'
import { useTheme } from '../context/ThemeContext'
import { APP_VERSION, GITHUB_URL, EDRDG_LICENCE_URL, FEEDBACK_URL, openLink } from '../utils/links'
import BottomSheet from './BottomSheet'
import Spacer from './Spacer'

// A full-width button that opens a web page.
const LinkRow = ({ icon, label, url, accessibilityLabel }) => {
    const { theme } = useTheme()
    return (
        <TouchableOpacity
            style={[styles.linkRow, { borderColor: theme.inactive }]}
            onPress={() => openLink(url)}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="link"
        >
            <View style={styles.linkLabelRow}>
                <Ionicons name={icon} size={20} color={theme.text} />
                <Text style={[styles.linkLabel, { color: theme.text }]}>{label}</Text>
            </View>
            <ExternalLink size={16} color={theme.text} />
        </TouchableOpacity>
    )
}

// "About this app" sheet: thank-you note, feedback and repo links, and the EDRDG attribution
// that the KANJIDIC2/KRADFILE (CC BY-SA) licence requires to be shown somewhere user-visible.
const InfoModal = ({ isVisible, onClose }) => {
    const { theme } = useTheme()

    return (
        <BottomSheet isVisible={isVisible} onClose={onClose} title="About" heightPercent="60%">
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <Text style={[styles.body, { color: theme.text }]}>
                    Thank you for using Kanji Pro! Found a bug or have an idea? Send me feedback, no
                    account needed. You can also report issues on GitHub.
                </Text>

                <Spacer height={25} />

                <LinkRow
                    icon="chatbubble-ellipses-outline"
                    label="Send feedback"
                    url={FEEDBACK_URL}
                    accessibilityLabel="Send feedback"
                />

                <Spacer height={12} />

                <LinkRow
                    icon="logo-github"
                    label="View on GitHub"
                    url={GITHUB_URL}
                    accessibilityLabel="View the project on GitHub"
                />

                <Spacer height={30} />

                {/* --- Data licence --- */}
                <View style={[styles.licenceBlock, { borderTopColor: theme.inactive }]}>
                    <Text style={[styles.licenceText, { color: theme.text }]}>
                        Kanji readings, meanings, and radical decompositions are derived from
                        the KANJIDIC2 and KRADFILE dictionary files, © the Electronic
                        Dictionary Research and Development Group (EDRDG), used under the
                        Creative Commons Attribution-ShareAlike 4.0 licence.
                    </Text>
                    <TouchableOpacity
                        onPress={() => openLink(EDRDG_LICENCE_URL)}
                        accessibilityLabel="EDRDG licence details"
                        accessibilityRole="link"
                    >
                        <Text style={[styles.licenceLink, { color: theme.primary }]}>
                            edrdg.org/edrdg/licence.html
                        </Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.version, { color: theme.text }]}>Kanji Pro {APP_VERSION}</Text>

                <Spacer height={15} />
            </ScrollView>
        </BottomSheet>
    )
}

export default InfoModal

const styles = StyleSheet.create({
    body: {
        fontSize: 15,
        lineHeight: 22,
    },
    linkRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 15,
        borderWidth: 1,
    },
    linkLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    linkLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    licenceBlock: {
        borderTopWidth: StyleSheet.hairlineWidth,
        paddingTop: 12,
    },
    licenceText: {
        fontSize: 12,
        lineHeight: 17,
        opacity: 0.55,
    },
    licenceLink: {
        fontSize: 12,
        marginTop: 6,
    },
    version: {
        fontSize: 12,
        opacity: 0.55,
        textAlign: 'center',
        marginTop: 20,
    },
})
