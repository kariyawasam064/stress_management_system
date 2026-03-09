const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const FLASK_URL = process.env.FLASK_URL || "http://127.0.0.1:5001";
const PORT = process.env.PORT || 3000;

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const DATA_DIR = path.join(__dirname, "data");
const TEMP_DIR = path.join(__dirname, "uploads", "temp");
const VOICE_DIR = path.join(__dirname, "uploads", "voice");
const DB_FILE = path.join(DATA_DIR, "entries.json");

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(TEMP_DIR, { recursive: true });
fs.mkdirSync(VOICE_DIR, { recursive: true });

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), "utf-8");
}

const upload = multer({ dest: TEMP_DIR });

function loadEntries() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  fs.writeFileSync(DB_FILE, JSON.stringify(entries, null, 2), "utf-8");
}

function addEntry(entry) {
  const entries = loadEntries();
  entries.push(entry);
  saveEntries(entries);
  return entry;
}

function nowIso() {
  return new Date().toISOString();
}

function dateOnly(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}

function monthOnly(iso) {
  return new Date(iso).toISOString().slice(0, 7);
}

function containsSinhala(text = "") {
  return /[\u0D80-\u0DFF]/.test(text);
}

function getDisplayText(result, fallbackText = "") {
  const translated = (result?.translated_transcript || "").trim();
  const original = (result?.original_transcript || fallbackText || "").trim();

  if (translated && !containsSinhala(translated)) {
    return translated;
  }

  if (original && !containsSinhala(original)) {
    return original;
  }

  return "Transcript unavailable - please use corrected or typed text.";
}

async function generateAIRecommendations(text, emotion, language = "en") {
  try {

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp"
    });

    const lang = language === "si" ? "Sinhala" : "English";

    const prompt = `
You are helping a student mental health journaling app.

Emotion: ${emotion}

Journal entry:
${text}

Generate 3 supportive recommendations.

Rules:
- Keep them short
- No medical advice
- Practical actions
- Output language: ${lang}

Return JSON only:

{
"recommendations": ["...", "...", "..."]
}
`;

    const result = await model.generateContent(prompt);

    const response = result.response.text();

    const match = response.match(/\{[\s\S]*\}/);

    if (!match) return null;

    const parsed = JSON.parse(match[0]);

    return parsed.recommendations;

  } catch (err) {
    console.log("GEMINI ERROR:", err);
    return null;
  }
}

function fallbackRecommendations(emotion, text = "") {
  const t = (text || "").toLowerCase();

  if (
    t.includes("exam") ||
    t.includes("deadline") ||
    t.includes("assignment") ||
    t.includes("study") ||
    t.includes("project")
  ) {
    return [
      "Break your work into one small task you can finish next.",
      "Study for 25 minutes, then take a 5 minute break.",
      "Write down the top 3 priorities for today."
    ];
  }

  if (
    t.includes("lonely") ||
    t.includes("alone") ||
    t.includes("nobody") ||
    t.includes("understands")
  ) {
    return [
      "Send a short message to one person you trust.",
      "Write what you wish someone would understand about you.",
      "Do one comforting activity before the day ends."
    ];
  }

  if (
    t.includes("stress") ||
    t.includes("stressed") ||
    t.includes("pressure") ||
    t.includes("anxious") ||
    t.includes("worried")
  ) {
    return [
      "Pause and take 5 slow breaths before continuing.",
      "Write down what is worrying you most right now.",
      "Focus on one small action instead of the whole problem."
    ];
  }

  if (
    t.includes("happy") ||
    t.includes("great") ||
    t.includes("good") ||
    t.includes("success") ||
    t.includes("finished")
  ) {
    return [
      "Write down what helped this good moment happen.",
      "Celebrate one small win from today.",
      "Carry this positive energy into one goal for tomorrow."
    ];
  }

  if (emotion === "sad") {
    return [
      "Try slow breathing for 2 minutes.",
      "Write one small action you can do next.",
      "Talk to someone you trust.",
    ];
  }

  if (emotion === "happy") {
    return [
      "Note what went well today.",
      "Share your success with someone.",
      "Set a small goal for tomorrow.",
    ];
  }

  return [
    "Take a moment to reflect on your day.",
    "Write down one thing about your mood.",
    "Do one activity that relaxes you.",
  ];
}

