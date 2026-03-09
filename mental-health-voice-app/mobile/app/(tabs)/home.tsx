import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LinearGradient colors={["#F7A51A", "#E67E0D"]} style={styles.hero}>
        <Text style={styles.heroTitle}>Fix-Mind</Text>
        <Text style={styles.heroSub}>
          A Sinhala-first emotional wellbeing journal with voice, text, and daily reports.
        </Text>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Welcome</Text>
        <Text style={styles.cardText}>
          Use Voice Journal to record or type your feelings. View daily emotion history in Today’s Mood and monthly trends in Monthly Report.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Research Focus</Text>
        <Text style={styles.cardText}>
          Sinhala emotion understanding with voice-assisted journaling, transcript correction, and bilingual recommendations.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#FFF6ED",
    minHeight: "100%",
  },
  hero: {
    borderRadius: 28,
    padding: 22,
    marginBottom: 16,
  },
  heroTitle: {
    color: "white",
    fontSize: 30,
    fontWeight: "800",
  },
  heroSub: {
    marginTop: 8,
    color: "rgba(255,255,255,0.95)",
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#FFE7D1",
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#4A2A18",
    marginBottom: 6,
  },
  cardText: {
    color: "#6B4A35",
    lineHeight: 21,
  },
});