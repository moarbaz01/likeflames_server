const bcrypt = require("bcrypt");
const User = require("../models/user.schema");
const jwt = require("jsonwebtoken");
const statusCodes = require("../services/status");
const { sendResponse } = require("../services/handlingResponse");

exports.signup = async (req, res) => {
  try {
    const { name, username, password, email, profilePicture } = req.body;

    // Validation
    if (!email || !password || !username || !name|| !profilePicture ) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(sendResponse(false, "ALL FIELDS ARE MENDENTORY"));
    }

    // Find user
    const isUser = await User.findOne({
      $or: [{ username: username }, { email: email }],
    });

    console.log(isUser)

    if (isUser) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(sendResponse(false, "ALREADY REGISTERED"));
    }

    console.log(req.file)
    // Create user
    const user = await User.create({
      name,
      username,
      password,
      email,
      profilePicture: "hi",
    });

    res.json({ success: true, user });
  } catch (error) {
    console.log(error)
    res
      .status(200)
      .json(sendResponse(false, error,));
  }
};
