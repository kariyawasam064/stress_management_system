import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";

export default function MonthlyReportScreen() {
  const BACKEND_URL = "http://10.41.153.172:3000";
  const USER_ID = "demo-user";

  const currentMonth = new Date().toISOString().slice(0, 7);

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const months = useMemo(
    () => [
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
      "2026-11",
      "2026-12",
    ],
    []
  );

  const loadMonthlyReport = async (month: string) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${BACKEND_URL}/api/reports/monthly?userId=${USER_ID}&month=${month}`
      );
      setReport(response.data);
    } catch (e) {
      console.log("MONTHLY REPORT ERROR", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonthlyReport(selectedMonth);
  }, [selectedMonth]);

  const maxEmotionCount = Math.max(
    report?.emotion_counts?.happy || 0,
    report?.emotion_counts?.sad || 0,
    report?.emotion_counts?.neutral || 0,
    1
  );

  const maxDailyTotal =
    Math.max(
      ...(report?.daily_breakdown?.map((d: any) => d.total || 0) || [1])
    ) || 1;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LinearGradient colors={["#F7A51A", "#E67E0D"]} style={styles.hero}>
        <Text style={styles.heroTitle}>Monthly Report</Text>
        <Text style={styles.heroSub}>
          Track emotional trends month by month
        </Text>
      </LinearGradient>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 16 }}
      >
        {months.map((m) => (
          <Pressable
            key={m}
            onPress={() => setSelectedMonth(m)}
            style={[
              styles.monthChip,
              selectedMonth === m && styles.monthChipActive,
            ]}
          >
            <Text
              style={[
                styles.monthChipText,
                selectedMonth === m && styles.monthChipTextActive,
              ]}
            >
              {m}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#E67E0D" />
          <Text style={styles.loadingText}>Loading monthly report...</Text>
        </View>
      ) : report ? (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Month Summary</Text>
            <Text style={styles.summaryText}>{report.summary}</Text>
            <Text style={styles.domEmotion}>
              Dominant Emotion: {report.dominant_emotion}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Monthly Emotion Graph</Text>

            <View style={styles.barChartWrap}>
              <EmotionBar
                label="Happy"
                value={report.emotion_counts?.happy || 0}
                color="#22C55E"
                maxValue={maxEmotionCount}
              />
              <EmotionBar
                label="Sad"
                value={report.emotion_counts?.sad || 0}
                color="#3B82F6"
                maxValue={maxEmotionCount}
              />
              <EmotionBar
                label="Neutral"
                value={report.emotion_counts?.neutral || 0}
                color="#F59E0B"
                maxValue={maxEmotionCount}
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Monthly Stats</Text>

            <View style={styles.statsRow}>
              <StatBox value={report.total_entries} label="Entries" />
              <StatBox value={report.voice_entries} label="Voice" />
              <StatBox value={report.text_entries} label="Text" />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Daily Trend Graph</Text>
            <Text style={styles.chartNote}>
              Each day shows total entries and mood composition.
            </Text>

            {report.daily_breakdown?.length ? (
              report.daily_breakdown.map((d: any) => (
                <View key={d.date} style={styles.dayRow}>
                  <Text style={styles.dayDate}>{d.date.slice(8, 10)}</Text>

                  <View style={styles.dayBarTrack}>
                    <View
                      style={[
                        styles.dayBarSegment,
                        {
                          width: `${((d.happy || 0) / maxDailyTotal) * 100}%`,
                          backgroundColor: "#22C55E",
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.dayBarSegment,
                        {
                          width: `${((d.sad || 0) / maxDailyTotal) * 100}%`,
                          backgroundColor: "#3B82F6",
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.dayBarSegment,
                        {
                          width: `${((d.neutral || 0) / maxDailyTotal) * 100}%`,
                          backgroundColor: "#F59E0B",
                        },
                      ]}
                    />
                  </View>

                  <Text style={styles.dayTotal}>{d.total}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No daily records for this month.</Text>
            )}

            <View style={styles.legendRow}>
              <Legend color="#22C55E" label="Happy" />
              <Legend color="#3B82F6" label="Sad" />
              <Legend color="#F59E0B" label="Neutral" />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Saved Monthly Records</Text>

            {report.entries?.length ? (
              report.entries.map((item: any) => (
                <View key={item.id} style={styles.recordRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recordText}>
                      {item.translated_transcript || item.original_transcript}
                    </Text>
                    <Text style={styles.recordMeta}>
                      {item.inputType} • {item.emotion_label} •{" "}
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No entries found for this month.</Text>
            )}
          </View>
        </>
      ) : (
        <Text style={styles.emptyText}>No report data available.</Text>
      )}
    </ScrollView>
  );
}

function EmotionBar({
  label,
  value,
  color,
  maxValue,
}: {
  label: string;
  value: number;
  color: string;
  maxValue: number;
}) {
  const height = Math.max(28, (value / maxValue) * 140);

  return (
    <View style={styles.emotionBarCol}>
      <Text style={styles.emotionBarValue}>{value}</Text>
      <View style={[styles.emotionBar, { height, backgroundColor: color }]} />
      <Text style={styles.emotionBarLabel}>{label}</Text>
    </View>
  );
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statNum}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#FFF6ED",
    minHeight: "100%",
    paddingBottom: 40,
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
    color: "rgba(255,255,255,0.92)",
    marginTop: 6,
  },

  monthChip: {
    backgroundColor: "#FFE7D1",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginRight: 10,
  },
  monthChipActive: {
    backgroundColor: "#E67E0D",
  },
  monthChipText: {
    color: "#6B4A35",
    fontWeight: "700",
  },
  monthChipTextActive: {
    color: "white",
  },

  loadingWrap: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#6B4A35",
    fontWeight: "700",
  },

  card: {
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

  barChartWrap: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    minHeight: 190,
    marginTop: 10,
    paddingBottom: 10,
  },
  emotionBarCol: {
    alignItems: "center",
    width: 80,
  },
  emotionBarValue: {
    fontWeight: "800",
    color: "#4A2A18",
    marginBottom: 8,
  },
  emotionBar: {
    width: 42,
    borderRadius: 14,
  },
  emotionBarLabel: {
    marginTop: 10,
    fontWeight: "700",
    color: "#6B4A35",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statBox: {
    flex: 1,
    backgroundColor: "#FFF7ED",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    marginHorizontal: 4,
  },
  statNum: {
    fontSize: 22,
    fontWeight: "800",
    color: "#E67E0D",
  },
  statLabel: {
    marginTop: 4,
    color: "#6B4A35",
    fontWeight: "700",
  },

  chartNote: {
    color: "#8A6A52",
    marginBottom: 10,
  },

  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  dayDate: {
    width: 32,
    fontWeight: "700",
    color: "#4A2A18",
  },
  dayBarTrack: {
    flex: 1,
    height: 18,
    flexDirection: "row",
    backgroundColor: "#FDE7CF",
    borderRadius: 10,
    overflow: "hidden",
    marginHorizontal: 10,
  },
  dayBarSegment: {
    height: 18,
  },
  dayTotal: {
    width: 28,
    textAlign: "right",
    fontWeight: "700",
    color: "#6B4A35",
  },

  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 18,
    marginTop: 14,
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    color: "#6B4A35",
    fontWeight: "700",
  },

  recordRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F6D8B8",
  },
  recordText: {
    color: "#3B2316",
    fontWeight: "600",
  },
  recordMeta: {
    marginTop: 4,
    color: "#8A6A52",
    fontSize: 12,
    textTransform: "capitalize",
  },

  emptyText: {
    color: "#8A6A52",
    lineHeight: 21,
  },
});