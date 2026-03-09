import os
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS
from faster_whisper import WhisperModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

app = Flask(__name__)
CORS(app)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# =========================
# ASR MODEL
# =========================
asr_model = WhisperModel("small", device="cpu", compute_type="int8")

# =========================
# EMOTION MODEL
# =========================
MODEL_PATH = os.path.join("models", "fixmind_emotion_model")

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
emotion_model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_PATH,
    low_cpu_mem_usage=True
)

emotion_labels = ["happy", "sad", "neutral"]


# =========================
# TEXT CLEANING
# =========================
def clean_text(text):
    if not text:
        return ""
    return " ".join(text.split()).strip()


# =========================
# EMOTION DETECTION
# =========================
def detect_emotion(text):
    text = clean_text(text)

    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=64
    )

    with torch.no_grad():
        outputs = emotion_model(**inputs)

    probs = torch.nn.functional.softmax(outputs.logits, dim=1)
    predicted_index = torch.argmax(probs, dim=1).item()
    confidence = probs[0][predicted_index].item()

    return emotion_labels[predicted_index], confidence


# =========================
# RULE BASED EMOTION FIX
# =========================
def rule_based_emotion_fix(text, current):
    t = text.lower()

    happy_keywords = [
        "සතුටු", "හොඳ", "විනෝද", "සාර්ථක", "සැනසීම", "සතුටින්",
        "happy", "great", "good", "joy", "wonderful", "relaxed", "calm"
    ]

    sad_keywords = [
        "දුක", "හිත අමාරු", "බරයි", "පීඩනය", "කලබල", "අමාරුයි",
        "sad", "lonely", "stress", "stressed", "anxious", "worried"
    ]

    for w in happy_keywords:
        if w in t:
            return "happy"

    for w in sad_keywords:
        if w in t:
            return "sad"

    return current


# =========================
# SIMPLE SINHALA → ENGLISH
# =========================
def translate_si_to_en(text):
    text = clean_text(text)

    mapping = {
        "අද මට ගොඩක් සතුටුයි": "Today I feel very happy",
        "මගේ දවස හොඳට ගියා": "My day went well",
        "මම අද සැනසීමෙන් ඉන්නවා": "I feel calm today",
        "අද මට හිත අමාරුයි": "Today I feel mentally uncomfortable",
        "මට පීඩනයක් දැනෙනවා": "I feel stressed",
        "අද මට දුකයි": "Today I feel sad",
        "අද මට හොඳයි": "Today I feel good",
        "මගේ හිත බරයි": "My heart feels heavy",
        "අද මට කලබලයි": "Today I feel anxious",
        "අද මට පීඩනය වැඩියි": "I feel a lot of pressure today"
    }

    for si, en in mapping.items():
        if si in text:
            text = text.replace(si, en)

    return clean_text(text)


# =========================
# RECOMMENDATIONS
# =========================
def get_recommendations(emotion):
    if emotion == "sad":
        return [
            "Try slow breathing for 2 minutes.",
            "Write one small action you can do next.",
            "Talk to someone you trust."
        ]

    if emotion == "happy":
        return [
            "Note what went well today.",
            "Share your success with someone.",
            "Set a small goal for tomorrow."
        ]

    return [
        "Take a moment to reflect on your day.",
        "Write down one thing about your mood.",
        "Do one activity that relaxes you."
    ]


def translate_recommendations_to_si(recs):
    mapping = {
        "Try slow breathing for 2 minutes.": "මිනිත්තු 2ක් හුස්ම පාලනය කරන්න.",
        "Write one small action you can do next.": "ඊළඟට කරන්න පුළුවන් පොඩි ක්‍රියාවක් ලියන්න.",
        "Talk to someone you trust.": "ඔබ විශ්වාස කරන කෙනෙකු සමඟ කතා කරන්න.",
        "Note what went well today.": "අද හොඳට ගිය දේ ලියාගන්න.",
        "Share your success with someone.": "ඔබගේ සාර්ථකත්වය බෙදාගන්න.",
        "Set a small goal for tomorrow.": "හෙටට පොඩි ඉලක්කයක් තබාගන්න.",
        "Take a moment to reflect on your day.": "ඔබගේ දවස ගැන සිතා බලන්න.",
        "Write down one thing about your mood.": "ඔබගේ මනෝභාවය ගැන එක දෙයක් ලියන්න.",
        "Do one activity that relaxes you.": "ඔබට විවේක දෙන ක්‍රියාවක් කරන්න."
    }

    return [mapping.get(r, r) for r in recs]


# =========================
# COMMON RESPONSE BUILDER
# =========================
def build_analysis_response(original_text, language):
    original_text = clean_text(original_text)

    if language == "si":
        translated = translate_si_to_en(original_text)
    else:
        translated = original_text

    translated = clean_text(translated)

    emotion, confidence = detect_emotion(translated)
    emotion = rule_based_emotion_fix(translated, emotion)

    recs_en = get_recommendations(emotion)
    recs_si = translate_recommendations_to_si(recs_en)

    return {
        "original_transcript": original_text,
        "translated_transcript": translated,
        "emotion_label": emotion,
        "confidence": round(float(confidence), 3),
        "recommendations_en": recs_en,
        "recommendations_si": recs_si
    }


# =========================
# HEALTH CHECK
# =========================
@app.get("/health")
def health():
    return jsonify({"status": "ok"})


# =========================
# AUDIO ANALYSIS
# =========================
@app.post("/analyze")
def analyze():
    if "audio" not in request.files:
        return jsonify({"error": "audio missing"}), 400

    language = request.form.get("language", "en").lower()
    audio_file = request.files["audio"]

    filename = f"{uuid.uuid4().hex}.wav"
    path = os.path.join(UPLOAD_DIR, filename)
    audio_file.save(path)

    try:
        segments, info = asr_model.transcribe(
            path,
            language="si" if language == "si" else "en",
            beam_size=5,
            vad_filter=True,
            condition_on_previous_text=False,
            temperature=0.0
        )

        transcript = " ".join([s.text for s in segments]).strip()
        transcript = clean_text(transcript)

        print("LANGUAGE SELECTED:", language)
        print("LANGUAGE DETECTED:", info.language)
        print("TRANSCRIPT:", transcript)

        if not transcript:
            return jsonify({"error": "transcript empty"}), 400

        response = build_analysis_response(transcript, language)
        response["language_detected"] = info.language
        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if os.path.exists(path):
            try:
                os.remove(path)
            except Exception:
                pass


# =========================
# TEXT ANALYSIS
# =========================
@app.post("/analyze-text")
def analyze_text():
    try:
        data = request.json or {}

        text = clean_text(data.get("text", ""))
        language = data.get("language", "si").lower()

        if not text:
            return jsonify({"error": "text missing"}), 400

        response = build_analysis_response(text, language)
        response["language_detected"] = language
        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================
# CORRECTED TRANSCRIPT ANALYSIS
# =========================
@app.post("/analyze-corrected")
def analyze_corrected():
    try:
        data = request.json or {}

        corrected_text = clean_text(data.get("corrected_text", ""))
        language = data.get("language", "si").lower()

        if not corrected_text:
            return jsonify({"error": "corrected_text missing"}), 400

        response = build_analysis_response(corrected_text, language)
        response["language_detected"] = language
        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False, use_reloader=False)