const User = require("../models/user.schema");
const jwt = require("jsonwebtoken");
const statusCodes = require("../services/status");
const { sendResponse } = require("../services/handlingResponse");
const fs = require("fs");
const uploadToCloudinary = require("../utils/uploadMedia");

const generateAccessToken = (payload) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET);
  return token;
};

exports.signup = async (req, res) => {
  try {
    const { name, username, password, email } = req.body;
    const profilePicture = req.file;

    // Validation
    if (!email || !password || !username || !name || !profilePicture) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(sendResponse(false, "ALL FIELDS ARE MENDENTORY"));
    }

    // Find user
    const isUser = await User.findOne({
      $or: [{ username: username }, { email: email }],
    });

    if (isUser) {
      if (isUser.username === username) {
        return res
          .status(statusCodes.BAD_REQUEST)
          .json(sendResponse(false, "USERNAME SHOULD BE UNIQUE"));
      } else {
        return res
          .status(statusCodes.BAD_REQUEST)
          .json(sendResponse(false, "ALREADY REGISTERED"));
      }
    }

    let profilePictureURL;
    if (profilePicture) {
      const image = await uploadToCloudinary(profilePicture);
      profilePictureURL = image.secure_url;
      fs.unlinkSync(req.file.path);
    }
    // Create user
    const user = await User.create({
      name,
      username,
      password,
      email,
      profilePicture: profilePictureURL,
    });

    res.json({ success: true, user });
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(sendResponse(false, error.message));
  }
};

// login
exports.login = async (req, res) => {
  try {
    const {username, password} = req.body;
    if (!username || !password) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(sendResponse(false, "ALL FIELDS ARE MENDENTORY"));
    }

    const user = await User.findOne({
      $or: [{ username: username }, { email: username }],
    });

    if (!user) {
      return res
        .status(statusCodes.UNAUTHORIZED)
        .json(sendResponse(false, "YOU ARE NOT A REGISTERED USER"));
    }

    const comparePassword = await user.methods.comparePassword(password);
    if (!comparePassword) {
      return res
        .status(statusCodes.UNAUTHORIZED)
        .json(sendResponse(false, "PASSWORD NOT MATCHED"));
    }

    const payload = {
      _id: user._id,
      role: user.accountType,
    };

    const token = generateAccessToken(payload);
    user.accessToken = token;
    res
      .cookie("token", token, { maxAge: "1d" })
      .json(sendResponse(true, "SUCCESSFULLY LOGGED IN", user));
  } catch (error) {
    console.log(error);
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(sendResponse(false, error.message));
  }
};
