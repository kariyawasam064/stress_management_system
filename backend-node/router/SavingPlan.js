import express from "express";
import { prefillSavingPlan } from "../controller/SavingPlan.js";
const router = express.Router();

router.get("/prefill/:email", prefillSavingPlan);

export default router;
