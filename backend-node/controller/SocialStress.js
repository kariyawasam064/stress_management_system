import SocialStress from '../model/SocialStress.js'
import moment from "moment";
import axios from "axios";


export const AddSocialStress = async (req, res) => {

    try {
        const email = req.body.user_email;
        const dateOnly = new Date(req.body.date);
        const startOfDay = new Date(dateOnly.setHours(0, 0, 0, 0));
        const endOfDay = new Date(dateOnly.setHours(23, 59, 59, 999));


        // 1️⃣ Delete existing timetables for this email
        await SocialStress.deleteMany({ user_email: email, date: { $gte: startOfDay, $lte: endOfDay } });

        // 2️⃣ Create new timetable
        const newVol = new SocialStress({
            user_email: req.body.user_email,
            calls_incoming: req.body.calls_incoming,
            face_mood: req.body.face_mood,
            messages_received: req.body.messages_received,
            messages_sent: req.body.messages_sent,
            sleep_hours: req.body.sleep_hours,
            predicted_label: req.body.predicted_label,
            date: req.body.date,
            probabilities: req.body.probabilities
        });

        const newV = await newVol.save();

        if (newV) {
            res.status(201).json({
                message: "New Lecture Created Successfully!",
                payload: newV
            });
        } else {
            res.status(400).json({
                message: "Something Went Wrong While Creating!"
            });
        }

    } catch (error) {
        res.status(500).json({
            message: "Something Went Wrong!",
            error: error.message
        });
    }
};

export const GetMyLastValues = async (req, res) => {
    try {
        const { user_email } = req.params;

        const data = await SocialStress.find({
            user_email,
        }).sort({ date: -1 });

        res.status(200).json({
            data
        });

    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({
            message: "Something went wrong while fetching data.",
            error: error.message,
        });
    }
};



export const getVideosByStress = async (req, res) => {
  try {
    const { user_email } = req.params;

    // 1. Get last stress prediction for this user
    const record = await SocialStress.findOne({ user_email })
      .sort({ date: -1 })
      .lean();

    if (!record) {
      return res.status(404).json({ message: "No stress record found" });
    }

    // 2. Extract stress level
    const stressLevel = record.predicted_label; // "Low", "Medium", "High"
    console.log("Detected stress level:", stressLevel);

    // 3. Map to correct YouTube search query
    const queryMap = {
      Low: "relaxing music meditation stress relief",
      Medium: "mindfulness stress management techniques",
      High: "quick stress relief exercises deep breathing",
    };

    const query = queryMap[stressLevel] || "stress relief";

    // 4. Fetch videos from YouTube API
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "Missing YouTube API Key" });
    }

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(
      query
    )}&key=${apiKey}&type=video`;

    const response = await axios.get(url);

    const videos = response.data.items.map((item) => ({
      title: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail: item.snippet.thumbnails.medium.url,
    }));

    res.status(200).json({
      stressLevel,
      videos,
    });
  } catch (error) {
    console.error("Video Fetch Error:", error);
    res.status(500).json({
      message: "Error fetching stress-based videos",
      error: error.message,
    });
  }
};
