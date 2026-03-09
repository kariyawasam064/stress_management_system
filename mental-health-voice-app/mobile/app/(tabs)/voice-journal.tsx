import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { Audio } from "expo-av";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function VoiceJournalScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState("");
  const [manualText, setManualText] = useState("");
  const [correctedText, setCorrectedText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [language, setLanguage] = useState<"si" | "en">("si");
  const [showSinhalaRecommendations, setShowSinhalaRecommendations] = useState(false);

  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<any>(null);

  const BACKEND_URL = "http://10.41.153.172:3000";
  const USER_ID = "demo-user";

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");
  const timeLabel = `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;

  const startTimer = () => {
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((s: number) => s + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const startRecording = async () => {
    try {
      setResult(null);
      setCorrectedText("");
      setStatus("Requesting microphone permission...");

      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setStatus("Microphone permission denied");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      setStatus("Recording...");
      startTimer();

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
    } catch (e: any) {
      stopTimer();
      setStatus("Start recording error: " + e.message);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      setStatus("Stopping...");
      stopTimer();

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI() || "";
      setRecording(null);
      setAudioUri(uri);
      setStatus(uri ? "Recorded ✅" : "Recorded");
    } catch (e: any) {
      setStatus("Stop recording error: " + e.message);
    }
  };

  const uploadAudio = async () => {
    if (!audioUri) {
      setStatus("No audio recorded");
      return;
    }

    try {
      setStatus("Uploading & analyzing...");
      setResult(null);

      const form = new FormData();
      form.append("language", language);
      form.append("userId", USER_ID);
      form.append(
        "audio",
        {
          uri: audioUri,
          name: "voice.m4a",
          type: "audio/m4a",
        } as any
      );

      const response = await axios.post(`${BACKEND_URL}/api/analyze`, form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });

      setResult(response.data);
      setCorrectedText(response.data.original_transcript || "");
      setShowSinhalaRecommendations(false);
      setStatus("Done ✅");
    } catch (error: any) {
      const msg = error?.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;
      setStatus("Error: " + msg);
    }
  };

  const analyzeManualText = async () => {
    if (!manualText.trim()) {
      setStatus(language === "si" ? "Text එක type කරන්න" : "Please type text first");
      return;
    }

    try {
      setStatus("Analyzing typed text...");
      setResult(null);

      const response = await axios.post(
        `${BACKEND_URL}/api/analyze-text`,
        {
          text: manualText,
          language,
          userId: USER_ID,
        },
        { timeout: 120000 }
      );

      setResult(response.data);
      setCorrectedText(response.data.original_transcript || "");
      setShowSinhalaRecommendations(false);
      setStatus("Done ✅");
    } catch (error: any) {
      const msg = error?.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;
      setStatus("Error: " + msg);
    }
  };

  const analyzeCorrectedText = async () => {
    if (!correctedText.trim()) {
      setStatus(language === "si" ? "Corrected text එක empty" : "Corrected text is empty");
      return;
    }

    try {
      setStatus("Analyzing corrected text...");

      const response = await axios.post(
        `${BACKEND_URL}/api/analyze-corrected`,
        {
          corrected_text: correctedText,
          language,
          userId: USER_ID,
        },
        { timeout: 120000 }
      );

      setResult(response.data);
      setShowSinhalaRecommendations(false);
      setStatus("Done ✅");
    } catch (error: any) {
      const msg = error?.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;
      setStatus("Error: " + msg);
    }
  };

  const getMoodMeta = (emotion?: string) => {
    switch (emotion) {
      case "happy":
        return {
          icon: "emoticon-happy-outline" as const,
          color: "#22C55E",
          label: "Happy",
        };
      case "sad":
        return {
          icon: "emoticon-sad-outline" as const,
          color: "#3B82F6",
          label: "Sad",
        };
      default:
        return {
          icon: "emoticon-neutral-outline" as const,
          color: "#A16207",
          label: "Neutral",
        };
    }
  };

  const moodMeta = getMoodMeta(result?.emotion_label);

  return (
    <View style={styles.root}>
      <LinearGradient colors={["#F7A51A", "#E67E0D"]} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerGreeting}>Voice Journal</Text>
            <Text style={styles.headerTitle}>Fix-Mind</Text>
          </View>
          <View style={styles.headerBadge}>
            <Ionicons name="sparkles-outline" size={18} color="#fff" />
            <Text style={styles.headerBadgeText}>AI Care</Text>
          </View>
        </View>

        <Text style={styles.headerSub}>
          Record, correct, and understand your emotions in Sinhala or English.
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <Text style={styles.heroTitle}>Voice Journal</Text>
            <View style={styles.timerPill}>
              <Ionicons name="time-outline" size={14} color="#7C4A16" />
              <Text style={styles.timerText}>{timeLabel}</Text>
            </View>
          </View>

          <Text style={styles.heroSub}>
            Speak naturally, then review, correct, and analyze your mood.
          </Text>

          <View style={styles.waveRow}>
            {Array.from({ length: 28 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.waveBar,
                  { height: 10 + ((i * 7) % 36) },
                  recording && styles.waveActive,
                ]}
              />
            ))}
          </View>

          <View style={styles.controlsRow}>
            <Pressable style={styles.sideBtn}>
              <Ionicons name="pause" size={20} color="#E67E0D" />
            </Pressable>

            <Pressable
              style={[styles.micOuter, recording && styles.micOuterActive]}
              onPress={recording ? stopRecording : startRecording}
            >
              <LinearGradient
                colors={recording ? ["#EF4444", "#DC2626"] : ["#F7A51A", "#E67E0D"]}
                style={styles.micInner}
              >
                <Ionicons name="mic" size={28} color="white" />
              </LinearGradient>
            </Pressable>

            <Pressable style={styles.sideBtn} onPress={stopRecording}>
              <Ionicons name="stop" size={20} color="#E67E0D" />
            </Pressable>
          </View>

          <View style={styles.langRow}>
            <Pressable
              onPress={() => setLanguage("si")}
              style={[styles.langPill, language === "si" && styles.langPillActive]}
            >
              <Text style={[styles.langText, language === "si" && styles.langTextActive]}>
                Sinhala
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setLanguage("en")}
              style={[styles.langPill, language === "en" && styles.langPillActive]}
            >
              <Text style={[styles.langText, language === "en" && styles.langTextActive]}>
                English
              </Text>
            </Pressable>
          </View>

          <Pressable style={styles.primaryBtn} onPress={uploadAudio}>
            <Ionicons name="cloud-upload-outline" size={18} color="white" />
            <Text style={styles.primaryBtnText}>Upload & Analyze Voice</Text>
          </Pressable>

          <Text style={styles.status}>{status}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Manual Text Input</Text>
          <Text style={styles.sectionSub}>
            Ideal for Sinhala entries when voice transcription needs help.
          </Text>

          <TextInput
            value={manualText}
            onChangeText={setManualText}
            placeholder={
              language === "si"
                ? "සිංහල text එක මෙතන type කරන්න..."
                : "Type your text here..."
            }
            multiline
            style={styles.textBox}
            placeholderTextColor="#8A6A52"
          />

          <Pressable style={styles.secondaryBtn} onPress={analyzeManualText}>
            <Ionicons name="document-text-outline" size={18} color="white" />
            <Text style={styles.primaryBtnText}>Analyze Typed Text</Text>
          </Pressable>
        </View>

        {result && (
          <>
            <View style={styles.moodCard}>
              <View style={styles.moodHeader}>
                <View style={[styles.moodIconWrap, { backgroundColor: `${moodMeta.color}22` }]}>
                  <MaterialCommunityIcons
                    name={moodMeta.icon}
                    size={28}
                    color={moodMeta.color}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.moodTitle}>Detected Mood</Text>
                  <Text style={styles.moodLabel}>{moodMeta.label}</Text>
                </View>

                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>{result.confidence}</Text>
                </View>
              </View>

              <Text style={styles.resultSectionTitle}>Original Transcript</Text>
              <Text style={styles.resultText}>{result.original_transcript}</Text>

              <Text style={styles.resultSectionTitle}>Correct Transcript</Text>
              <TextInput
                value={correctedText}
                onChangeText={setCorrectedText}
                multiline
                style={styles.correctBox}
                placeholder="Correct the transcript here..."
                placeholderTextColor="#8A6A52"
              />

              <Pressable style={styles.correctBtn} onPress={analyzeCorrectedText}>
                <Ionicons name="create-outline" size={18} color="white" />
                <Text style={styles.primaryBtnText}>Analyze Corrected Text</Text>
              </Pressable>

              <Text style={styles.resultSectionTitle}>English Analysis Text</Text>
              <Text style={styles.resultText}>{result.translated_transcript}</Text>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.recommendHeader}>
                <Text style={styles.sectionTitle}>
                  Recommendations ({showSinhalaRecommendations ? "Sinhala" : "English"})
                </Text>

                <Pressable
                  style={styles.translateChip}
                  onPress={() => setShowSinhalaRecommendations((prev) => !prev)}
                >
                  <Ionicons name="language-outline" size={14} color="#E67E0D" />
                  <Text style={styles.translateChipText}>
                    {showSinhalaRecommendations ? "Show English" : "Sinhala"}
                  </Text>
                </Pressable>
              </View>

              {(showSinhalaRecommendations
                ? result.recommendations_si
                : result.recommendations_en
              )?.map((r: string, i: number) => (
                <View key={i} style={styles.recommendRow}>
                  <View style={styles.recommendDot} />
                  <Text style={styles.recommendText}>{r}</Text>
                </View>
              ))}

              {result.saved && (
                <View style={styles.savedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                  <Text style={styles.savedBadgeText}>Saved successfully</Text>
                </View>
              )}
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Recent Entries</Text>


        <View style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <Ionicons name="bulb" size={18} color="#E67E0D" />
          </View>
          <Text style={styles.tipText}>
            Tip: Speak clearly for 5–10 seconds or type/correct Sinhala text manually.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF6ED" },

  header: {
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerGreeting: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    marginBottom: 4,
  },
  headerTitle: {
    color: "white",
    fontSize: 30,
    fontWeight: "800",
  },
  headerSub: {
    marginTop: 12,
    color: "rgba(255,255,255,0.92)",
    fontSize: 15,
    lineHeight: 22,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  headerBadgeText: {
    color: "white",
    fontWeight: "700",
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  heroCard: {
    backgroundColor: "#FFE7D1",
    borderRadius: 28,
    padding: 18,
    marginTop: -20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#4A2A18",
  },
  heroSub: {
    marginTop: 8,
    color: "#6B4A35",
    lineHeight: 21,
  },

  timerPill: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.65)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  timerText: {
    color: "#7C4A16",
    fontWeight: "800",
  },

  waveRow: {
    height: 70,
    borderRadius: 22,
    paddingHorizontal: 8,
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 18,
  },
  waveBar: {
    width: 7,
    borderRadius: 7,
    backgroundColor: "rgba(243,154,31,0.30)",
  },
  waveActive: {
    backgroundColor: "rgba(230,126,13,0.65)",
  },

  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  sideBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(255,255,255,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  micOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  micOuterActive: {
    transform: [{ scale: 1.04 }],
  },
  micInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  langRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 14,
  },
  langPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  langPillActive: {
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  langText: {
    color: "#6B4A35",
    fontWeight: "800",
  },
  langTextActive: {
    color: "#4A2A18",
  },

  primaryBtn: {
    marginTop: 14,
    backgroundColor: "#E67E0D",
    borderRadius: 18,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  secondaryBtn: {
    marginTop: 12,
    backgroundColor: "#F39A1F",
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryBtnText: {
    color: "white",
    fontWeight: "800",
  },

  status: {
    marginTop: 10,
    color: "#4A2A18",
    fontWeight: "700",
    textAlign: "center",
  },

  sectionCard: {
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 24,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#4A2A18",
  },
  sectionSub: {
    color: "#6B4A35",
    marginTop: 5,
    marginBottom: 10,
    lineHeight: 20,
  },

  textBox: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 14,
    minHeight: 120,
    textAlignVertical: "top",
    color: "#3B2316",
  },

  moodCard: {
    marginTop: 16,
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 16,
  },
  moodHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  moodIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  moodTitle: {
    color: "#7C4A16",
    fontSize: 13,
    fontWeight: "700",
  },
  moodLabel: {
    fontSize: 22,
    fontWeight: "800",
    color: "#4A2A18",
  },
  confidenceBadge: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FED7AA",
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  confidenceText: {
    color: "#C2410C",
    fontWeight: "800",
  },

  resultSectionTitle: {
    marginTop: 14,
    fontWeight: "900",
    color: "#4A2A18",
  },
  resultText: {
    color: "#3B2316",
    marginTop: 5,
    lineHeight: 21,
  },

  correctBox: {
    marginTop: 8,
    backgroundColor: "#FFF7ED",
    borderRadius: 16,
    padding: 14,
    minHeight: 100,
    textAlignVertical: "top",
    color: "#3B2316",
  },
  correctBtn: {
    marginTop: 12,
    backgroundColor: "#D96A07",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    alignSelf: "flex-start",
  },

  recommendHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  translateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  translateChipText: {
    color: "#E67E0D",
    fontWeight: "700",
    fontSize: 12,
  },
  recommendRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 12,
  },
  recommendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F39A1F",
    marginTop: 7,
  },
  recommendText: {
    flex: 1,
    color: "#3B2316",
    lineHeight: 21,
  },
  savedBadge: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  savedBadgeText: {
    color: "#15803D",
    fontWeight: "700",
  },

  clipRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  playCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F39A1F",
    alignItems: "center",
    justifyContent: "center",
  },
  clipTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3B2316",
  },
  clipMeta: {
    marginTop: 4,
    color: "#8A6A52",
  },
  moodTag: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  moodTagText: {
    textTransform: "capitalize",
    fontWeight: "700",
    color: "#4A2A18",
    fontSize: 12,
  },

  tipCard: {
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 22,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tipIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(243,154,31,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  tipText: {
    color: "#6B4A35",
    fontWeight: "700",
    flex: 1,
    lineHeight: 20,
  },
});