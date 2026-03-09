import User from '../model/User.js';

export const UserRegistration = async (req, res) => {
    console.log(req.body)
    try {
        const ExsistUser = await User.findOne({ email: req.body.email });
        console.log(!ExsistUser)
        if (ExsistUser) {
            res.status(404).json({
                message: "User Already registered..!",

            })
        } else if (!ExsistUser) {
            const prefix = 'UID'
            const USER_ID = (prefix + Date.now())

            const newUser = new User({
                user_id: USER_ID,
                full_name: req.body.full_name,
                email: req.body.email,
                address: req.body.address,
                contact_no: req.body.contact_no,
                password: req.body.password
            });

            console.log(newUser);
            const newAcct = await newUser.save();
            if (newAcct) {
                res.status(201).json({
                    message: "Registration Sucessfull..!",
                    payload: newAcct
                })
            } else {

                res.status(400).json({
                    message: "Somthing Went Wrong In Account Creating..!"
                })
            }
        }
    } catch (error) {
        res.status(500).json({
            message: "Somthing Went Wrong..!",
            error: error
        })
    }
}


export const Signin = async (req, res) => {
    try {
        const RegisterdUser = await User.findOne({ email: req.body.email });
        console.log(req.body)
        console.log(RegisterdUser)
        if (RegisterdUser) {
            const enterdPwd = req.body.password;
            const dbPwd = RegisterdUser.password;
            const uid = RegisterdUser._id;
            //console.log(enterdPwd,dbPwd);
            console.log(uid);
            if (enterdPwd === dbPwd) {
                res.status(201).json({
                    RegisterdUser
                })
            } else {
                res.status(401).json({
                    message: "Incorrect Password..!"
                })
            }
        } else {
            res.status(404).json({
                message: "User Not Registered..!"
            })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Server error..!",
            error: error
        })
    }
}





// export const Signout = (req, res) => {
//   try {
//     const refreshToken = req.body.refreshToken;
//     refreshtokens = refreshtokens.filter(token => token !== refreshToken);
//     res.status(200).json({
//       message: "Signout successful!",
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Something went wrong!",
//       error: error,
//     });
//   }
// }

export const getAllUsers = async (req, res) => {
  try {
    const allusers = await User.find();
    if (allusers) {
      res.status(200).json(allusers)
    }
  }catch(error){
    console.log(error)
  }
}

// export const getOneUser = async (req, res) => {
//   try {
//     let userId = req.params.user_id;
//     const user = await User.findById(userId);
//     if (user) {
//       res.status(200).json({user
//       })
//     }
//   }catch(error){
//     console.log(error)
//   }
// }