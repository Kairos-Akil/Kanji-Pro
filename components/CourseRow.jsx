import { View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { Ionicons } from '@react-native-vector-icons/ionicons'
import { useTheme } from '../context/ThemeContext'
import ThemedText from './ThemedText'

// Card size; the row snaps by one card plus its gap.
const CARD_WIDTH = 160
const CARD_GAP = 16

// One category on Home (Kana, Kanji, Radicals): a heading and a sideways-scrolling row of course
// cards, tinted with accentColor. cards: { title, sub, icon, route, percent? }; percent is left out
// on the "What are …?" cards, which have no progress bar.
const CourseRow = ({ title, subtitle, cards, accentColor, onOpen }) => {
    const { theme } = useTheme()

    return (
        <View style={styles.section}>
            <View style={styles.header}>
                <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
                <View>
                    <ThemedText title style={styles.title}>{title}</ThemedText>
                    <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
                </View>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                decelerationRate="fast"
                snapToInterval={CARD_WIDTH + CARD_GAP}
            >
                {cards.map((card, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[styles.card, { backgroundColor: theme.uiBackground, borderColor: theme.text }]}
                        activeOpacity={0.8}
                        onPress={() => onOpen(card.route)}
                        accessibilityLabel={`${card.title}, ${card.sub}`}
                        accessibilityRole="button"
                    >
                        {/* '20'/'25' are hex alpha suffixes, tinting the accent color. */}
                        <View style={[styles.iconCircle, { backgroundColor: accentColor + '20' }]}>
                            <Ionicons name={card.icon} size={24} color={accentColor} />
                        </View>

                        <View>
                            <ThemedText title style={styles.cardTitle}>{card.title}</ThemedText>
                            <ThemedText style={styles.cardSub}>{card.sub}</ThemedText>
                        </View>

                        <View style={styles.cardFooter}>
                            {card.percent != null ? (
                                <View style={styles.progressGroup}>
                                    <View style={[styles.progressTrack, { backgroundColor: accentColor + '25' }]}>
                                        <View style={[styles.progressFill, { width: `${card.percent}%`, backgroundColor: accentColor }]} />
                                    </View>
                                    <ThemedText style={styles.progressPercent}>{card.percent}%</ThemedText>
                                </View>
                            ) : <View />}

                            <View style={[styles.arrowBox, { backgroundColor: accentColor }]}>
                                <Ionicons name="arrow-forward" size={16} color="#FFF" />
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    )
}

export default CourseRow

const styles = StyleSheet.create({
    section: { marginBottom: 20 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, marginBottom: 15 },
    accentBar: {
        width: 5,
        height: 45,
        borderRadius: 5,
        marginRight: 10,
    },
    title: { fontSize: 22, fontWeight: '800' },
    subtitle: { fontSize: 14, opacity: 0.5, marginTop: -2 },

    scrollContent: { paddingLeft: 16, paddingRight: 20, alignItems: 'center' },

    card: {
        width: CARD_WIDTH,
        height: 180,
        marginRight: CARD_GAP,
        borderRadius: 20,
        padding: 15,
        justifyContent: 'space-between',
        borderWidth: 1,
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 10 },
    cardSub: { fontSize: 12, opacity: 0.6 },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    progressTrack: {
        width: 40,
        height: 4,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressPercent: { fontSize: 13, fontWeight: '700', opacity: 0.85 },
    arrowBox: {
        width: 35,
        height: 35,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
})
