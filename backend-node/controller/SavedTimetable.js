import SavedTimetable from '../model/SavedTimetable.js'

export const AddTimeTable = async (req, res) => {

  try {
    const email = req.body.owner_email;

    // 1️⃣ Delete existing timetables for this email
    await SavedTimetable.deleteMany({ owner_email: email });

    // 2️⃣ Create new timetable
    const newVol = new SavedTimetable({
      per_subject_sessions: req.body.per_subject_sessions,
      owner_email: email,
      schedule: req.body.schedule
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


export const GetMyTimetabel = async (req, res) => {
  try {
    const { user_email } = req.params; 
    console.log(user_email)

    const lectures = await SavedTimetable.find({ owner_email:user_email });

    if (lectures.length === 0) {
      return res.status(404).json({
        message: "No lectures found for this email.",
      });
    }
    res.status(200).json(lectures[0]);
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong while fetching lectures.",
      error,
    });
  }
};