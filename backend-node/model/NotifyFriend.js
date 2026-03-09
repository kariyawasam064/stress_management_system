import mongoose from "mongoose"

const Schema = mongoose.Schema;

const NotifyFriends = new Schema({
    suffer_email: {
        type: String,
        required: true
    },
    level: {
        type: String,
        required: true
    },
});

export default mongoose.model("Notify_Friends", NotifyFriends);