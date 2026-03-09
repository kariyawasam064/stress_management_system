import mongoose from "mongoose"

const Schema = mongoose.Schema;

const SavedTimetable = new Schema({
    per_subject_sessions: {
        type: Object,
        required: true
    },
    owner_email: {
        type: String,
        required: true
    },
    schedule: [
        {
            date: {
                type: String,
                required: true,
            },
            end_time: {
                type: String,
            },
            lecture_name: {
                type: String,
            },
            module_name: {
                type: String,
                required: true,
            },
            priority: {
                type: String,
            },
            start_time: {
                type: String,
            },
            subject_id: {
                type: String,
            },
        },
    ],
});

export default mongoose.model("savedtimetables", SavedTimetable);