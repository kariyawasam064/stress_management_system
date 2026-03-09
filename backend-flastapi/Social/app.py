# app.py
from flask import Flask, request, jsonify, send_file
import joblib
import numpy as np
import cv2
import tensorflow as tf
import urllib.request
import os
from flask_cors import CORS
from social_recommender import social_recommender  # Import your recommender class
from deep_translator import GoogleTranslator
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import pandas as pd
from report_service import get_monthly_report, create_excel, get_monthly_report2, create_excel2

app = Flask(__name__)
CORS(app)  
artifact = joblib.load('stress_classifier.joblib')
clf = artifact['model']
scaler = artifact['scaler']
le = artifact['label_encoder']

# ------------------------------
# Load Emotion Model (Mini Xception)
# ------------------------------
MODEL_URL = "https://github.com/oarriaga/face_classification/raw/master/trained_models/emotion_models/fer2013_mini_XCEPTION.102-0.66.hdf5"
MODEL_PATH = "emotion_model.h5"

if not os.path.exists(MODEL_PATH):
    print("Downloading emotion model...")
    urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)

model = tf.keras.models.load_model(MODEL_PATH, compile=False)

# ------------------------------
# Load Haarcascade for Face Detection
# ------------------------------
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

emotion_labels = ['Angry','Disgust','Fear','Happy','Sad','Surprise','Neutral']


# map mood names to ints (must match training)
mood_map = {'happy':0,'neutral':1,'sad':2,'angry':3,'surprised':4}


# ------------------------------
# API Endpoint
# ------------------------------
@app.route("/face_predict", methods=["POST"])
def predict_face():
    try:
        # Read uploaded file
        file = request.files["file"]
        img_bytes = np.frombuffer(file.read(), np.uint8)

        # Decode
        img = cv2.imdecode(img_bytes, cv2.IMREAD_COLOR)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Detect faces
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)

        if len(faces) == 0:
            return jsonify({"error": "No face detected"}), 400

        # Use first detected face
        x, y, w, h = faces[0]
        face = gray[y:y + h, x:x + w]

        # Preprocess for model
        face = cv2.resize(face, (64, 64))
        face = face.astype("float") / 255.0
        face = np.expand_dims(face, axis=0)
        face = np.expand_dims(face, axis=-1)

        prediction = model.predict(face)
        emotion_index = np.argmax(prediction)
        emotion = emotion_labels[emotion_index]
        confidence = float(np.max(prediction))

        return jsonify({
            "emotion": emotion,
            "confidence": confidence
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/predict', methods=['POST'])
def predict():
    """
    Expects JSON:
    {
      "face_mood": "happy",
      "messages_sent": 12,
      "messages_received": 13,
      "calls_incoming": 0,
      "calls_outgoing": 1,
      "sleep_hours": 7.5
    }
    """
    data = request.json
    try:
        fm = data.get('face_mood')
        face_mood_i = mood_map.get(fm, 1)  # default neutral if unknown
        feat = np.array([[face_mood_i,
                          float(data.get('messages_sent',0)),
                          float(data.get('messages_received',0)),
                          float(data.get('calls_incoming',0)),
                          float(data.get('calls_outgoing',0)),
                          float(data.get('sleep_hours',7))]])
        feat_s = scaler.transform(feat)
        pred_idx = clf.predict(feat_s)[0]
        pred_label = le.inverse_transform([pred_idx])[0]
        probs = clf.predict_proba(feat_s).tolist()[0]
        return jsonify({
            'predicted_label': pred_label,
            'probabilities': dict(zip(le.classes_, probs))
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# def translate_text(text):
#     translator = GoogleTranslator(source='en', target='si')
#     return translator.translate(text)

MAX_TRANSLATE_LENGTH = 5000
translator = GoogleTranslator(source='en', target='si')

def translate_text(text):
    if len(text) > MAX_TRANSLATE_LENGTH:
        text = text[:MAX_TRANSLATE_LENGTH]  # truncate to 5000 chars
    return translator.translate(text)

@app.route("/social/ai", methods=['POST'])
def social_recommender_class():
    # Fetch the image and additional data
    data = request.json
    pest_name = data.get('stress_level')
    # Create an instance of your recommender class
    recommender_instance = social_recommender()

    # Get recommendations
    recommendations = recommender_instance.getRecommendations(pest_name)
    trans = translate_text(recommendations)


    # Return the results
    response = {
        'recommendations': recommendations,
        'trans':trans
    }

    return jsonify(response)

# -------------------------
# API route
# -------------------------
@app.route("/generate-report", methods=["GET"])
def generate_report():
    try:
        # Get query params
        month = int(request.args.get("month"))
        year = int(request.args.get("year"))
        fmt = request.args.get("format", "excel")  # excel or pdf (currently only excel)

        # Generate report data
        report_data = get_monthly_report(month, year)
        if not report_data:
            return jsonify({"error": "No data found for this month"}), 404

        # Save Excel
        file_path = f"stress_report_{year}_{month}.xlsx"
        df = pd.DataFrame(report_data)
        df.to_excel(file_path, index=False)

        # Return file
        return send_file(file_path, as_attachment=True)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/report")
def greport():

    month = int(request.args.get("month"))
    year = int(request.args.get("year"))

    result = get_monthly_report2(month, year)

    if not result:
        return {"error":"No data found for this month"},404

    df, summary = result

    file_path = create_excel2(df, summary)

    return send_file(file_path, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
