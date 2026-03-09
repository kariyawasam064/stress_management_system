import pandas as pd

files = [
    "datasets/emotions/train.txt",
    "datasets/emotions/test.txt",
    "datasets/emotions/val.txt"
]

data = []

for file in files:
    with open(file, "r", encoding="utf-8") as f:
        for line in f:
            parts = line.strip().split(";")
            if len(parts) != 2:
                continue

            text = parts[0]
            label = parts[1]

            # Map labels to your research labels
            if label in ["joy", "love"]:
                label = "happy"
            elif label in ["sadness", "fear", "anger"]:
                label = "sad"
            else:
                label = "neutral"

            data.append({
                "text": text,
                "language": "en",
                "label": label,
                "source": "kaggle",
                "accent": "na"
            })

df = pd.DataFrame(data)

# Keep only first 800 samples
df = df.head(800)

df.insert(0, "id", range(1, len(df)+1))

df.to_csv("datasets/fixmind_public_800.csv", index=False)

print("Dataset created with", len(df), "samples")