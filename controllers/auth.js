const User = require("../models/user.schema");
const jwt = require("jsonwebtoken");
const statusCodes = require("../services/statusCodes");
const { sendResponse } = require("../services/handlingResponse");
const fs = require("fs");
const { uploadToCloudinary } = require("../utils/uploadMedia");
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const { sendEmail } = require("../utils/mailSend");
const Otp = require("../models/otp.schema");
const ResetToken = require("../models/reset_token.schema");
const crypto = require("crypto");
const Notifications = require("../models/notifications.schema");

const generateAccessToken = (payload) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET);
  return token;
};

const decodeToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Send OTP handler
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }
    // Check is user exist or not
    const user = await User.findOne({ email });
    if (user) {
      return res.status(500).json({
        success: false,
        message: "User already registered",
      });
    }

    let result;
    let checkOTP;
    do {
      result = otpGenerator.generate(4, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      checkOTP = await Otp.findOne({ otp: result });
    } while (checkOTP);

    // Now send this 4 DIGIT OTP to the user email
    await Otp.create({
      email,
      otp: parseInt(result),
    });

    // Send otp email
    const subject = "OTP for Registration";
    const html = `<h3>Your OTP for registration is ${result}
    </h3>
    <p>Please do not share this OTP with anyone.</p>`;
    await sendEmail(email, subject, html);

    res.status(200).json({
      success: true,
      message: "OTP Successfully sent to the user",
      otp: parseInt(result),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in sending otp to the user email",
      error: error,
    });
  }
};

// signup
exports.signup = async (req, res) => {
  try {
    const { name, username, password, email, otp } = req.body;
    console.log(req.body);

    // Validation
    if (!email || !password || !username || !name || !otp) {
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

    const recentOtp = await Otp.findOne({ email })
      .sort({ createdAt: -1 })
      .limit(1);

    if (!recentOtp) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(sendResponse(false, "SEND OTP FIRST"));
    }

    console.log("My otp : ", otp, "DB OTP :", recentOtp);
    if (otp !== recentOtp.otp) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(sendResponse(false, "OTP NOT MATCHED"));
    }
    let profilePictureURL;
    if (req.file) {
      const image = await uploadToCloudinary(req.file);
      profilePictureURL = image.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Create user
    const user = await User.create({
      name,
      username,
      password: hashedPassword,
      email,
      profilePicture: profilePictureURL || "",
    });

    await Otp.deleteMany({ email });

    res.json(sendResponse(true, "SUCCESSFULLY REGISTERED", user, "user"));
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(sendResponse(false, error.message));
  }
};

// login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(req.body);
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

    const comparePassword = await user.comparePassword(password);
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
    await user.save();

    res
      .cookie("token", token, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true })
      .json(sendResponse(true, "SUCCESSFULLY LOGGED IN", user, "user"));
  } catch (error) {
    console.log(error);
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(sendResponse(false, error.message));
  }
};

// logout
exports.logout = async (req, res) => {
  try {
    const token =
      req.headers.authorization?.replace("Bearer ", "") || req.cookies.token;

    if (!token) {
      res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "TOKEN NOT FOUND"));
    }
    const decode = decodeToken(token);
    if (!decode) {
      res
        .status(statusCodes.UNAUTHORIZED)
        .json(sendResponse(false, "TOKEN EXPIRED OR LOGIN EXPIRED"));
    }
    const user = await User.findById(decode._id);
    if (!user) {
      res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "USER NOT FOUND"));
    }

    user.accessToken = "";
    await user.save();

    res
      .clearCookie("token")
      .json(sendResponse(true, "USER SUCCESSFULLY LOGGED OUT"));
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(sendResponse(false, error.message));
  }
};

// get user
exports.fetchUser = async (req, res) => {
  try {
    const id = req.user._id;
    if (!id) {
      res.status(statusCodes.NOT_FOUND).json(false, "USER DETAILS NOT FOUND");
    }

    const user = await User.findById(id)
      .populate({
        path: "notifications",
        populate: {
          path: "from to",
        },
      })
      .populate({
        path: "posts",
        populate: {
          path: "author",
        },
      })
      .populate({
        path: "comments",
        populate: {
          path: "author",
        },
      });
    if (!user) {
      res.status(statusCodes.NOT_FOUND).json(false, "USER NOT FOUND");
    }

    res.json(sendResponse(true, "USER SUCCESSFULLY FETCHED", user, "user"));
  } catch (error) {
    res.json(sendResponse(false, error.message));
  }
};

