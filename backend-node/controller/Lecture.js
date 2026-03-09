import Lecture from '../model/Lecture.js'

export const AddLecture = async (req, res) => {
  console.log(req.body)
  try {
    const newVol = new Lecture({
      module_name: req.body.title,
      lecture_name: req.body.lecturer,
      priority: req.body.priority,
      description: req.body.description,
      user_email: req.body.user_email,
      module: req.body.module,
    });

    const newV = await newVol.save();
    console.log(newVol);
    if (newV) {

      res.status(201).json({
        message: "New Lecture Created Sucessfull..!",
        payload: newV
      })
    } else {

      res.status(400).json({
        message: "Somthing Went Wrong In Post Creating..!"
      })
    }
  } catch (error) {
    res.status(500).json({
      message: "Somthing Went Wrong..!",
      error: error
    })
  }
}

export const GetLecturesByEmail = async (req, res) => {
  try {
    const { user_email } = req.params;

    const lectures = await Lecture.find({ user_email });

    if (lectures.length === 0) {
      return res.status(404).json({
        message: "No lectures found for this email.",
      });
    }
    res.status(200).json(lectures);
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong while fetching lectures.",
      error,
    });
  }
};

export const createBulkLec = async (req, res) => {
  try {

    const lectures = req.body.lectures;
    console.log('hi')
    console.log(lectures)

    if (!lectures || lectures.length === 0) {
      return res.status(400).json({
        message: "No lectures provided"
      });
    }

    const savedLectures = await Lecture.insertMany(lectures);

    res.status(201).json({
      message: "Lectures saved successfully",
      count: savedLectures.length
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Bulk insert failed",
      error: err.message
    });
  }
};