function translateFallbackRecommendationsToSinhala(recs) {
  const mapping = {
    "Try slow breathing for 2 minutes.":
      "මිනිත්තු 2ක් හුස්ම පාලනය කරන්න.",
    "Write one small action you can do next.":
      "ඊළඟට කරන්න පුළුවන් පොඩි ක්‍රියාවක් ලියන්න.",
    "Talk to someone you trust.":
      "ඔබ විශ්වාස කරන කෙනෙකු සමඟ කතා කරන්න.",
    "Note what went well today.":
      "අද හොඳට ගිය දේ ලියාගන්න.",
    "Share your success with someone.":
      "ඔබගේ සාර්ථකත්වය බෙදාගන්න.",
    "Set a small goal for tomorrow.":
      "හෙටට පොඩි ඉලක්කයක් තබාගන්න.",
    "Take a moment to reflect on your day.":
      "ඔබගේ දවස ගැන සිතා බලන්න.",
    "Write down one thing about your mood.":
      "ඔබගේ මනෝභාවය ගැන එක දෙයක් ලියන්න.",
    "Do one activity that relaxes you.":
      "ඔබට විවේක දෙන ක්‍රියාවක් කරන්න.",
  };

  return recs.map((r) => mapping[r] || r);
}

async function buildRecommendations(textForAI, emotion) {
  const aiEnglish =
    (await generateAIRecommendations(textForAI, emotion, "en")) ||
    fallbackRecommendations(emotion, textForAI);

  const aiSinhala = translateFallbackRecommendationsToSinhala(aiEnglish);

  return {
    recommendations_en: aiEnglish,
    recommendations_si: aiSinhala,
  };
}

function buildDailyReport(entries, date, userId) {
  const dayEntries = entries.filter(
    (e) => e.userId === userId && dateOnly(e.createdAt) === date
  );

  const total = dayEntries.length;
  const voiceEntries = dayEntries.filter((e) => e.inputType === "voice");
  const textEntries = dayEntries.filter(
    (e) => e.inputType === "text" || e.inputType === "corrected_text"
  );

  const counts = { happy: 0, sad: 0, neutral: 0 };
  for (const e of dayEntries) {
    if (counts[e.emotion_label] !== undefined) counts[e.emotion_label]++;
  }

  let dominantEmotion = "none";
  let maxCount = -1;
  for (const [k, v] of Object.entries(counts)) {
    if (v > maxCount) {
      dominantEmotion = k;
      maxCount = v;
    }
  }

  const percentages =
    total === 0
      ? { happy: 0, sad: 0, neutral: 0 }
      : {
          happy: +(counts.happy / total * 100).toFixed(1),
          sad: +(counts.sad / total * 100).toFixed(1),
          neutral: +(counts.neutral / total * 100).toFixed(1),
        };

  let summary = "No entries recorded for this day.";
  if (total > 0) {
    if (dominantEmotion === "happy") {
      summary =
        "Overall mood appears positive today. Keep reinforcing the activities and situations that supported this mood.";
    } else if (dominantEmotion === "sad") {
      summary =
        "Sad emotions were dominant today. It may help to review stress triggers, take short calming breaks, and reach out for support if needed.";
    } else if (dominantEmotion === "neutral") {
      summary =
        "Your mood today appears mostly neutral. Reflection and light positive activities may help maintain emotional balance.";
    }
  }

  return {
    date,
    userId,
    total_entries: total,
    voice_entries: voiceEntries.length,
    text_entries: textEntries.length,
    emotion_counts: counts,
    emotion_percentages: percentages,
    dominant_emotion: dominantEmotion,
    summary,
    entries: dayEntries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  };
}

