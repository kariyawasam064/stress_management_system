import AddIncome from "../model/AddIncome.js";

export const prefillSavingPlan = async (req, res) => {
  try {
    const { email } = req.params;

    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Convert dates to YYYY-MM-DD strings (because your DB stores strings)
    const startDate = firstDay.toISOString().split("T")[0];
    const endDate = lastDay.toISOString().split("T")[0];

    const transactions = await AddIncome.find({
      email,
      date: { $gte: startDate, $lte: endDate }
    });

    let totalIncome = 0;
    const categoryExpenses = {};

    transactions.forEach((t) => {
      if (t.type === "income") {
        totalIncome += Number(t.amount);
      } else if (t.type === "expense") {
        categoryExpenses[t.category] =
          (categoryExpenses[t.category] || 0) + Number(t.amount);
      }
    });

    res.status(200).json({
      income: totalIncome,
      expenses: categoryExpenses,
    });

  } catch (err) {
    console.error("Prefill error:", err);
    res.status(500).json({ error: err.message });
  }
};
