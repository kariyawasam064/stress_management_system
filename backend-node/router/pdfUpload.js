import express from "express";
import multer from "multer";
import fs from "fs";
import { createRequire } from "module";
import Lecture from "../model/Lecture.js";

const require = createRequire(import.meta.url);

// Load pdf-parse (CommonJS)
const pdfModule = require("pdf-parse");

// Normalize export (works for both forms)
const pdf = typeof pdfModule === "function" ? pdfModule : pdfModule.default;

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload-pdf", upload.single("file"), async (req, res) => {
  try {
    const dataBuffer = fs.readFileSync(req.file.path);

    // Now this will work
    const data = await pdf(dataBuffer);

    const text = data.text;

    const rows = text.split("\n").filter(r => r.trim() !== "");

    const lectures = {};

    rows.slice(1).forEach(row => {
      const columns = row.split(/\s{2,}/);

      const subject = columns[0];
      const lecturer = columns[1];
      const priority = columns[2];
      const note = columns[3];
      const moduleTitle = columns[4];
      const moduleLink = columns[5];

      if (!lectures[subject]) {
        lectures[subject] = {
          module_name: subject,
          lecture_name: lecturer,
          priority: priority,
          description: note,
          user_email: req.body.user_email,
          module: []
        };
      }

      lectures[subject].module.push({
        title: moduleTitle,
        link: moduleLink,
        status: "pending"
      });
    });

    const lectureArray = Object.values(lectures);

    for (const lec of lectureArray) {
      await new Lecture(lec).save();
    }

    fs.unlinkSync(req.file.path);

    res.json({
      message: "PDF processed successfully",
      count: lectureArray.length
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "PDF processing failed" });
  }
});

export default router;