function buildMonthlyReport(entries, month, userId) {
  const monthEntries = entries.filter(
    (e) => e.userId === userId && monthOnly(e.createdAt) === month
  );

  const total = monthEntries.length;
  const voiceEntries = monthEntries.filter((e) => e.inputType === "voice");
  const textEntries = monthEntries.filter(
    (e) => e.inputType === "text" || e.inputType === "corrected_text"
  );

  const counts = { happy: 0, sad: 0, neutral: 0 };
  for (const e of monthEntries) {
    if (counts[e.emotion_label] !== undefined) counts[e.emotion_label]++;
  }

  let dominantEmotion = "none";
  let maxCount = -1;
  for (const [k, v] of Object.entries(counts)) {
    if (v > maxCount) {
      dominantEmotion = k;
      maxCount = v;
    }
  }

  const percentages =
    total === 0
      ? { happy: 0, sad: 0, neutral: 0 }
      : {
          happy: +(counts.happy / total * 100).toFixed(1),
          sad: +(counts.sad / total * 100).toFixed(1),
          neutral: +(counts.neutral / total * 100).toFixed(1),
        };

  const groupedByDay = {};
  for (const e of monthEntries) {
    const d = dateOnly(e.createdAt);

    if (!groupedByDay[d]) {
      groupedByDay[d] = {
        date: d,
        happy: 0,
        sad: 0,
        neutral: 0,
        total: 0,
      };
    }

    if (groupedByDay[d][e.emotion_label] !== undefined) {
      groupedByDay[d][e.emotion_label]++;
    }
    groupedByDay[d].total++;
  }

  const daily_breakdown = Object.values(groupedByDay).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  let summary = "No entries recorded for this month.";
  if (total > 0) {
    if (dominantEmotion === "happy") {
      summary =
        "This month shows a mostly positive emotional pattern. Keep engaging in activities that support your wellbeing.";
    } else if (dominantEmotion === "sad") {
      summary =
        "This month shows more sad emotional patterns. It may help to review recurring stressors and build regular emotional support habits.";
    } else if (dominantEmotion === "neutral") {
      summary =
        "This month appears mostly emotionally balanced. Gentle reflection and positive routines may help maintain stability.";
    }
  }

  return {
    month,
    userId,
    total_entries: total,
    voice_entries: voiceEntries.length,
    text_entries: textEntries.length,
    emotion_counts: counts,
    emotion_percentages: percentages,
    dominant_emotion: dominantEmotion,
    summary,
    daily_breakdown,
    entries: monthEntries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  };
}

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "backend" });
});

// ==============================
// VOICE ANALYSIS + SAVE
// ==============================
app.post("/api/analyze", upload.single("audio"), async (req, res) => {
  try {
    const language = (req.body.language || "en").toLowerCase();
    const userId = req.body.userId || "demo-user";

    if (!req.file) {
      return res.status(400).json({ error: "audio missing" });
    }

    const ext = path.extname(req.file.originalname || "") || ".m4a";
    const savedVoiceName = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    const savedVoicePath = path.join(VOICE_DIR, savedVoiceName);

    fs.copyFileSync(req.file.path, savedVoicePath);

    const form = new FormData();
    form.append("language", language);
    form.append("audio", fs.createReadStream(req.file.path), req.file.originalname);

    const response = await axios.post(`${FLASK_URL}/analyze`, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 120000,
    });

    const result = response.data;

    const aiRecs = await buildRecommendations(
      result.translated_transcript || result.original_transcript || "",
      result.emotion_label || "neutral"
    );

    const entry = {
      id: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      inputType: "voice",
      language,
      original_transcript: result.original_transcript || "",
      translated_transcript: result.translated_transcript || "",
      display_text: getDisplayText(result),
      emotion_label: result.emotion_label || "neutral",
      confidence: result.confidence || 0,
      recommendations_en: aiRecs.recommendations_en,
      recommendations_si: aiRecs.recommendations_si,
      voice_file: `uploads/voice/${savedVoiceName}`,
      createdAt: nowIso(),
    };

    addEntry(entry);

    fs.unlink(req.file.path, () => {});

    res.json({
      ...result,
      recommendations_en: aiRecs.recommendations_en,
      recommendations_si: aiRecs.recommendations_si,
      entryId: entry.id,
      saved: true,
    });
  } catch (error) {
    console.error("AUDIO ANALYZE ERROR:", error.response?.data || error.message);
    res.status(500).json({
      error: "backend->ml analyze failed",
      details: error.response?.data || error.message,
    });
  }
});

