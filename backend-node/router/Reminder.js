import express from "express";
import {
  addReminder,
  getUserReminders,
  deleteReminder,
  scheduleAllReminders,
} from "../controller/Reminder.js";

const router = express.Router();

// Add reminder (includes pushToken in updated controller)
router.post("/add", addReminder);

// Get reminders of user
router.get("/user/:email", getUserReminders);

// Delete reminder
router.delete("/delete/:id", deleteReminder);

// Manually trigger scheduling all reminders
router.get("/schedule-all", async (req, res) => {
  try {
    await scheduleAllReminders();
    res.status(200).json({ message: "All pending reminders scheduled successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error scheduling reminders", error: error.message });
  }
});

export default router;
