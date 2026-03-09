from flask import Flask, request, jsonify
import math
import traceback
from joblib import load
from collections import defaultdict
from feature_prep import prepare_features_for_subjects
from scheduler import create_schedule_with_caps
from flask_cors import CORS
from pymongo import MongoClient
import pdfplumber
import os
from werkzeug.utils import secure_filename
import re
from bson import ObjectId
import random

# -------------------------
# Load ML Model
# -------------------------
MODEL_PATH = "rf_hours_model.joblib"
ml_model = load(MODEL_PATH)

# Study settings
SESSION_MINUTES = 30   # 1-hour sessions

# -------------------------
# Flask App
# -------------------------
app = Flask(__name__)
CORS(app)  

# -------------------------
# MongoDB connection
# -------------------------
MONGO_URI = "mongodb+srv://sajindu:saji1234@cluster0.bx77a.mongodb.net"  # replace with your Mongo URI
DB_NAME = "stress"
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
lectures_collection = db["lectures"]
saved_table = db["savedtimetables"]  # This is the table/collection to save timetables


# @app.route("/generate_timetable", methods=["POST"])
# def generate_timetable():
#     try:
#         payload = request.get_json()
#         if not payload:
#             return jsonify({"error": "Invalid JSON"}), 400

#         print(payload.get("year"))
#         # Extract values
#         year = payload.get("year")
#         month = payload.get("month")
#         study_hours_per_day = float(payload.get("study_hours_per_day", 2))
#         preferred_window = payload.get("preferred_window", "evening")
#         subjects = payload.get("subjects", [])
#         unavailable = payload.get("unavailable", [])

#         if not subjects:
#             return jsonify({"error": "No subjects provided"}), 400

#         # -------------------------
#         # 1) ML PREDICTION
#         # -------------------------
#         per_subject_sessions = predict_hours_and_sessions(ml_model, subjects)

#         # -------------------------
#         # 2) SCHEDULE GENERATION
#         # -------------------------
    
#         WINDOWS = {
#             "morning": (6, 12),
#             "afternoon": (12, 18),
#             "evening": (18, 22),
#             "flexible": (6, 22)
#         }

#         # In your /generate_timetable route:
#         window_start, window_end = WINDOWS.get(preferred_window.lower(), (18, 22))

#         schedule = create_schedule_with_caps(
#             subjects=subjects,
#             unavailable=unavailable,
#             year=year,
#             month=month,
#             study_hours_per_day=study_hours_per_day,
#             per_subject_max_sessions=per_subject_sessions,
#             window_start=window_start,
#             window_end=window_end
#         )

#         print(schedule)


#         return jsonify({
#             "per_subject_sessions": per_subject_sessions,
#             "schedule": schedule
#         })


#     except Exception as e:
#         traceback.print_exc()
#         return jsonify({"error": str(e)}), 500
# @app.route("/generate_timetables", methods=["POST"])
# def generate_timetables():
#     try:
#         payload = request.get_json()
#         if not payload:
#             return jsonify({"error": "Invalid JSON"}), 400

#         year = payload.get("year")
#         month = payload.get("month")
#         study_hours_per_day = float(payload.get("study_hours_per_day", 2))
#         preferred_window = payload.get("preferred_window", "evening")
#         subjects = payload.get("subjects", [])
#         unavailable = payload.get("unavailable", [])
#         owner_email = payload.get("owner_email")

#         if not subjects:
#             return jsonify({"error": "No subjects provided"}), 400

#         # -------------------------
#         # 1) ML prediction
#         # -------------------------
#         per_subject_sessions = predict_hours_and_sessions(ml_model, subjects)

#         # -------------------------
#         # 2) Schedule generation
#         # -------------------------
#         WINDOWS = {
#             "morning": (6, 12),
#             "afternoon": (12, 18),
#             "evening": (18, 22),
#             "flexible": (6, 22)
#         }
#         window_start, window_end = WINDOWS.get(preferred_window.lower(), (18, 22))

