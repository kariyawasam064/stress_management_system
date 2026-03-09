import FriendGroup from '../model/FriendGroup.js'
import User from '../model/User.js';

export const AddRequest = async (req, res) => {
  console.log(req.body)
  try {
    const newVol = new FriendGroup({
      sender: req.body.sender,
      receiver: req.body.receiver,
      status: req.body.status,
      sender_fullname: req.body.sender_fullname,
      receiver_fullname: req.body.receiver_fullname,
    });

    const newV = await newVol.save();
    console.log(newVol);
    if (newV) {

      res.status(201).json({
        message: "New Friend Created Sucessfull..!",
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

export const GetAllMySentRequest = async (req, res) => {
  try {
    const { user_email } = req.params;

    console.log(user_email)

    const lectures = await FriendGroup.find();

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

export const GetAllMyGotRequest = async (req, res) => {
  try {
    const { user_email } = req.params;

    console.log(user_email)

    const lectures = await FriendGroup.find({ receiver: user_email });

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

export const RemovedRequest = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(id)

    const lectures = await FriendGroup.deleteOne({ _id: id });

    if (lectures.length === 0) {
      return res.status(404).json({
        message: "No lectures found for this email.",
      });
    }
    res.status(200).json({ message: "Done" });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong while fetching lectures.",
      error,
    });
  }
};

export const AcceptRequest = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(id)

    const lectures = await FriendGroup.updateOne(
      { _id: id },       // Filter
      { $set: { status: "Connected" } }  // Update fields
    );

    if (lectures.length === 0) {
      return res.status(404).json({
        message: "No lectures found for this email.",
      });
    }
    res.status(200).json({ message: "Done" });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong while fetching lectures.",
      error,
    });
  }
};