// get user
exports.fetchUserById = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      res.status(statusCodes.NOT_FOUND).json(false, "USER DETAILS NOT FOUND");
    }

    const user = await User.findById(id)
      .populate({
        path: "posts",
        populate: {
          path: "author",
        },
      })
      .populate({
        path: "notifications",
        populate: {
          path: "from to",
        },
      })
      .populate({
        path: "comments",
        populate: {
          path: "author",
        },
      });

    if (!user) {
      res.status(statusCodes.NOT_FOUND).json(false, "USER NOT FOUND");
    }

    res.json(sendResponse(true, "USER SUCCESSFULLY FETCHED", user, "user"));
  } catch (error) {
    res.json(sendResponse(false, error.message));
  }
};

// get users
exports.fetchUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate({
        path: "posts",
        populate: {
          path: "author",
        },
      })
      .populate({
        path: "notifications",
        populate: {
          path: "from to",
        },
      })
      .populate({
        path: "comments",
        populate: {
          path: "author",
        },
      })
      .populate({
        path: "followers following",
      });
    if (!users) {
      res.status(statusCodes.NOT_FOUND).json(false, "USERS NOT FOUND");
    }
    ``;
    res.json(sendResponse(true, "USERS SUCCESSFULLY FETCHED", users, "users"));
  } catch (error) {
    res.json(sendResponse(false, error.message));
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    // Fetch Data
    const userId = req.user._id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword || !userId) {
      return res.status(500).json({
        success: false,
        message: "ALL FIELDS ARE MENDANTORY",
      });
    }

    // Check is user available or not
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "USER NOT FOUND",
      });
    }

    // Compare password
    const comparePassword = await user.comparePassword(oldPassword);
    if (!comparePassword) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(sendResponse(false, "OLD PASSWORD NOT MATCHED"));
    }

    // If New Password same as previous
    if (oldPassword === newPassword) {
      return res.status(500).json({
        success: false,
        message: "NEW PASSWORD SHOULD NOT BE SAME AS OLD PASSWORD",
      });
    }

    // Hashed Password
    const hashPass = await bcrypt.hash(newPassword, 10);
    user.password = hashPass;
    await user.save();

    // SEND EMAIL TO USER
    await sendEmail(user.email, "YOUR PASSWORD SUCCESSFULLY CHANGE");

    res
      .status(200)
      .json(sendResponse(true, "YOUR PASSWORD SUCCESSFULLY CHANGE"));
  } catch (error) {
    res.status(500).json((false, "ERROR IN PASSWORD CHANGE"));
  }
};

// GENERATE RESET TOKEN
exports.generateResetToken = async (req, res) => {
  try {
    // FETCH USER EMAIL
    const { email } = req.body;

    // EMAIL VALIDATION
    if (!email) {
      return res.status(500).json({
        success: false,
        message: "EMAIL NOT FOUND",
      });
    }

    // CHECK USER EXISTENCE
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(500).json({
        success: false,
        message: "USER NOT FOUND",
      });
    }

    // GENERATE A TOKEN
    const token = crypto.randomBytes(20).toString("hex");
    // CREATE A LINK FOR USER
    const link = `http://localhost:5173/resetpassword?id=${user._id}&token=${token}`;
    // SEND EMAIL TO THE USER
    await sendEmail(
      email,
      "RESET PASSWORD",
      `<a href="${link}">CLICK TO THE LINK</a>`
    );

    await ResetToken.create({
      email,
      token,
    });

    res.status(200).json({
      success: true,
      message: "CHECK YOUR EMAIL AND CLICK ON THE LINK",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "ERROR IN GENERATE LINK",
      error: error.message,
    });
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    // Fetch Data
    const { token, id, newPassword, confirmPassword } = req.body;
    console.log(req.body);

    if (!newPassword || !confirmPassword) {
      return res.status(500).json({
        success: false,
        message: "ALL FIELDS ARE MENDANTORY",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(500).json({
        success: false,
        message: "CONFIRM PASSWORD AND NEW PASSWORD NOT MATCHED",
      });
    }

    // Check is user available or not
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "USER NOT FOUND",
      });
    }

    const recentToken = await ResetToken.findOne({ email: user.email })
      .sort({ createdAt: -1 })
      .limit(1);

    // VERIFY TOKEN
    if (!recentToken || recentToken.token !== token) {
      return res.status(500).json({
        success: false,
        message: "TOKEN EXPIRED SO TRY TO GENERATE ANOTHER LINK",
      });
    }
    // Compare password
    const hashPassword = await bcrypt.hash(newPassword, 10);

    // Save this password in user database
    user.password = hashPassword;
    await user.save();

    // SEND EMAIL TO USER
    await sendEmail(
      user.email,
      "RESET PASSWORD",
      "YOUR PASSWORD SUCCESSFULLY RESET"
    );

    await ResetToken.deleteMany({ email: user.email });

    res.status(200).json({
      success: true,
      message: "SUCCESSFULLY PASSWORD RESET",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "ERROR IN PASSWORD RESET PROCESS",
      error: error.message,
    });
  }
};

