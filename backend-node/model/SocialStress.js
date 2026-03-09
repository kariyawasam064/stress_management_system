import mongoose from "mongoose"

const Schema = mongoose.Schema;

const SocialStress = new Schema({
    user_email: {
        type: String,
        required: true
    },
    calls_incoming: {
        type: String,
        required: true
    },
    face_mood: {
        type: String,
        required: true
    },
    messages_received: {
        type: String,
        required: true
    },
    messages_sent: {
        type: String,
        required: true
    },
    sleep_hours: {
        type: String,
        required: true
    },
    predicted_label: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    probabilities: [
        {
            High: {
                type: String,
                required: true,
            },
            Low: {
                type: String,
            },
            Medium: {
                type: String,
            },
        },
    ],
}, { timestamps: true });

export default mongoose.model("Social_Stress", SocialStress);