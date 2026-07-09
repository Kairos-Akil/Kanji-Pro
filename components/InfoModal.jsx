import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native'
import { Heart, ExternalLink } from 'lucide-react-native'
import { Ionicons } from '@expo/vector-icons'

import { useTheme } from '../context/ThemeContext'
import BottomSheet from './BottomSheet'
import Spacer from './Spacer'

const GITHUB_URL = 'https://github.com/Kairos-Akil/Kanji-Pro'
// const DONATE_URL = 'https://ko-fi.com' // set when donations go live
const EDRDG_LICENCE_URL = 'https://www.edrdg.org/edrdg/licence.html'

const openLink = (url) => {
    Linking.openURL(url).catch(err => console.warn('Failed to open link:', err))
}

// "About this app" sheet: thank-you note, repo link, support link, and the EDRDG attribution
// that the KANJIDIC2/KRADFILE (CC BY-SA) licence requires to be shown somewhere user-visible.
const InfoModal = ({ isVisible, onClose }) => {
    const { theme } = useTheme()

    return (
        <BottomSheet isVisible={isVisible} onClose={onClose} title="About" heightPercent="60%">
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

                <Text style={[styles.body, { color: theme.text }]}>
                    Thank you for using Kanji Pro! If you find any issues or bugs, please report them on my GitHub page.
                </Text>

                <Spacer height={25} />

                <TouchableOpacity
                    style={[styles.linkRow, { borderColor: theme.inactive }]}
                    onPress={() => openLink(GITHUB_URL)}
                    accessibilityLabel="View the project on GitHub"
                    accessibilityRole="link"
                >
                    <View style={styles.linkLabelRow}>
                        <Ionicons name="logo-github" size={20} color={theme.text} />
                        <Text style={[styles.linkLabel, { color: theme.text }]}>View on GitHub</Text>
                    </View>
                    <ExternalLink size={16} color={theme.text} />
                </TouchableOpacity>

                <Spacer height={12} />

                <TouchableOpacity
                    style={[styles.linkRow, { borderColor: theme.inactive }]}
                    // onPress={() => openLink(DONATE_URL)}
                    accessibilityLabel="Support development"
                    accessibilityRole="link"
                    accessibilityState={{ disabled: true }}
                >
                    <View style={styles.linkLabelRow}>
                        <Ionicons name="heart-outline" size={20} color={theme.text} />
                        <Text style={[styles.linkLabel, { color: theme.text }]}>Support development</Text>
                    </View>
                    <ExternalLink size={16} color={theme.text} />
                </TouchableOpacity>

                <Spacer height={12} />

                <View style={styles.donateRow}>
                    <Heart size={13} color={theme.text} style={{ opacity: 0.55 }} />
                    <Text style={[styles.donateText, { color: theme.text }]}>
                        {/* Enjoying the app? You can support its development by buying me a coffee on Ko-fi. */}
                        The donation button doesn&apos;t work yet. I might enable it in a future update.
                    </Text>
                </View>

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
    donateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 6,
    },
    donateText: {
        fontSize: 13,
        opacity: 0.55,
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
})
