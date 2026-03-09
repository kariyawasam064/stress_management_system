import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";

const app = express();
const PORT = process.env.PORT || 5000;

dotenv.config();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

const URL = process.env.MONGO_DB;

mongoose.connect(URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.listen(PORT, () => {
  console.log("***************************************");
  console.log(`Server Running on port number : ${PORT}`);
});

const connection = mongoose.connection;
connection.once("open", () => {
  console.log("MONGO_DB Connection successfull......!!");
  console.log("***************************************");
});


import User from "./router/User.js";
app.use("/user", User);
import Lecture from "./router/Lecture.js";
app.use("/lecture", Lecture);
import DatesBook from "./router/DatesBook.js";
app.use("/date", DatesBook);
import FreindGroup from "./router/FriendGroup.js";
app.use("/friend", FreindGroup);
import SavedTimetable from "./router/SavedTimetable.js";
app.use("/timetable", SavedTimetable);
import SocialStress from "./router/SocialStress.js";
app.use("/soical", SocialStress);
import NotifyFriend from "./router/NotifyFriend.js";
app.use("/notify", NotifyFriend);
import pdfRoute from "./router/pdfUpload.js";
app.use("/pdf", pdfRoute);

// Financial Route
import AddIncome from "./router/AddIncome.js";
app.use("/transaction", AddIncome);
import SavingPlan from "./router/SavingPlan.js";
app.use("/saving", SavingPlan);
import Reminder from "./router/Reminder.js";
app.use("/reminder", Reminder);