import mongoose from "mongoose";
import TransactionType from "../enum/TransactionType.js";

const Schema = mongoose.Schema;

const incomeSchema = new Schema({
  date: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: Object.values(TransactionType),
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  amount: {
    type: String,
    required: true,
  },
  note: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
});

export default mongoose.model("transactions", incomeSchema);
