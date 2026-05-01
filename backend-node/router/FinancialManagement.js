import express from "express";
import { 
    getFinancialProfile, 
    updateFinancialProfile, 
    getFinancialAdvice 
} from "../controller/FinancialController.js";
import { 
    processAutoSave, 
    getSavingsDetails, 
    updateSavingsSettings, 
    processEndOfMonthSavings, 
    withdrawFromWallet, 
    toggleSafetyMode,
    prefillSavingPlan
} from "../controller/SavingsController.js";

const router = express.Router();

/**
 * =================================================================================
 * UNIFIED FINANCIAL MANAGEMENT ROUTER
 * =================================================================================
 * Consolidates AI Advisor, Savings Strategies, and Wallet Management.
 */

// --- Financial Profile & AI Advice ---
router.get("/profile/:email", getFinancialProfile); // From /financial
router.post("/profile/update/:email", updateFinancialProfile);
router.get("/advice/:email", getFinancialAdvice);

// --- Savings & Budgeting Prefill ---
router.get("/prefill/:email", prefillSavingPlan); // From /saving

// --- Dual-Wallet Management (Shield & Goal) ---
// Note: These paths must match the frontend calls exactly.
router.post("/auto-save", processAutoSave);
router.get("/emergency-fund/:email", getSavingsDetails);
router.post("/emergency-fund/settings", updateSavingsSettings);
router.get("/emergency-fund/sweep/:email", processEndOfMonthSavings);
router.post("/withdraw", withdrawFromWallet);
router.post("/toggle-safety", toggleSafetyMode);

export default router;
