import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";

export default function TodayMoodScreen() {
  const BACKEND_URL = "http://10.41.153.172:3000";
  const USER_ID = "demo-user";

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const loadReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${BACKEND_URL}/api/reports/daily?userId=${USER_ID}&date=${today}`
      );
      setReport(response.data);
    } catch (e) {
      console.log("TODAY REPORT ERROR", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadReport} />}
    >
      <LinearGradient colors={["#F7A51A", "#E67E0D"]} style={styles.hero}>
        <Text style={styles.heroTitle}>Today's Mood</Text>
        <Text style={styles.heroSub}>{today}</Text>
      </LinearGradient>

      {report && (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>Daily Summary</Text>
            <Text style={styles.summaryText}>{report.summary}</Text>
            <Text style={styles.domEmotion}>
              Dominant Emotion: {report.dominant_emotion}
            </Text>
          </View>

          <View style={styles.grid}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{report.total_entries}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{report.voice_entries}</Text>
              <Text style={styles.statLabel}>Voice</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{report.text_entries}</Text>
              <Text style={styles.statLabel}>Text</Text>
            </View>
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.cardTitle}>Emotion Counts</Text>
            <View style={styles.barWrap}>
              <Bar label="Happy" value={report.emotion_counts.happy} color="#22C55E" />
              <Bar label="Sad" value={report.emotion_counts.sad} color="#3B82F6" />
              <Bar label="Neutral" value={report.emotion_counts.neutral} color="#F59E0B" />
            </View>
          </View>

          <View style={styles.recordsCard}>
            <Text style={styles.cardTitle}>Today's Records</Text>
            {report.entries?.map((item: any) => (
              <View key={item.id} style={styles.recordRow}>
                <View style={styles.recordLeft}>
                  <Ionicons
                    name={item.inputType === "voice" ? "mic-outline" : "document-text-outline"}
                    size={18}
                    color="#E67E0D"
                  />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={styles.recordText}>
                      {item.translated_transcript || item.original_transcript}
                    </Text>
                    <Text style={styles.recordMeta}>
                      {item.inputType} • {item.emotion_label} • {new Date(item.createdAt).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      <Pressable style={styles.reloadBtn} onPress={loadReport}>
        <Text style={styles.reloadBtnText}>Refresh Report</Text>
      </Pressable>
    </ScrollView>
  );
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  const width = Math.max(12, value * 40);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ marginBottom: 6, fontWeight: "700", color: "#4A2A18" }}>
        {label}: {value}
      </Text>
      <View style={{ height: 18, backgroundColor: "#FDE7CF", borderRadius: 10 }}>
        <View
          style={{
            width,
            height: 18,
            backgroundColor: color,
            borderRadius: 10,
          }}
        />
      </View>
    </View>
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
    fontSize: 28,
    fontWeight: "800",
  },
  heroSub: {
    color: "rgba(255,255,255,0.9)",
    marginTop: 6,
  },
  summaryCard: {
    backgroundColor: "#FFE7D1",
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
  },
  chartCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
  },
  recordsCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#4A2A18",
    marginBottom: 10,
  },
  summaryText: {
    color: "#6B4A35",
    lineHeight: 21,
  },
  domEmotion: {
    marginTop: 10,
    fontWeight: "800",
    color: "#E67E0D",
    textTransform: "capitalize",
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#FFF",
    marginHorizontal: 4,
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: "center",
  },
  statNum: {
    fontSize: 24,
    fontWeight: "800",
    color: "#E67E0D",
  },
  statLabel: {
    marginTop: 4,
    color: "#6B4A35",
    fontWeight: "700",
  },
  barWrap: {
    marginTop: 8,
  },
  recordRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F6D8B8",
  },
  recordLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  recordText: {
    color: "#3B2316",
    fontWeight: "600",
  },
  recordMeta: {
    marginTop: 4,
    color: "#8A6A52",
    fontSize: 12,
  },
  reloadBtn: {
    backgroundColor: "#E67E0D",
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  reloadBtnText: {
    color: "white",
    fontWeight: "800",
  },
});