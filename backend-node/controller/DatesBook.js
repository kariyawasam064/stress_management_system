import DateBook from '../model/DatesBook.js'

export const AddDateBook = async (req, res) => {
 try{      
      const newVol = new DateBook({
        date: req.body.date,
        reason: req.body.reason,
        time: req.body.time,
        email: req.body.email
      });

      const newV = await newVol.save();
      console.log(newVol);
      if (newV) {
      
        res.status(201).json({
          message: "Book Created Sucessfull..!",
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


export const GetDatesByEmail = async (req, res) => {
  try {
    const { email } = req.params; 

    const lectures = await DateBook.find({ email });

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