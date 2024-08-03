const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
    },
    profilePicture: {
      type: String,
    },
    accessToken: {
      type: String,
      unique: true,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    accountType: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    privacy: {
      type: String,
      enum: ["public", "private", "suspend"],
      default: "public",
    },

    chats: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
      },
    ],
    notifications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Notifications",
      },
    ],
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    blockedByUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    savedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],

    lastSeen: {
      type: Date,
      default: new Date(),
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
    resetToken: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.index({ resetToken: 1 }, { expireAfterSeconds: 5 * 60 * 1000 });

// Methods
userSchema.methods.comparePassword = async function (password) {
  const bcrypt = require("bcrypt");
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
