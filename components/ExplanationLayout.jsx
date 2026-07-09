import { StyleSheet, ScrollView, View, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import ThemedView from './ThemedView'
import ThemedText from './ThemedText'
import { useTheme } from '../context/ThemeContext'

const ExplanationLayout = ({ data, accentColor, icon }) => {
    const { theme } = useTheme();

    return (
        <ThemedView style={styles.container} backgroundColor={theme.background}>

            {/* --- HERO HEADER --- */}
            <View style={styles.headerContainer}>
                <LinearGradient
                    colors={[accentColor, theme.background]}
                    style={styles.gradientHeader}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                >
                    {/* Back Button */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={28} color="#FFF" />
                    </TouchableOpacity>

                    {/* Hero Content */}
                    <View style={styles.heroContent}>
                        <View style={styles.iconContainer}>
                            <Ionicons name={icon} size={40} color={accentColor} />
                        </View>
                        <ThemedText style={styles.heroTitle}>{data.title}</ThemedText>
                        <ThemedText style={styles.heroSubtitle}>{data.subtitle}</ThemedText>
                    </View>

                    {/* Giant Background Watermark */}
                    <ThemedText style={[styles.watermark, { color: '#FFFFFF20' }]}>
                        {data.watermarkChar}
                    </ThemedText>
                </LinearGradient>
            </View>

            {/* --- SCROLLABLE CONTENT --- */}
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Introduction */}
                <View style={[styles.card, { backgroundColor: theme.uiBackground || '#f5f5f5' }]}>
                    <ThemedText title style={styles.sectionHeader}>Overview</ThemedText>
                    <ThemedText style={styles.bodyText}>{data.intro}</ThemedText>
                </View>

                {/* Key Features / Points */}
                {data.sections.map((section, index) => (
                    <View key={index} style={styles.sectionContainer}>
                        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
                        <View style={{ flex: 1 }}>
                            <ThemedText style={styles.subHeader} title={true}>
                                {section.heading}
                            </ThemedText>
                            <ThemedText style={styles.bodyText}>
                                {section.text}
                            </ThemedText>
                        </View>
                    </View>
                ))}

                {/* Visual Example Box */}
                <View style={[styles.exampleBox, { borderColor: accentColor }]}>
                    <ThemedText style={[styles.exampleTitle, { color: accentColor }]}>
                        EXAMPLE
                    </ThemedText>
                    <View style={styles.exampleRow}>
                        <ThemedText style={styles.exampleChar}>{data.example.char}</ThemedText>
                        <View>
                            <ThemedText style={styles.exampleReading}>{data.example.reading}</ThemedText>
                            <ThemedText style={styles.exampleMeaning}>{data.example.meaning}</ThemedText>
                        </View>
                    </View>
                </View>

                <View style={{ height: 50 }} />
            </ScrollView>
        </ThemedView>
    );
};

export default ExplanationLayout;

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerContainer: { height: 280, marginBottom: -20, zIndex: 1 },
    gradientHeader: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
    backButton: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.2)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 20
    },
    heroContent: { alignItems: 'center', zIndex: 10 },
    iconContainer: {
        width: 70, height: 70, borderRadius: 35,
        backgroundColor: 'white', alignItems: 'center', justifyContent: 'center',
        marginBottom: 15, elevation: 5
    },
    heroTitle: { fontSize: 32, fontWeight: '900', color: '#FFF', textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 10 },
    heroSubtitle: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginTop: 5 },
    watermark: {
        position: 'absolute', right: -20, bottom: -30,
        fontSize: 200, fontWeight: '900', zIndex: 0
    },

    scrollContent: { paddingTop: 40, paddingHorizontal: 20 },

    card: {
        padding: 20, borderRadius: 20, marginBottom: 25,
    },
    sectionHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    bodyText: { fontSize: 16, lineHeight: 24, opacity: 0.8 },

    sectionContainer: { flexDirection: 'row', marginBottom: 25 },
    accentBar: { width: 4, borderRadius: 2, marginRight: 15, height: '100%' },
    subHeader: { fontSize: 18, fontWeight: '700', marginBottom: 5 },

    exampleBox: {
        borderWidth: 2, borderRadius: 20, borderStyle: 'dashed',
        padding: 20, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.02)'
    },
    exampleTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 10 },
    exampleRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
    exampleChar: { fontSize: 48, fontWeight: 'bold' },
    exampleReading: { fontSize: 14, opacity: 0.6 },
    exampleMeaning: { fontSize: 18, fontWeight: 'bold' }
});