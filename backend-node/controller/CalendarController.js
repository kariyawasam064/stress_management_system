import Transaction from "../model/AddIncome.js";
import Reminder from "../model/Reminder.js";
import TransactionType from "../enum/TransactionType.js";

const getFinancialEvents = async (req, res) => {
    try {
        const { email } = req.params;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // 1. Fetch all transactions (Income & Expenses)
        const transactions = await Transaction.find({ email });

        // 2. Fetch all reminders
        const reminders = await Reminder.find({ email });

        const events = {};

        // Process Transactions
        transactions.forEach((tx) => {
            const date = tx.date;
            if (!events[date]) events[date] = [];

            let color = "#34C759"; // Default Green for Income
            if (tx.type === TransactionType.EXPENSE) {
                if (tx.tier === 1) color = "#FF3B30"; // Red
                else if (tx.tier === 2) color = "#FF9500"; // Orange
                else color = "#007AFF"; // Blue
            }

            events[date].push({
                id: tx._id,
                title: tx.category,
                amount: tx.amount,
                type: tx.type,
                tier: tx.tier,
                color: color,
                note: tx.note,
                category: tx.category
            });
        });

        // Process Reminders
        reminders.forEach((rem) => {
            const date = new Date(rem.dueDate).toISOString().split("T")[0];
            if (!events[date]) events[date] = [];

            events[date].push({
                id: rem._id,
                title: rem.title,
                description: rem.description,
                type: "reminder",
                color: "#AF52DE", // Purple for reminders
                status: rem.status
            });
        });

        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export default {
    getFinancialEvents,
};