// Update Profile
exports.updateInformation = async (req, res) => {
  try {
    // FETCH USER DATA
    const userId = req.user._id;
    const { name, username, bio, privacy } = req.body;

    const checkUser = await User.findById(userId);
    if (!checkUser) {
      return res.status(404).json({
        success: false,
        message: "USER NOT FOUND",
      });
    }

    if (username) {
      const checkUsername = await User.findOne({ username });
      if (checkUsername) {
        return res
          .status(500)
          .json(sendResponse(false, "USERNAME ALREADY TAKEN BY ANOTHER"));
      }
    }

    const userdata = {
      name,
      username,
      bio,
      privacy,
    };

    if (req.file) {
      const file = await uploadToCloudinary(req.file);
      userdata.profilePicture = file.secure_url;
    }

    console.log(req.file);
    console.log("Bdy", req.body);

    // Check user existence
    const user = await User.findByIdAndUpdate(
      userId,
      {
        ...userdata,
      },
      { new: true }
    );

    res
      .status(200)
      .json(
        sendResponse(true, "USER INFORMATION SUCCESSFULLY UPDATE", user, "user")
      );
  } catch (error) {
    res.status(500).json(sendResponse(false, error.message));
  }
};

exports.followAndUnfollow = async (req, res) => {
  try {
    const id = req.user._id;
    const { to } = req.body;

    const sender = await User.findById(id);
    if (!sender)
      res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "SENDER | USER NOT FOUND "));

    const receiver = await User.findById(to).populate({
      path: "notifications",
    });
    if (!receiver)
      res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "USER NOT FOUND "));

    const isFollowed = sender.following.some((f) => f._id.toString() === to);

    if (isFollowed) {
      sender.following.pull(to);
      receiver.followers.pull(id);
      await sender.save();
      await receiver.save();
      return res.json(sendResponse(true, "UNFOLLOWED"));
    } else {
      sender.following.push(to);
      receiver.followers.push(id);
      await sender.save();
      await receiver.save();
      return res.json(sendResponse(true, "FOLLOWED"));
    }
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(sendResponse(false, error.message));
  }
};

exports.acceptAndRejectFollowingRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationId, action } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "USER NOT FOUND"));
    }

    const notification = await Notifications.findById(notificationId);
    if (!notification) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "NOTIFICATION NOT FOUND"));
    }

    if (notification.type !== "request") {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(sendResponse(false, "INVALID REQUEST"));
    }

    const { from, to } = notification;
    if (to.toString() !== userId.toString()) {
      return res
        .status(statusCodes.UNAUTHORIZED)
        .json(sendResponse(false, "YOU ARE NOT AUTHORIZED TO DO THIS"));
    }

    const requestSender = await User.findById(from);
    if (!requestSender) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "REQUEST SENDER NOT FOUND"));
    }

    const isFollowed = user.followers.some(
      (follower) => follower.toString() === from.toString()
    );

    if (isFollowed) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(
          sendResponse(false, "USER ALREADY EXISTS IN YOUR FOLLOWERS LIST")
        );
    }

    if (action === "accept") {
      user.followers.push(requestSender._id);
      requestSender.following.push(user._id);
      await user.notifications.pull(notification._id);
      await user.save();
      await requestSender.save();
      await Notifications.findByIdAndDelete(notification._id);
      return res.json(sendResponse(true, "ACCEPTED"));
    } else if (action === "reject") {
      await user.notifications.pull(notification._id);
      await user.save();
      await Notifications.findByIdAndDelete(notification._id);
      return res.json(sendResponse(true, "REJECTED"));
    } else {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(sendResponse(false, "INVALID ACTION"));
    }
  } catch (error) {
    return res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(sendResponse(false, error.message));
  }
};

// exports.deleteAccount = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const user = await User.findByIdAndUpdate(userId, {
//       isDeleted: true,
//     });
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "USER NOT FOUND",
//       });
//     }
//     res.clearCookie("token");
//     res.status(200).json({
//       success: true,
//       message: "USER SUCCESSFULLY DELETED",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "ERROR IN USER DELETION PROCESS",
//       error: error.message,
//     });
//   }
// };
