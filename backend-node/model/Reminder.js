import mongoose from "mongoose";
import TransactionReminderFrequency from "../enum/TransactionReminderFrequency.js";
import TransactionReminderStatus from "../enum/TransactionReminderStatus.js";

const Schema = mongoose.Schema;

const reminderSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    dueDate: {
      type: Date,
      required: true,
    },
    frequency: {
      type: String,
      enum: Object.values(TransactionReminderFrequency),
      default: "once",
    },
    status: {
      type: String,
      enum: Object.values(TransactionReminderStatus),
      default: "pending",
    },
    email: {
      type: String,
      required: true,
    },
    pushToken: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("reminders", reminderSchema);
