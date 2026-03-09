import pandas as pd

public = pd.read_csv("datasets/fixmind_public_800.csv")
app = pd.read_csv("datasets/app_samples_200.csv")

needed = ["text", "language", "label", "source", "accent"]
public = public[needed]
app = app[needed]

df = pd.concat([public, app], ignore_index=True)

df.insert(0, "id", range(1, len(df) + 1))

df.to_csv("datasets/fixmind_dataset_1000.csv", index=False, encoding="utf-8-sig")

print("✅ rows:", len(df))
print("labels:\n", df["label"].value_counts())
print("languages:\n", df["language"].value_counts())