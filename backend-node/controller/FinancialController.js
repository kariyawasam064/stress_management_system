import FinancialProfile from "../model/FinancialProfile.js";
import AddIncome from "../model/AddIncome.js";
import axios from "axios";
import { 
    getMonthlyBreakdownInternal, 
    calculateFinancialStatus, 
    calculateTier2SurvivalFloor 
} from "./SavingsController.js";

/**
 * =================================================================================
 * FINANCIAL HEALTH & AI ADVISOR CONTROLLER
 * =================================================================================
 * Responsible for monitoring financial state escalations and orchestrating
 * AI-driven mentoring via the Gemini Pro engine.
 */

/**
 * Utility: Executes a network request to the Gemini API with exponential backoff logic.
 * Handles rate limits (429) and temporary service busy (503) states.
 * 
 * @param {string} url - API Endpoint.
 * @param {Object} data - Request payload.
 * @param {number} [retries=2] - Number of retry attempts.
 * @param {number} [backoff=1000] - Initial delay in ms.
 */
const callGeminiWithRetry = async (url, data, retries = 2, backoff = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await axios.post(url, data);
        } catch (error) {
            const status = error.response?.status;
            const isRateLimit = status === 429;
            const isBusy = status === 503;

            if ((isRateLimit || isBusy) && i < retries - 1) {
                console.log(`Gemini API ${isRateLimit ? 'Rate Limited (429)' : 'Busy (503)'}. Retrying in ${backoff}ms... (Attempt ${i + 1}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, backoff));
                backoff *= 2; // Standard backoff
                continue;
            }
            throw error;
        }
    }
};

/**
 * API: Fetches the user's financial profile settings (budget, targets, etc.)
 */
export const getFinancialProfile = async (req, res) => {
    try {
        const { email } = req.params;
        let profile = await FinancialProfile.findOne({ email }).lean();

        if (!profile) {
            // Self-healing: creates a default profile if an edge case occurs
            profile = new FinancialProfile({ email });
            await profile.save();
        }

        res.status(200).json(profile);
    } catch (error) {
        res.status(500).json({ message: "Error fetching profile", error: error.message });
    }
};

// Update Financial Profile (Budget, Target)
export const updateFinancialProfile = async (req, res) => {
    try {
        const { email } = req.params;
        const { monthlyBudget, savingTarget } = req.body;

        const profile = await FinancialProfile.findOneAndUpdate(
            { email },
            { monthlyBudget, savingTarget },
            { new: true, upsert: true }
        );

        res.status(200).json(profile);
    } catch (error) {
        res.status(500).json({ message: "Error updating profile", error: error.message });
    }
};

/**
 * =================================================================================
 * FINANCIAL HEALTH & AI ADVISOR CONTROLLER
 * =================================================================================
 * Monitors user status (Stable, Survival, Critical) and generates AI-driven advice.
 * Implements the "Senior Financial Mentor" persona for university students.
 */

/**
 * API: Get Financial Advice (AI Engine)
 * Analyzes the current month's transactions vs budget to determine financial state.
 * Uses Gemini AI to provide personalized, supportive guidance.
 */
export const getFinancialAdvice = async (req, res) => {
    console.log(`--- Financial Advice Request Started for ${req.params.email} ---`);
    try {
        const { email } = req.params;

        // 1. DATA GATHERING (Fetch Profile & Standardized Stats)
        let profile = await FinancialProfile.findOne({ email });
        if (!profile) {
            profile = new FinancialProfile({ email });
            await profile.save();
        }

        const today = new Date();
        const stats = await getMonthlyBreakdownInternal(email);
        console.log(`Found ${stats.transactionCount} transactions. Breakdown: Income=${stats.income}, Expense=${stats.expense}`);

        // 2. FINANCIAL CALCULATION LAYER
        const totalIncome = stats.income;
        const totalExpense = stats.expense;
        const totalSavingsTransfers = stats.savingsTransfers;
        const tier1Total = stats.tier1Total;
        const netExpense = stats.netSpending; // money truly lost (not saved)
        const currentMonthlyBalance = stats.balance;

        // Effective Budget: if user hasn't set one, we assume their income is the limit.
        const effectiveBudget = profile.monthlyBudget > 0 ? profile.monthlyBudget : totalIncome;

        // 3. STRESS DETECTION (SHOCK LOGIC)
        // A "Shock" occurs when NET spending exceeds the monthly budget.
        const isShock = netExpense > effectiveBudget;
        const shockAmount = isShock ? (netExpense - effectiveBudget) : 0;

        // 4. ADVANCED SURVIVAL FACTORS
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const daysToSalary = lastDayOfMonth.getDate() - today.getDate() + 1; // Days until 1st of next month
        const survivalFloor = await calculateTier2SurvivalFloor(email);
        const dailySurvivalLimit = daysToSalary > 0 ? (currentMonthlyBalance / daysToSalary) : currentMonthlyBalance;

        // 5. STATUS DETERMINATION ENGINE (Shared Utility)
        const status = calculateFinancialStatus(stats, profile, { survivalFloor, daysToSalary });
        console.log(`Financials calculated. Current Status: ${status}`);

        // 6. AI AGENT ORCHESTRATION (THE "MENTOR" LOGIC)
        // We inject hard math variables into a behavioral prompt for the AI.
        const prompt = `
    IDENTITY & PERSONA:
    You are a "Senior Financial Mentor" for a university student.
    Your tone is friendly, empathetic, and supportive.
    Goal: Protect "Dreams" (Goal Wallet) by managing the "Shield" (Emergency Shield).
 
    SURVIVAL MODE ANALYSIS:
    - Current Status: ${status}
    - Tier 2 Survival Floor (Historical): Rs. ${survivalFloor}/day
    - Active Daily Survival Limit: Rs. ${Math.round(dailySurvivalLimit)}/day
    - Days to Salary: ${daysToSalary} days

    LIVE FINANCIAL DATA:
    - Monthly Income: Rs. ${totalIncome}
    - Net Spending: Rs. ${netExpense}
    - Safety Transfers: Rs. ${totalSavingsTransfers}
    - Monthly Budget: Rs. ${effectiveBudget}
    - Tier 1 Essentials (Already Covered): Rs. ${tier1Total}
    - Available Cashflow: Rs. ${currentMonthlyBalance}
    - Overspending Shock: Rs. ${shockAmount}

    CONSTRAINTS & INSTRUCTIONS:
    1. If in ${status} === "Survival", prioritize the Daily Limit (Rs. ${Math.round(dailySurvivalLimit)}).
    2. Advise on Tier 2 (Food/Travel) management as Tier 1 is already paid.
    3. If Daily Limit < Survival Floor, advocate for "Extreme Austerity".
    4. Provide analysis in English, Sinhala script, and Phonetic Singlish.

    JSON SCHEMA:
    {
      "status": "${status}",
      "crisis_analysis": "mentor analysis text",
      "crisis_analysis_si": "sinhala translation",
      "singlish_audio": "phonetic version for TTS",
      "action_plan": ["step 1", "step 2"],
      "action_plan_si": ["පියවර 1", "පියවර 2"],
      "recovery_timeline": "timeline text",
      "recovery_timeline_si": "කාලරාමුව මෙතැන",
      "survival_data": {
         "is_survival": ${status === 'Survival'},
         "daily_limit": ${Math.round(dailySurvivalLimit)},
         "floor": ${survivalFloor},
         "days_remaining": ${daysToSalary}
      }
    }
    `;

        // 6. Call AI with retry
        console.log(`Generating advice for ${email} with status ${status}...`);
        let advice;
        try {
            const response = await callGeminiWithRetry(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
                {
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        responseMimeType: "application/json",
                    },
                }
            );
            console.log("Gemini API response received successfully.");

            const aiText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
            advice = JSON.parse(aiText);

            // Save successful advice to cache
            profile.lastGeneratedAdvice = advice;
        } catch (err) {
            console.error("Gemini API Call Failed or Rate Limited!");
            if (err.response?.status === 429 && profile.lastGeneratedAdvice) {
                console.log("Returning cached advice due to rate limit.");
                advice = profile.lastGeneratedAdvice;
            } else {
                // HARD FALLBACK: If AI fails and no cache, return the calculated status at minimum
                console.log("AI failed and no cache found. Using hard fallback.");
                advice = {
                    status: status,
                    crisis_analysis: `Your financial status is currently ${status}. Your income-to-savings ratio shows strong discipline.`,
                    crisis_analysis_si: `ඔබගේ මූල්‍ය තත්ත්වය දැනට ${status} මට්ටමේ පවතී.`,
                    singlish_audio: `Obagey moolya thathwaya dhanata ${status} mattamey pawathee.`,
                    action_plan: ["Continue consistent savings transfers.", "Keep monitoring discretionary spending."],
                    recovery_timeline: "Wealth-building phase active."
                };
            }
        }

        // Save Status Update
        profile.currentStatus = status;

        if (isShock) {
            if (profile.lastShockDate && new Date(profile.lastShockDate).getMonth() !== today.getMonth()) {
                profile.consecutiveShocks += 1;
                profile.lastShockDate = today;
            } else if (!profile.lastShockDate) {
                profile.consecutiveShocks = 1;
                profile.lastShockDate = today;
            }
        } else {
            // RECOVERY LOGIC: If no shock, we reset the consecutive counter to reward stability.
            profile.consecutiveShocks = 0;
            profile.lastShockDate = null;
        }
        await profile.save();

        res.status(200).json(advice);

    } catch (error) {
        console.error("Financial Advice Error:", error);
        res.status(500).json({ message: "Failed to generate advice", error: error.message });
    }
};