// ==============================
// TYPED TEXT ANALYSIS + SAVE
// ==============================
app.post("/api/analyze-text", async (req, res) => {
  try {
    const { text, language = "si", userId = "demo-user" } = req.body;

    const response = await axios.post(
      `${FLASK_URL}/analyze-text`,
      { text, language },
      { timeout: 120000 }
    );

    const result = response.data;

    const aiRecs = await buildRecommendations(
      result.translated_transcript || result.original_transcript || text || "",
      result.emotion_label || "neutral"
    );

    const entry = {
      id: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      inputType: "text",
      language,
      original_transcript: result.original_transcript || text || "",
      translated_transcript: result.translated_transcript || "",
      display_text: getDisplayText(result, text),
      emotion_label: result.emotion_label || "neutral",
      confidence: result.confidence || 0,
      recommendations_en: aiRecs.recommendations_en,
      recommendations_si: aiRecs.recommendations_si,
      voice_file: null,
      createdAt: nowIso(),
    };

    addEntry(entry);

    res.json({
      ...result,
      recommendations_en: aiRecs.recommendations_en,
      recommendations_si: aiRecs.recommendations_si,
      entryId: entry.id,
      saved: true,
    });
  } catch (error) {
    console.error("TEXT ANALYZE ERROR:", error.response?.data || error.message);
    res.status(500).json({
      error: "backend->ml analyze-text failed",
      details: error.response?.data || error.message,
    });
  }
});

// ==============================
// CORRECTED TEXT ANALYSIS + SAVE
// ==============================
app.post("/api/analyze-corrected", async (req, res) => {
  try {
    const { corrected_text, language = "si", userId = "demo-user" } = req.body;

    const response = await axios.post(
      `${FLASK_URL}/analyze-corrected`,
      { corrected_text, language },
      { timeout: 120000 }
    );

    const result = response.data;

    const aiRecs = await buildRecommendations(
      result.translated_transcript || result.original_transcript || corrected_text || "",
      result.emotion_label || "neutral"
    );

    const entry = {
      id: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      inputType: "corrected_text",
      language,
      original_transcript: result.original_transcript || corrected_text || "",
      translated_transcript: result.translated_transcript || "",
      display_text: getDisplayText(result, corrected_text),
      emotion_label: result.emotion_label || "neutral",
      confidence: result.confidence || 0,
      recommendations_en: aiRecs.recommendations_en,
      recommendations_si: aiRecs.recommendations_si,
      voice_file: null,
      createdAt: nowIso(),
    };

    addEntry(entry);

    res.json({
      ...result,
      recommendations_en: aiRecs.recommendations_en,
      recommendations_si: aiRecs.recommendations_si,
      entryId: entry.id,
      saved: true,
    });
  } catch (error) {
    console.error("CORRECTED ANALYZE ERROR:", error.response?.data || error.message);
    res.status(500).json({
      error: "backend->ml analyze-corrected failed",
      details: error.response?.data || error.message,
    });
  }
});

// ==============================
// GET ALL ENTRIES
// ==============================
app.get("/api/entries", (req, res) => {
  try {
    const { userId = "demo-user", type, date, month } = req.query;

    let entries = loadEntries().filter((e) => e.userId === userId);

    if (type) entries = entries.filter((e) => e.inputType === type);
    if (date) entries = entries.filter((e) => dateOnly(e.createdAt) === date);
    if (month) entries = entries.filter((e) => monthOnly(e.createdAt) === month);

    entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==============================
// DAILY REPORT
// ==============================
app.get("/api/reports/daily", (req, res) => {
  try {
    const userId = req.query.userId || "demo-user";
    const date = req.query.date || new Date().toISOString().slice(0, 10);

    const report = buildDailyReport(loadEntries(), date, userId);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==============================
// MONTHLY REPORT
// ==============================
app.get("/api/reports/monthly", (req, res) => {
  try {
    const userId = req.query.userId || "demo-user";
    const month = req.query.month || new Date().toISOString().slice(0, 7);

    const report = buildMonthlyReport(loadEntries(), month, userId);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on http://0.0.0.0:${PORT}`);
});