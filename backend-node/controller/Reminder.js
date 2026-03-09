import Reminders from "../model/Reminder.js";
import cron from "node-cron";
import axios from "axios";

/**
 * SEND EXPO PUSH NOTIFICATION
 */
const sendNotification = async (pushToken, title, body) => {
  try {
    await axios.post("https://exp.host/--/api/v2/push/send", {
      to: pushToken,
      sound: "default",
      title,
      body,
    });

    console.log("📨 Notification sent to:", pushToken);
  } catch (error) {
    console.error("❌ Error sending push notification:", error.message);
  }
};

/**
 * SCHEDULE ALL PENDING REMINDERS ON SERVER START
 */
export const scheduleAllReminders = async () => {
  try {
    const reminders = await Reminders.find({ status: "pending" });
    reminders.forEach(scheduleSingleReminder);
    console.log(`[Reminder] Scheduled ${reminders.length} reminders.`);
  } catch (error) {
    console.error("Error scheduling reminders:", error.message);
  }
};

/**
 * SCHEDULE SINGLE REMINDER
 */
const scheduleSingleReminder = (reminder) => {
  const date = new Date(reminder.dueDate);
  const minute = date.getMinutes();
  const hour = date.getHours();
  const day = date.getDate();
  const month = date.getMonth() + 1;

  cron.schedule(`${minute} ${hour} ${day} ${month} *`, async () => {
    console.log(`[Reminder Triggered] ${reminder.email}: ${reminder.title}`);

    // Send push notification if token exists
    if (reminder.pushToken) {
      await sendNotification(
        reminder.pushToken,
        reminder.title,
        reminder.description || "Your reminder is due!"
      );
    } else {
      console.log("⚠ No push token found for this reminder");
    }

    // Update reminder status / reschedule
    if (reminder.frequency === "once") {
      reminder.status = "done";
      await reminder.save();
    } else if (reminder.frequency === "daily") {
      reminder.dueDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      await reminder.save();
      scheduleSingleReminder(reminder);
    } else if (reminder.frequency === "weekly") {
      reminder.dueDate = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);
      await reminder.save();
      scheduleSingleReminder(reminder);
    } else if (reminder.frequency === "monthly") {
      const nextMonth = new Date(date);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      reminder.dueDate = nextMonth;
      await reminder.save();
      scheduleSingleReminder(reminder);
    }
  });
};

/**
 * ADD NEW REMINDER
 */
export const addReminder = async (req, res) => {
  try {
    const { title, description, dueDate, frequency, email, pushToken } = req.body;

    if (!email) {
      return res.status(400).json({ message: "User email is required!" });
    }

    const reminder = await Reminders.create({
      title,
      description,
      dueDate,
      frequency: frequency || "once",
      status: "pending",
      email,
      pushToken, // store push token inside the reminder
    });

    scheduleSingleReminder(reminder);

    res.status(200).json({
      message: "Reminder created and scheduled successfully",
      data: reminder,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error adding reminder",
      error: error.message,
    });
  }
};

/**
 * GET REMINDERS
 */
export const getUserReminders = async (req, res) => {
  try {
    const userEmail = req.params.email;
    if (!userEmail)
      return res.status(400).json({ message: "Email is required!" });

    const reminders = await Reminders.find({ email: userEmail }).sort({
      dueDate: 1,
    });
    res.status(200).json(reminders);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching reminders",
      error: error.message,
    });
  }
};

/**
 * DELETE REMINDER
 */
export const deleteReminder = async (req, res) => {
  try {
    const reminderId = req.params.id;

    const deleted = await Reminders.findByIdAndDelete(reminderId);
    if (!deleted)
      return res.status(404).json({ message: "Reminder not found" });

    res.status(200).json({
      message: "Reminder deleted successfully",
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting reminder",
      error: error.message,
    });
  }
};
