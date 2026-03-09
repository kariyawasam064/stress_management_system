import pandas as pd
from datasets import load_dataset
from sklearn.model_selection import train_test_split

OUT = "datasets/fixmind_emotions_1000.csv"

def normalize_label(x: str) -> str:
    x = str(x).strip().lower()
    # Map common labels -> happy/sad/neutral
    if x in ["happy", "happiness", "joy", "positive", "pos", "LABEL_2"]:
        return "happy"
    if x in ["sad", "sadness", "negative", "neg", "LABEL_0"]:
        return "sad"
    if x in ["neutral", "LABEL_1"]:
        return "neutral"
    # fallback
    return x

rows = []

# -----------------------------
# A) PUBLIC: Sinhala emotion dataset (text + emotion)
# -----------------------------
ds1 = load_dataset("ehzawad/sinhala-emotion-dataset")  # :contentReference[oaicite:2]{index=2}

# Try common split names
splits = []
for s in ["train", "validation", "test"]:
    if s in ds1:
        splits.append(ds1[s])
if not splits:
    # if only one split exists
    splits = [next(iter(ds1.values()))]

# Collect up to 800
count = 0
for sp in splits:
    for ex in sp:
        text = ex.get("text") or ex.get("transcript") or ex.get("transcription")
        label = ex.get("label") or ex.get("emotion") or ex.get("target")
        if not text or label is None:
            continue
        label = normalize_label(label)
        if label not in ["happy", "sad", "neutral"]:
            continue
        rows.append({
            "text": str(text).strip(),
            "language": "si",
            "label": label,
            "source": "public",
            "accent": "na",
        })
        count += 1
        if count >= 800:
            break
    if count >= 800:
        break

if count < 800:
    print(f"WARNING: Only got {count} public samples from ds1. You can add dataset 2 if needed.")

# -----------------------------
# B) APP: add your own 200 samples later (placeholder)
# -----------------------------
# You will append your app-labeled CSV later.
# For now we just save public and you can merge again.

df = pd.DataFrame(rows).drop_duplicates(subset=["text", "label"])

# Add ids
df.insert(0, "id", range(1, len(df) + 1))

df.to_csv(OUT, index=False, encoding="utf-8")
print("Saved:", OUT, "rows:", len(df))