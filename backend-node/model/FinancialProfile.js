import mongoose from "mongoose";

const Schema = mongoose.Schema;

const financialProfileSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  // --- Budgeting & Targets ---
  monthlyBudget: {
    type: Number,
    default: 0,
  },
  savingTarget: {
    type: Number,
    default: 0,
  },
  // --- Financial State (State Machine) ---
  currentStatus: {
    type: String,
    enum: ['Stable', 'Recovery', 'Survival', 'Critical', 'Prudent'],
    default: 'Stable',
  },
  consecutiveShocks: {
    // Logic: Count of consecutive months where expenses > budget. 
    // Used to trigger 'Survival' status escalation.
    type: Number,
    default: 0,
  },
  lastShockDate: {
    // Logic: Timestamp of the last overspending event.
    type: Date,
    default: null,
  },
  accumulatedDeficit: {
    // Logic: Unpaid 'Safety Taxes' due to low balance during Tier 3 spending.
    // Automatically recovered from subsequent income.
    type: Number,
    default: 0,
  },
  // --- Dual-Wallet Architecture ---
  emergencyFund: {
    // The "Emergency Shield" for unpredictable crises.
    type: Number,
    default: 0,
  },
  goalWallet: {
    // The "Dream Wallet" for long-term aspirations.
    type: Number,
    default: 0,
  },
  // --- Saving Strategies ---
  savingStrategy: {
    type: String,
    enum: ['Automatic', 'Custom'],
    default: 'Automatic',
  },
  shieldPercentage: {
    // Default: 20% of savings go to Shield.
    type: Number,
    default: 20,
  },
  goalPercentage: {
    // Default: 80% of savings go to Goal.
    type: Number,
    default: 80,
  },
  customAutoSavePercentage: {
    // Used specifically in 'Custom' strategy: what % of total INCOME to save.
    type: Number,
    default: 5,
  },
  savingTrigger: {
    // Immediate save from income or end-of-month surplus.
    type: String,
    enum: ['Income', 'EndOfMonth'],
    default: 'Income',
  },
  // --- Safety & Health Score ---
  isSafetyModeActive: {
    type: Boolean,
    default: false,
  },
  financialHealthScore: {
    // Logic: Game-like metric (0-100). 
    // Penalties applied for unverified Emergency Shield withdrawals.
    type: Number,
    default: 100,
    min: 0,
    max: 100,
  },
  lastGeneratedAdvice: {
    type: Object,
    default: null
  }
});

export default mongoose.model("FinancialProfile", financialProfileSchema);