#         timetables = []
#         for i in range(1, 4):
#             schedule = create_schedule_with_caps(
#                 subjects=subjects,
#                 unavailable=unavailable,
#                 year=year,
#                 month=month,
#                 study_hours_per_day=study_hours_per_day,
#                 per_subject_max_sessions=per_subject_sessions,
#                 window_start=window_start,
#                 window_end=window_end
#             )

#             timetable_doc = {
#                 "owner_email": owner_email,
#                 "type": i,  # timetable type 1,2,3
#                 "year": year,
#                 "month": month,
#                 "per_subject_sessions": per_subject_sessions,
#                 "schedule": schedule
#             }

#             # Save in "savedtimetables" collection
#             # If same user & type exists, replace it
#             saved_table.update_one(
#                 {"owner_email": owner_email, "type": i},
#                 {"$set": timetable_doc},
#                 upsert=True
#             )

#             timetables.append(timetable_doc)

#         return jsonify({
#             "message": "3 timetables generated and saved successfully!",
#             "timetables": timetables
#         })

#     except Exception as e:
#         traceback.print_exc()
#         return jsonify({"error": str(e)}), 500



@app.route("/generate_timetables", methods=["POST"])
def generate_timetables():
    try:
        payload = request.get_json()
        if not payload:
            return jsonify({"error": "Invalid JSON"}), 400

        year = payload.get("year")
        month = payload.get("month")
        study_hours_per_day = float(payload.get("study_hours_per_day", 2))
        preferred_window = payload.get("preferred_window", "evening")
        subjects = payload.get("subjects", [])
        unavailable = payload.get("unavailable", [])
        owner_email = payload.get("owner_email")

        saved_table.delete_many({"owner_email": owner_email})

        if not subjects:
            return jsonify({"error": "No subjects provided"}), 400

        # -------------------------
        # 1) ML prediction
        # -------------------------
        per_subject_sessions = predict_hours_and_sessions(ml_model, subjects)

        # -------------------------
        # 2) Schedule generation
        # -------------------------
        WINDOWS = {
            "morning": (6, 12),
            "afternoon": (12, 18),
            "evening": (18, 22),
            "flexible": (6, 22)
        }

        timetables = []

        for i in range(1, 4):
            # Shuffle subjects for variation
            subjects_copy = subjects.copy()
            random.shuffle(subjects_copy)

            # Slightly vary study window for each timetable
            base_window = WINDOWS.get(preferred_window.lower(), (18, 22))
            window_shift = random.randint(-1, 1)  # shift start/end by -1,0,+1 hours
            window_start = max(base_window[0] + window_shift, 6)
            window_end = min(base_window[1] + window_shift, 22)

            # Optional: pass random seed to create_schedule_with_caps if supported
            random_seed = random.randint(0, 9999)

            schedule = create_schedule_with_caps(
                subjects=subjects_copy,
                unavailable=unavailable,
                year=year,
                month=month,
                study_hours_per_day=study_hours_per_day,
                per_subject_max_sessions=per_subject_sessions,
                window_start=window_start,
                window_end=window_end,
               
            )

            # Create timetable document
            timetable_doc = {
                "owner_email": owner_email,
                "type": i,  # timetable type 1,2,3
                "year": year,
                "month": month,
                "per_subject_sessions": per_subject_sessions,
                "schedule": schedule
            }

            # Save timetable in savedtimetables collection
            saved_table.update_one(
                {"owner_email": owner_email, "type": i},
                {"$set": timetable_doc},
                upsert=True
            )

            timetables.append(timetable_doc)

        return jsonify({
            "message": "3 different timetables generated and saved successfully!",
            "timetables": timetables
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    
@app.route("/timetable/get_all/<email>", methods=["GET"])
def get_all_timetables(email):
    try:
        timetables = list(saved_table.find({"owner_email": email}, {"_id": 0}))
        if not timetables:
            return jsonify({"error": "No timetables found"}), 404
        return jsonify({"timetables": timetables})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    
# # -------------------------
# ML Prediction Function
# -------------------------
def predict_hours_and_sessions(model, subjects, session_minutes=SESSION_MINUTES):
    X = prepare_features_for_subjects(subjects)

    if len(X) == 0:
        return {}

    pred_hours = model.predict(X)
    sessions = {}

    for s, h in zip(subjects, pred_hours):
        if "_id" not in s:
            raise Exception("Subject missing _id: " + str(s))

        est_sessions = max(1, int(math.ceil(h / (session_minutes / 60.0))))

        sessions[s["_id"]] = est_sessions

    return sessions

def format_schedule_by_date(schedule):
    formatted = defaultdict(list)
    for item in schedule:
        date = item["date"]
        start = item["start_time"]
        end = item["end_time"]
        subject = item["module_name"]
        lecture = item["lecture_name"]
        priority = item["priority"]
        formatted[date].append(f"  {start} - {end}  | {subject} ({lecture})  priority={priority}")
    
    # Convert to dict with ordered dates
    return {d: formatted[d] for d in sorted(formatted.keys())}

@app.route("/test", methods=["GET"])
def test_api():
    return {"message": "API is working!", "status": "success"}, 200

def serialize_doc(doc):
    """Convert ObjectId to string recursively."""
    if isinstance(doc, list):
        return [serialize_doc(d) for d in doc]
    if isinstance(doc, dict):
        new_doc = {}
        for k, v in doc.items():
            if isinstance(v, ObjectId):
                new_doc[k] = str(v)
            elif isinstance(v, list) or isinstance(v, dict):
                new_doc[k] = serialize_doc(v)
            else:
                new_doc[k] = v
        return new_doc
    return doc


# Folder where uploaded PDFs will be temporarily stored
UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)  # Create folder if it doesn't exist
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


@app.route("/lecture/upload-pdf", methods=["POST"])
def upload_pdf():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file part"}), 400
        
        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(file_path)

        # Get user_email from form
        user_email = request.form.get("user_email")
        if not user_email:
            return jsonify({"error": "No user_email provided"}), 400

        lectures_dict = {}

        # Read PDF
        with pdfplumber.open(file_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                text = page.extract_text()
                if not text:
                    continue
                print(f"--- Page {page_num} ---")
                print(text)

                rows = text.split("\n")
                # Skip headers (first 2 rows)
                for row in rows[2:]:
                    columns = re.split(r"\s+", row.strip())
                    if len(columns) < 6:
                        print("Skipping row (not enough columns):", row)
                        continue

                    try:
                        subject = columns[0]
                        lecturer = " ".join(columns[1:-4])
                        priority = columns[-4]
                        note = columns[-3]
                        module_title = columns[-2]
                        module_link = columns[-1]

                        if subject not in lectures_dict:
                            lectures_dict[subject] = {
                                "module_name": subject,
                                "lecture_name": lecturer,
                                "priority": priority,
                                "user_email":user_email,
                                "description": note,
                                "module": []
                            }

                        lectures_dict[subject]["module"].append({
                            "title": module_title,
                            "link": module_link,
                            "status": "pending"
                        })
                    except Exception as e_row:
                        print(f"Error parsing row: {row}")
                        print(e_row)

        lecture_list = list(lectures_dict.values())

        # Insert into MongoDB
        count = 0
        if lecture_list:
            inserted = lectures_collection.insert_many(lecture_list)
            count = len(inserted.inserted_ids)

        os.remove(file_path)

        return jsonify({
            "message": "PDF processed successfully"
        })

    except Exception as e:
        import traceback
        traceback.print_exc()  # Full error traceback in console
        return jsonify({"error": str(e)}), 500
    
# -------------------------
# Get lectures by email
# -------------------------
@app.route("/lecture/get/<user_email>", methods=["GET"])
def get_lectures(user_email):
    try:
        lectures = list(lectures_collection.find({"user_email": user_email}, {"_id": 0}))
        if not lectures:
            return jsonify({"message": "No lectures found"}), 404
        return jsonify(lectures)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -------------------------
# Bulk insert from JSON
# -------------------------
@app.route("/lecture/bulk", methods=["POST"])
def bulk_insert():
    try:
        data = request.get_json()
        lectures = data.get("lectures", [])
        if not lectures:
            return jsonify({"error": "No lectures provided"}), 400

        lectures_collection.insert_many(lectures)
        return jsonify({"message": "Bulk lectures inserted successfully", "count": len(lectures)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500



if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5003)


# from datetime import datetime, date, time, timedelta
# import calendar
# from collections import defaultdict
# import pulp

# # -------------------------
# # USER CONFIG
# # -------------------------
# YEAR = 2025
# MONTH = 11                      # November 2025 (change as needed)
# SLOT_MINUTES = 15               # fixed for Option B
# SESSION_MINUTES = 30            # each study session length
# BREAK_MINUTES = 15              # break after each session
# # derived:
# SLOTS_PER_SESSION = SESSION_MINUTES // SLOT_MINUTES   # 2
# SLOTS_PER_BREAK = BREAK_MINUTES // SLOT_MINUTES       # 1

# STUDY_HOURS_PER_DAY = 3         # change: available study hours per day (e.g., 3)
# PREFERRED_WINDOW = "evening"    # one of "morning","afternoon","evening","flexible"
# WINDOWS = {
#     "morning": (time(6,0), time(12,0)),
#     "afternoon": (time(12,0), time(18,0)),
#     "evening": (time(18,0), time(23,0)),
#     "flexible": (time(6,0), time(23,0))
# }
# # Optional: cap how many sessions a single subject can have in the month (None for no cap)
# MAX_SESSIONS_PER_SUBJECT = None  # e.g., 30

# # -------------------------
# # SAMPLE INPUT (replace with your real JSON)
# # -------------------------
# subjects = [
#     {
#         "_id":"69102ff28d1a29df4872f553",
#         "module_name":"Test lecture",
#         "lecture_name":"Test session",
#         "priority": 3,
#         "modules": [{"title":"Tshsjsns"},{"title":"Hhhshss"}],
#         "user_email":"Sajindushamalka@gmail.com"
#     },
#     {
#         "_id":"69102ff28d1a29df4872f554",
#         "module_name":"Math",
#         "lecture_name":"Algebra",
#         "priority": 5,
#         "modules":[{"title":"Ch1"}],
#         "user_email":"Sajindushamalka@gmail.com"
#     },
#     {
#         "_id":"69102ff28d1a29df4872f555",
#         "module_name":"History",
#         "lecture_name":"World Wars",
#         "priority": 1,
#         "modules":[{"title":"Ch5"}],
#         "user_email":"Sajindushamalka@gmail.com"
#     }
# ]

# unavailable = [
#     {
#         "_id":"69180b8db9c45807d7aa2a55",
#         "date":"2025-11-06",
#         "reason":"Assignment",
#         "time":"10:41 - 12:41",
#         "email":"sjindushamalka@gmail.com"
#     }
# ]
# # -------------------------

# # Helpers
# def parse_time_range(s):
#     start_s, end_s = s.split('-')
#     start = datetime.strptime(start_s.strip(), "%H:%M").time()
#     end = datetime.strptime(end_s.strip(), "%H:%M").time()
#     return start, end

# def month_first_last(year, month):
#     first = date(year, month, 1)
#     last = date(year, month, calendar.monthrange(year, month)[1])
#     return first, last

# # Build all possible slots (datetime objects for slot starts) in the month within preferred window
# def generate_all_slots(year, month, slot_minutes, window_name):
#     first_day, last_day = month_first_last(year, month)
#     start_time, end_time = WINDOWS.get(window_name, WINDOWS['flexible'])
#     slots = []
#     cur_day = first_day
#     while cur_day <= last_day:
#         cur_dt = datetime.combine(cur_day, start_time)
#         day_end_dt = datetime.combine(cur_day, end_time)
#         while cur_dt < day_end_dt:
#             slots.append(cur_dt)
#             cur_dt += timedelta(minutes=slot_minutes)
#         cur_day += timedelta(days=1)
#     return slots

# # Build set of unavailable slot datetimes (slot starts) from unavailable ranges
# def build_unavailable_slots(unavail_list, slot_minutes, year, month):
#     unavailable_set = set()
#     for item in unavail_list:
#         d = datetime.strptime(item['date'], "%Y-%m-%d").date()
#         if d.year != year or d.month != month:
#             continue
#         start_t, end_t = parse_time_range(item['time'])
#         cur = datetime.combine(d, start_t)
#         end_dt = datetime.combine(d, end_t)
#         while cur < end_dt:
#             unavailable_set.add(cur)
#             cur += timedelta(minutes=slot_minutes)
#     return unavailable_set

# # Determine valid session start indices:
# # A session starting at slot j must have slots [j, j+1] existing, available, same day,
# # and the break slot j+2 (if exists) will be reserved by break rule (enforced separately).
# def valid_session_starts(available_slots):
#     # available_slots: list of datetimes (sorted)
#     idx_by_dt = {dt: idx for idx, dt in enumerate(available_slots)}
#     valid_starts = []
#     for idx, dt in enumerate(available_slots):
#         # need contiguous next slots
#         # check that dt + slot_minutes exists in available_slots
#         next_dt = dt + timedelta(minutes=SLOT_MINUTES)
#         if next_dt in idx_by_dt:
#             # ensure same day
#             if dt.date() == next_dt.date():
#                 valid_starts.append(idx)
#     return valid_starts

# # Main schedule creator
# def create_schedule(subjects, unavailable, year, month,
#                     slot_minutes=SLOT_MINUTES,
#                     study_hours_per_day=STUDY_HOURS_PER_DAY,
#                     window_name=PREFERRED_WINDOW):
#     # 1) generate candidate slots and remove unavailable ones
#     all_slots = generate_all_slots(year, month, slot_minutes, window_name)
#     unavailable_set = build_unavailable_slots(unavailable, slot_minutes, year, month)
#     available_slots = [s for s in all_slots if s not in unavailable_set]

#     if not available_slots:
#         print("No available slots in the selected month/window after removing unavailable times.")
#         return []

#     # mapping and day grouping
#     slot_index = {dt: i for i, dt in enumerate(available_slots)}
#     day_to_slot_idxs = defaultdict(list)
#     for i, dt in enumerate(available_slots):
#         day_to_slot_idxs[dt.date()].append(i)

#     # 2) valid session starts (start index j such that j+1 exists and is same day and available)
#     starts = valid_session_starts(available_slots)   # list of slot indices that can be session starts

#     # 3) Build ILP problem: variables y_{subject, start_idx} = 1 if a session of that subject starts at start_idx
#     prob = pulp.LpProblem("StudySchedule_OptionB", pulp.LpMaximize)

#     y = {}  # (sub_i, start_idx) -> var
#     for i, sub in enumerate(subjects):
#         for j in starts:
#             y[(i,j)] = pulp.LpVariable(f"y_{i}_{j}", cat="Binary")

#     # objective: maximize sum(priority * session_hours * y)
#     session_hours = SESSION_MINUTES / 60.0
#     prob += pulp.lpSum([ subjects[i]['priority'] * session_hours * y[(i,j)]
#                          for (i,j) in y.keys() ])

#     # 4) Constraints
#     # A) No overlapping sessions on the same slot:
#     # For every available slot index k, sum of all sessions that cover k <= 1
#     # A session starting at j covers slots j and j+1 (SLOTS_PER_SESSION slots)
#     total_slots = len(available_slots)
#     for k in range(total_slots):
#         covering_vars = []
#         # find all starts j where session covers k: j <= k <= j + SLOTS_PER_SESSION -1
#         for (i,j) in y.keys():
#             if j <= k <= j + SLOTS_PER_SESSION - 1:
#                 covering_vars.append(y[(i,j)])
#         if covering_vars:
#             prob += pulp.lpSum(covering_vars) <= 1

#     # B) Mandatory break: after a session starting at j (covers j, j+1), slot j+2 (break slot) must be free of a session start that would violate break.
#     # Implemented as: for all starts j where j+2 exists and same day, y_j + sum_all y_{*, j+2} <= 1
#     # This forbids a session starting at j+2 when a session starts at j.
#     for (i,j) in list(y.keys()):
#         break_start = j + SLOTS_PER_SESSION  # index of first break slot; for Option B SLOTS_PER_SESSION==2 so break_start = j+2? careful:
#         # Actually session covers j and j+1 -> break at j+2
#         # SLOTS_PER_SESSION = 2 -> break_start = j+2
#         bs = j + SLOTS_PER_SESSION
#         # only enforce if break_start is available and same day
#         if bs < total_slots and available_slots[bs].date() == available_slots[j].date():
#             # sum all y at start index bs across subjects
#             y_at_bs = [ y[(ii, bs)] for ii in range(len(subjects)) if (ii, bs) in y ]
#             if y_at_bs:
#                 prob += y[(i,j)] + pulp.lpSum(y_at_bs) <= 1

#     # C) At most one session per subject per slot is already enforced via cover constraints.
#     # D) Per-day total sessions <= floor(study_hours_per_day / session_hours)
#     sessions_per_day_allowed = int((study_hours_per_day * 60) / SESSION_MINUTES)
#     for day, idxs in day_to_slot_idxs.items():
#         # compute possible starts in that day
#         starts_in_day = [j for j in starts if available_slots[j].date() == day]
#         if starts_in_day:
#             prob += pulp.lpSum([ y[(i,j)] for i in range(len(subjects)) for j in starts_in_day if (i,j) in y ]) <= sessions_per_day_allowed

#     # E) Optional cap per subject across month
#     if MAX_SESSIONS_PER_SUBJECT:
#         for i in range(len(subjects)):
#             prob += pulp.lpSum([ y[(i,j)] for j in starts if (i,j) in y ]) <= MAX_SESSIONS_PER_SUBJECT

#     # 5) Solve
#     solver = pulp.PULP_CBC_CMD(msg=False)
#     prob.solve(solver)

#     # 6) Collect schedule: for each chosen y[(i,j)] == 1 create a session entry
#     schedule = []
#     for (i,j), var in y.items():
#         val = pulp.value(var)
#         if val is not None and val > 0.5:
#             start_dt = available_slots[j]
#             end_dt = start_dt + timedelta(minutes=SESSION_MINUTES)
#             schedule.append({
#                 "date": start_dt.date().isoformat(),
#                 "start_time": start_dt.time().strftime("%H:%M"),
#                 "end_time": end_dt.time().strftime("%H:%M"),
#                 "subject_id": subjects[i]["_id"],
#                 "module_name": subjects[i]["module_name"],
#                 "lecture_name": subjects[i]["lecture_name"],
#                 "priority": subjects[i]["priority"]
#             })

#     # sort schedule
#     schedule.sort(key=lambda x: (x['date'], x['start_time']))
#     return schedule

# # Utility to pretty print grouped by date and show breaks
# def pretty_print_schedule(schedule):
#     by_date = defaultdict(list)
#     for s in schedule:
#         by_date[s['date']].append(s)

#     for d in sorted(by_date):
#         print(f"\nDate: {d}")
#         day_sessions = by_date[d]
#         # print sessions in chronological order
#         for s in day_sessions:
#             print(f"  {s['start_time']} - {s['end_time']}  | {s['module_name']} ({s['lecture_name']})  priority={s['priority']}")
#         # optionally show where breaks are inferred automatically (we enforce 15-min break between sessions)
