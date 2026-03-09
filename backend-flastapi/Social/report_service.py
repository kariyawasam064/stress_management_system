import pandas as pd
from datetime import datetime
from pymongo import MongoClient

MONGO_URI = ""  # replace with your Mongo URI
DB_NAME = "stress"
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
social_stresses = db["social_stresses"]  # This is the table/collection to save timetables

def get_monthly_report(month, year):

    data = list(social_stresses.find({}))
    print(data)

    if not data:
        return None

    records = []

    for d in data:
        date = d.get("date")

        if date.month == month and date.year == year:
            records.append({
                "date": date,
                "sleep_hours": float(d.get("sleep_hours",0)),
                "stress_level": d.get("predicted_label"),
                "calls_incoming": int(d.get("calls_incoming",0)),
                "messages_received": int(d.get("messages_received",0)),
                "messages_sent": int(d.get("messages_sent",0)),
                "face_mood": d.get("face_mood")
            })

    df = pd.DataFrame(records)

    if df.empty:
        return None

    # Stress distribution
    stress_counts = df["stress_level"].value_counts()

    # Average sleep
    avg_sleep = df["sleep_hours"].mean()

    # Most stressful dates
    stress_dates = df[df["stress_level"]=="High"]["date"].dt.date.value_counts()

    report = {
        "dataframe": df,
        "stress_counts": stress_counts,
        "avg_sleep": avg_sleep,
        "stress_dates": stress_dates
    }

    return report



def create_excel(report):

    df = report["dataframe"]

    file_path = "stress_report.xlsx"

    with pd.ExcelWriter(file_path) as writer:

        df.to_excel(writer, sheet_name="Raw Data", index=False)

        report["stress_counts"].to_excel(writer, sheet_name="Stress Distribution")

        report["stress_dates"].to_excel(writer, sheet_name="High Stress Dates")

    return file_path


# -------------------------
# Report generation function
# -------------------------

# -------------------------
# Report generation function
# -------------------------
def get_monthly_report2(month, year):

    records = list(social_stresses.find({}))
    rows = []

    for rec in records:

        date_raw = rec.get("date")

        # Convert date
        if isinstance(date_raw, datetime):
            date_obj = date_raw
        elif isinstance(date_raw, dict) and "$date" in date_raw:
            date_obj = datetime.fromisoformat(date_raw["$date"].replace("Z","+00:00"))
        elif isinstance(date_raw, str):
            date_obj = datetime.fromisoformat(date_raw)
        else:
            continue

        if date_obj.month == month and date_obj.year == year:

            rows.append({
                "date": date_obj,
                "sleep_hours": float(rec.get("sleep_hours",0)),
                "stress": rec.get("predicted_label")
            })

    if not rows:
        return None

    df = pd.DataFrame(rows)

    # -------- Stress per day --------
    daily_stress = df[df["stress"] != "Low"].groupby(df["date"].dt.date).size()

    # -------- Week number --------
    df["week"] = df["date"].dt.day.apply(lambda x: (x-1)//7 + 1)

    weekly_stress = df[df["stress"] != "Low"].groupby("week").size()

    # Find highest stress week
    worst_week = weekly_stress.idxmax()
    worst_count = weekly_stress.max()

    summary = {
        "average_sleep": round(df["sleep_hours"].mean(),2),
        "stress_distribution": df["stress"].value_counts(),
        "weekly_stress": weekly_stress,
        "worst_week": worst_week,
        "worst_count": worst_count
    }

    return df, summary




def create_excel2(df, summary):

    file_path = "stress_report.xlsx"

    with pd.ExcelWriter(file_path, engine="openpyxl") as writer:

        # Raw student data
        df.to_excel(writer, sheet_name="Student Data", index=False)

        # Convert stress distribution to DataFrame
        stress_df = pd.DataFrame(
            summary["stress_distribution"].items(),
            columns=["Stress Level", "Count"]
        )
        stress_df.to_excel(writer, sheet_name="Stress Distribution", index=False)

        # Convert weekly stress to DataFrame
        weekly_df = pd.DataFrame(
            summary["weekly_stress"].items(),
            columns=["Week", "Stress Cases"]
        )
        weekly_df.to_excel(writer, sheet_name="Weekly Stress", index=False)

        # Summary sheet
        summary_df = pd.DataFrame({
            "Metric":[
                "Average Sleep Hours",
                "Most Stressful Week"
            ],
            "Value":[
                summary["average_sleep"],
                f"Week {summary['worst_week']} ({summary['worst_count']} stress cases)"
            ]
        })

        summary_df.to_excel(writer, sheet_name="Summary", index=False)

    return file_path
