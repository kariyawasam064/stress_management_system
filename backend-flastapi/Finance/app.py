from flask import Flask, request, jsonify
import joblib

app = Flask(__name__)
model = joblib.load('time_to_save_model.pkl')

def allocate_expenses(income, expenses, saving_amount, time_months):
    # total flexible expense
    total_expense = sum(expenses.values())
    max_saving_possible = income - total_expense
    scaling_factor = max(0, (income - saving_amount) / total_expense)
    
    allocation = {}
    for cat, amt in expenses.items():
        if cat == 'Tuition & Academic Fees':  # fixed
            allocation[cat] = amt
        else:
            allocation[cat] = round(amt * scaling_factor, 2)
    
    # generate weekly, monthly, 3-month breakdown
    weekly = {k: round(v/4,2) for k,v in allocation.items()}
    three_month = {k: round(v*3,2) for k,v in allocation.items()}
    
    return allocation, weekly, three_month


@app.route('/predict_savings', methods=['POST'])
def predict_savings():
    data = request.json
    # data = {"income":..., "expenses": {...}, "saving_amount":...}
    categories = ["Tuition & Academic Fees","Food & Meals","Transport","Entertainment","Shopping","Health & Fitness","Others"]
    
    X_input = [data['expenses'][cat] for cat in categories] + [data['income'], data['saving_amount']]
    time_to_save = model.predict([X_input])[0]
    
    allocation, weekly, three_month = allocate_expenses(data['income'], data['expenses'], data['saving_amount'], time_to_save)
    
    return jsonify({
        "time_to_save_months": round(time_to_save,2),
        "allocation": allocation,
        "weekly": weekly,
        "three_month": three_month
    })

if __name__ == "__main__":
    app.run(debug=True,port=5005)



#model and dataset creation code 
# import pandas as pd
# import numpy as np

# np.random.seed(42)

# data = []
# fixed_expenses = ['Tuition & Academic Fees']
# categories = ["Tuition & Academic Fees","Food & Meals","Transport","Entertainment","Shopping","Health & Fitness","Others"]

# for _ in range(5000):
#     income = np.random.randint(30000, 100001)
#     tuition = np.random.randint(5000, 20001)  # fixed
#     food = np.random.randint(3000, 7001)
#     transport = np.random.randint(1000, 4001)
#     entertainment = np.random.randint(500, 3001)
#     shopping = np.random.randint(500, 3001)
#     health = np.random.randint(500, 2001)
#     others = np.random.randint(500, 2001)
    
#     total_expense = tuition + food + transport + entertainment + shopping + health + others
#     max_saving_possible = income - total_expense
    
#     if max_saving_possible < 1000:  # skip impossible cases
#         continue
    
#     saving_amount = np.random.randint(1000, max_saving_possible + 1)
#     time_to_save_months = round(saving_amount / max(1, (income - total_expense)), 2)
    
#     data.append([income, tuition, food, transport, entertainment, shopping, health, others, saving_amount, time_to_save_months])


# df = pd.DataFrame(data, columns=categories + ['income','saving_amount','time_to_save'])
# df.to_csv('simulated_budget.csv', index=False)
# print(df.head())


# def allocate_expenses(income, expenses, saving_amount, time_months):
#     # total flexible expense
#     total_expense = sum(expenses.values())
#     max_saving_possible = in= round(amt * scaling_factor, 2)
    
#     # generate weekly, monthly, 3-month breakdown
#     weekly = {k: round(v/4,2) for k,v in allocation.items()}
#     three_month = {k: round(v*3,2) for k,v in allocation.items()}
    
#     return allocation, weekly, three_monthcome - total_expense
#     scaling_factor = max(0, (income - saving_amount) / total_expense)
    
#     allocation = {}
#     for cat, amt in expenses.items():
#         if cat == 'Tuition & Academic Fees':  # fixed
#             allocation[cat] = amt
#         else:
#             allocation[cat] 



#input json
# {
#     "income": 50000,
#     "saving_amount": 10000,
#     "expenses": {
#         "Tuition & Academic Fees": 15000,
#         "Food & Meals": 8000,
#         "Transport": 2000,
#         "Entertainment": 1000,
#         "Shopping": 1000,
#         "Health & Fitness": 500,
#         "Others": 500
#     }
# }


# output json 
# {
#     "allocation": {
#         "Entertainment": 1428.57,
#         "Food & Meals": 11428.57,
#         "Health & Fitness": 714.29,
#         "Others": 714.29,
#         "Shopping": 1428.57,
#         "Transport": 2857.14,
#         "Tuition & Academic Fees": 15000
#     },
#     "three_month": {
#         "Entertainment": 4285.71,
#         "Food & Meals": 34285.71,
#         "Health & Fitness": 2142.87,
#         "Others": 2142.87,
#         "Shopping": 4285.71,
#         "Transport": 8571.42,
#         "Tuition & Academic Fees": 45000
#     },
#     "time_to_save_months": 0.76,
#     "weekly": {
#         "Entertainment": 357.14,
#         "Food & Meals": 2857.14,
#         "Health & Fitness": 178.57,
#         "Others": 178.57,
#         "Shopping": 357.14,
#         "Transport": 714.28,
#         "Tuition & Academic Fees": 3750.0
#     }
# }