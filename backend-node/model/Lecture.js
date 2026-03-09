import mongoose from "mongoose"

const Schema = mongoose.Schema;

const lectureSchema = new Schema({
    module_name: {
        type: String,
        required: true
    },
    lecture_name: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    user_email: {
        type: String,
        required: true
    },
    module: [
        {
            title: {
                type: String,
                required: true,
            },
            link: {
                type: String,
            },
            status: {
                type: String,
            },
        },
    ],
});

export default mongoose.model("lectures", lectureSchema);