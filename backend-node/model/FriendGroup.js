import mongoose from "mongoose"

const Schema = mongoose.Schema;

const FriendGroup = new Schema({
    sender: {
        type: String,
        required: true
    },
    receiver: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    sender_fullname: {
        type: String,
        required: true
    },
    receiver_fullname: {
        type: String,
        required: true
    },
});

export default mongoose.model("friendgroups", FriendGroup);