const mongoose = require("mongoose");

const notificationsSchema = new mongoose.Schema(
  {
    info: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["like", "comment", "request", "post", "follow"],
      required: true,
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    link: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notifications", notificationsSchema);
