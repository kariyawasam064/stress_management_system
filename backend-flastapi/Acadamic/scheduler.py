from datetime import datetime, timedelta

SESSION_MINUTES = 45   # length of one session
BREAK_MINUTES = 15     # break between sessions

def create_schedule_with_caps(subjects, unavailable, year, month,
                              study_hours_per_day,
                              per_subject_max_sessions,
                              window_start=18, window_end=22):
    schedule = []
    
    # Track next available slot per day
    day_slots = {}
    
    # Ignore unavailable dates
    # ignore_dates = set([u["date"] for u in unavailable])
    ignore_dates = set()

    for u in unavailable:
        if isinstance(u, dict) and "date" in u:
            ignore_dates.add(u["date"])
        elif isinstance(u, str):
            ignore_dates.add(u)

    
    # Loop over subjects and allocate sessions
    for s in subjects:
        sid = s["_id"]
        needed_sessions = per_subject_max_sessions.get(sid, 1)
        
        current_date = datetime(year, month, 1, window_start, 0)
        while needed_sessions > 0:
            date_str = current_date.strftime("%Y-%m-%d")
            if date_str not in ignore_dates:
                # Initialize next available time for this day
                if date_str not in day_slots:
                    day_slots[date_str] = datetime(year, month, current_date.day, window_start, 0)
                
                # Get the next available start time
                start_time = day_slots[date_str]
                end_time = start_time + timedelta(minutes=SESSION_MINUTES)
                
                # Make sure we don’t go beyond the allowed window
                if end_time.hour + end_time.minute/60.0 > window_end:
                    # Move to next day
                    current_date += timedelta(days=1)
                    continue
                
                # Add session
                schedule.append({
                    "date": date_str,
                    "start_time": start_time.strftime("%H:%M"),
                    "end_time": end_time.strftime("%H:%M"),
                    "subject_id": sid,
                    "module_name": s["module_name"],
                    "lecture_name": s["lecture_name"],
                    "priority": s["priority"]
                })
                
                needed_sessions -= 1
                
                # Update next available time for this day (after break)
                day_slots[date_str] = end_time + timedelta(minutes=BREAK_MINUTES)
            
            # Move to next day if window is exhausted
            current_date += timedelta(days=1)
    
    # Sort schedule by date and start_time
    schedule.sort(key=lambda x: (x['date'], x['start_time']))
    return schedule
