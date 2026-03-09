import mongoose from "mongoose"

const Schema = mongoose.Schema;

const userSchema = new Schema({
    user_id: {
        type: String,
        required: true
    },
    full_name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    contact_no: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

export default mongoose.model("users",userSchema);