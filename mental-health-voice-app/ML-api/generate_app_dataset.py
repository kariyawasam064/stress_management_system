import pandas as pd
import random

sinhala_happy = [
"අද මට ගොඩක් සතුටුයි",
"අද හරි සතුටු දවසක්",
"අද මගේ හිත සතුටින් තියෙනවා",
"අද මට හරි හොඳ mood එකක් තියෙනවා",
"අද මගේ යාලුවෝ එක්ක හරි විනෝද උනා",
"අද මට life එක ගැන සතුටුයි",
"අද මගේ project එක සාර්ථකයි",
"අද මට positive feeling එකක් තියෙනවා",
"අද මට හරි proud දැනෙනවා",
"අද මට energy ගොඩක් තියෙනවා"
]

sinhala_sad = [
"අද මට හිත අමාරුයි",
"අද මට ටිකක් දුකයි",
"අද මගේ හිත බරයි",
"අද මට පීඩනයක් දැනෙනවා",
"අද මට stressed වගේ දැනෙනවා",
"අද මට lonely වගේ දැනෙනවා",
"අද මට motivation නැහැ",
"අද මට mentally tired වගේ",
"අද මට life එක ටිකක් අමාරුයි",
"අද මට hope ටිකක් අඩුයි"
]

english_happy = [
"I feel very happy today",
"Today was a wonderful day",
"I feel excited about life",
"I feel calm and positive today",
"I had a great time with my friends",
"I feel proud of my work today",
"I feel motivated and happy",
"Today I feel really good",
"I am grateful for today",
"I feel very joyful today"
]

english_sad = [
"I feel sad today",
"I feel stressed about my exams",
"I feel lonely tonight",
"I feel mentally tired today",
"I feel overwhelmed with work",
"Today I feel very down",
"I feel upset about what happened",
"I feel emotionally drained",
"I feel discouraged today",
"I feel anxious about tomorrow"
]

accents = ["colombo","kandy","matara"]

data = []

for i in range(50):
    data.append([random.choice(sinhala_happy),"si","happy","app",random.choice(accents)])
    data.append([random.choice(sinhala_sad),"si","sad","app",random.choice(accents)])
    data.append([random.choice(english_happy),"en","happy","app","na"])
    data.append([random.choice(english_sad),"en","sad","app","na"])

df = pd.DataFrame(data, columns=["text","language","label","source","accent"])

df.insert(0,"id",range(1,len(df)+1))

df.to_csv("datasets/app_samples_200.csv",index=False , encoding="utf-8-sig")

print("✅ 200 sample dataset created: datasets/app_samples_200.csv")