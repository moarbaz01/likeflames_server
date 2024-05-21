const mongoose = require('mongoose');

const chatSchema =  new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    type: {
        type: String,
        enum: ["file", "image", "video", "text", "audio", "videoCall", "audioCall"]
    },
    urls: [
        {
            type: String
        }
    ],
    message: {
        type: String,
    },

    isRead: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    isDeletedAll: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });


module.exports = mongoose.model('Chat', chatSchema);