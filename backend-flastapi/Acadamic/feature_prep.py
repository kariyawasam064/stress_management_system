import numpy as np

def prepare_features_for_subjects(subjects):
    rows = []

    for s in subjects:
        priority = int(s.get("priority", 1))
        difficulty = int(s.get("difficulty", 1))
        module_count = len(s.get("modules", []))
        has_deadline = 1 if s.get("deadline") else 0

        rows.append([
            priority,
            difficulty,
            module_count,
            has_deadline
        ])

    return np.array(rows)
