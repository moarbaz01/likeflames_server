const mongoose = require('mongoose');


const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    comment: {
        type: String,
    },
    gif: {
        type: String
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    },
    reply: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ],
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ]
}, { timestamps: true });


module.exports = mongoose.model('Comment', commentSchema);