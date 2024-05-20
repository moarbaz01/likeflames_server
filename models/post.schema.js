const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    files: [
        {
            type: String
        }
    ],
    fileType: {
        type: String,
        enum: ['image', 'video'],
        required: true
    },
    tags: [
        {
            type: String
        }
    ],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment'
        }
    ],
    privacy: {
        type: String,
        enum: ['public', 'private', 'suspend'],
        default: 'public'
    },
    shares: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    views: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],

}, { timestamps: true });

// Methods

module.exports = mongoose.model('Post', postSchema);

