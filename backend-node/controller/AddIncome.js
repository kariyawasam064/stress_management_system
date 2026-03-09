import AddIncome from "../model/AddIncome.js";
import TransactionType from "../enum/TransactionType.js";
import axios from "axios";

export const AddNewTransaction = async (req, res) => {
  try {
    const { type, email, amount, date, category, note } = req.body;

    if (!Object.values(TransactionType).includes(type)) {
      return res.status(400).json({ message: "Invalid transaction type" });
    }
    const newVol = new AddIncome({
      date,
      type,
      category,
      amount,
      note,
      email,
    });

    const saved = await newVol.save();

    res.status(201).json({
      message: "Transaction Added Successfully..!",
      payload: saved,
    });
  } catch (error) {
    console.error("AddNewTransaction Error:", error);
    res.status(500).json({
      message: "Something Went Wrong..! ",
      error,
    });
  }
};

// Get all incomes, expenses and balance by mail
export const GetAllIncomeByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    const income = await AddIncome.find({ email });

    if (income.length === 0) {
      return res.status(404).json({
        message: "No Transaction found for this email.",
      });
    }
    res.status(200).json(income);
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong while fetching lectures.",
      error,
    });
  }
};


export const MonthlySummaryCal = async (req, res) => {
  try {
    const { email } = req.params;

    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const firstDayStr = firstDay.toISOString().split("T")[0];
    const lastDayStr = lastDay.toISOString().split("T")[0];

    const incomes = await AddIncome.find({
      email: email,
      type: "income",
      date: { $gte: firstDayStr, $lte: lastDayStr },
    });

    const expenses = await AddIncome.find({
      email: email,
      type: "expense",
      date: { $gte: firstDayStr, $lte: lastDayStr },
    });

    const totalIncome = incomes.reduce(
      (sum, item) => sum + Number(item.amount),
      0
    );
    const totalExpense = expenses.reduce(
      (sum, item) => sum + Number(item.amount),
      0
    );

    res.status(200).json({
      month: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
        2,
        "0"
      )}`,
      income: {
        total: totalIncome,
        count: incomes.length,
      },
      expense: {
        total: totalExpense,
        count: expenses.length,
      },
      balance: {
        total: totalIncome - totalExpense,
      },
    });
  } catch (error) {
    console.error("Monthly Summary Error:", error);
    res.status(500).json({
      message: "Failed to calculate monthly summary",
      error,
    });
  }
};

// Delete an transaction record by ID
export const DeleteIncome = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await AddIncome.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    let revertAmount = Number(deleted.amount);
    let revertType = deleted.type;

    let adjustment = 0;

    if (revertType === "income") {
      adjustment = -revertAmount;
    } else if (revertType === "expense") {
      adjustment = +revertAmount;
    }

    res.status(200).json({
      message: "Transaction deleted successfully",
      payload: deleted,
      revert: {
        type: revertType,
        amount: revertAmount,
        adjustment: adjustment,
      },
    });
  } catch (error) {
    console.error("DeleteIncome Error:", error);
    res.status(500).json({
      message: "Something went wrong while deleting income",
      error: error.message,
    });
  }
};

// Get Weekly Expenses Category-wise (Auto Week Calculation)
export const WeeklyExpenseCategory = async (req, res) => {
  try {
    const { email } = req.params;

    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);

    const startDate = lastWeek.toISOString().split("T")[0];
    const endDate = today.toISOString().split("T")[0];

    const expenses = await AddIncome.find({
      email,
      type: "expense",
      date: { $gte: startDate, $lte: endDate },
    });

    if (expenses.length === 0) {
      return res.status(200).json({
        summary: {},
        message: "No expenses for this week.",
      });
    }

    const summary = {};

    expenses.forEach((item) => {
      if (!summary[item.category]) {
        summary[item.category] = {
          totalAmount: 0,
          transactions: 0,
        };
      }

      summary[item.category].totalAmount += Number(item.amount);
      summary[item.category].transactions += 1;
    });

    res.status(200).json(summary);
  } catch (error) {
    console.error("WeeklyExpenseCategory Error:", error);
    res.status(500).json({
      message: "Failed to fetch weekly expense summary",
      error: error.message,
    });
  }
};

// Get Monthly Income Category-wise
export const MonthlyIncomeCategory = async (req, res) => {
  try {
    const { email } = req.params;

    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const startDate = firstDay.toISOString().split("T")[0];
    const endDate = lastDay.toISOString().split("T")[0];

    const incomes = await AddIncome.find({
      email,
      type: "income",
      date: { $gte: startDate, $lte: endDate },
    });

    if (incomes.length === 0) {
      return res.status(200).json({
        summary: {},
        message: "No income for this month.",
      });
    }

    const summary = {};

    incomes.forEach((item) => {
      if (!summary[item.category]) {
        summary[item.category] = {
          totalAmount: 0,
          transactions: 0,
        };
      }

      summary[item.category].totalAmount += Number(item.amount);
      summary[item.category].transactions += 1;
    });

    res.status(200).json(summary);
  } catch (error) {
    console.error("MonthlyIncomeCategory Error:", error);
    res.status(500).json({
      message: "Failed to fetch monthly income summary",
      error: error.message,
    });
  }
};

// Get this month transaction and pass to AI function
export const getThisMonthTransactions = async (email) => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const firstDayStr = firstDay.toISOString().split("T")[0];
  const lastDayStr = lastDay.toISOString().split("T")[0];

  const transactions = await AddIncome.find({
    email,
    date: { $gte: firstDayStr, $lte: lastDayStr },
  });

  return transactions;
};

//AI function
export const analyzeFinances = async (req, res) => {
  try {
    const { email } = req.params;

    const transactions = await getThisMonthTransactions(email);

    if (transactions.length === 0) {
      return res.status(404).json({
        message: "No transactions found for this month.",
      });
    }

    const cleanData = transactions.map((t) => ({
      type: t.type,
      category: t.category,
      amount: t.amount,
      date: t.date,
    }));

    const fixedExpenses = ["Boarding Fees", "Class Fees", "Rent", "Utilities"];
    const essentialCategories = ["Health & Fitness", "Medical", "Insurance"];

    const prompt = `
You are a financial analytics AI designed to evaluate a user's monthly transaction data and generate concise insights.

Analyze this dataset:
${JSON.stringify(cleanData)}

---------------------------------
ANALYSIS RULES
---------------------------------
1. Identify FIXED expenses: ${fixedExpenses.join(", ")}.
2. Classify remaining expenses as VARIABLE.
3. Calculate:
   - totalIncome
   - totalFixedExpenses
   - totalVariableExpenses
   - savings = income - (fixed + variable)
4. Determine financial stress level:
   - VERY LOW: < 20%
   - LOW: 20%-50%
   - MODERATE: 50%-70%
   - HIGH: 70%-90%
   - VERY HIGH: 90%-100%
   - OVERSTRESSED: > 100%
5. Provide numeric recommendations.
6. Do NOT suggest reducing expenses in essential categories: ${essentialCategories.join(
      ", "
    )}.
7. Maximum:
   - 3 alerts
   - 4 recommendations
   - 1 sentence feedback
8. Always return short, direct, professional language.
9. Output must be VALID JSON ONLY. No text outside JSON.

---------------------------------
REQUIRED JSON OUTPUT FORMAT
---------------------------------
{
  "stressLevel": "",
  "alerts": [],
  "highSpendingCategories": [],
  "recommendations": [],
  "feedback": ""
}

Return ONLY the JSON response.
`;

    // Call AI model
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          topK: 1,
          topP: 1,
        },
      }
    );

    let aiMessage =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    aiMessage = aiMessage.replace(/```json|```/g, "").trim();

    const aiData = JSON.parse(aiMessage);

    const stressLevelMapping = {
      "VERY LOW": 10,
      LOW: 35,
      MODERATE: 60,
      HIGH: 80,
      "VERY HIGH": 95,
      OVERSTRESSED: 110,
    };

    if (aiData.stressLevel) {
      if (!isNaN(parseFloat(aiData.stressLevel))) {
        aiData.stressLevel = parseFloat(aiData.stressLevel);
      } else if (stressLevelMapping[aiData.stressLevel.toUpperCase()]) {
        aiData.stressLevel =
          stressLevelMapping[aiData.stressLevel.toUpperCase()];
      } else {
        aiData.stressLevel = 0;
      }
    }

    res.json(aiData);
  } catch (error) {
    console.error("AI Finance Error:", error.response?.data || error);
    res.status(500).json({
      message: "Failed to analyze finances",
      error: error.message,
    });
  }
};

//Yearly Month-wise Balance get
export const YearlyBalanceSummary = async (req, res) => {
  try {
    const { email } = req.params;

    const currentYear = new Date().getFullYear();

    // Convert to string format: YYYY-MM-DD
    const startDate = `${currentYear}-01-01`;
    const endDate   = `${currentYear}-12-31`;

    // Fetch all transactions as strings
    const transactions = await AddIncome.find({
      email,
      date: { $gte: startDate, $lte: endDate }
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const balanceByMonth = monthNames.map((m) => ({
      month: m,
      balance: 0
    }));

    transactions.forEach((t) => {
      const monthIndex = new Date(t.date).getMonth(); // String → Date works
      const amount = Number(t.amount);

      if (t.type === "income") balanceByMonth[monthIndex].balance += amount;
      else if (t.type === "expense") balanceByMonth[monthIndex].balance -= amount;
    });

    return res.status(200).json({
      year: currentYear,
      monthlyBalance: balanceByMonth
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to calculate yearly balance summary",
      error: error.message,
    });
  }
};