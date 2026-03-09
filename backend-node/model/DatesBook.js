import mongoose from "mongoose"

const Schema = mongoose.Schema;

const dateSchema = new Schema({
    date: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    }
});

export default mongoose.model("dates", dateSchema);