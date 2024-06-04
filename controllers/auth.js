const User = require("../models/user.schema");
const jwt = require("jsonwebtoken");
const statusCodes = require("../services/statusCodes");
const { sendResponse } = require("../services/handlingResponse");
const fs = require("fs");
const { uploadToCloudinary } = require("../utils/uploadMedia");
const bcrypt = require("bcrypt");
const { sendEmail } = require("../utils/mailSend");
const Otp = require("../models/otp.schema");

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
      otp: result,
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
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in sending otp to the user email",
      error: error.message,
    });
  }
};

// signup
exports.signup = async (req, res) => {
  try {
    const { name, username, password, email, otp } = req.body;
    const profilePicture = req.file;

    // Validation
    if (!email || !password || !username || !name || !profilePicture || !otp) {
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

    if (otp !== recentOtp) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(sendResponse(false, "OTP NOT MATCHED"));
    }
    let profilePictureURL;
    if (profilePicture) {
      const image = await uploadToCloudinary(profilePicture);
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
      profilePicture: profilePictureURL,
    });

    await Otp.deleteMany({ email });

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
    const { username, password } = req.body;
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
    res
      .cookie("token", token, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true })
      .json(sendResponse(true, "SUCCESSFULLY LOGGED IN", user));
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
    console.log(token);

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

    const user = await User.findById(id).select("-password");
    if (!user) {
      res.status(statusCodes.NOT_FOUND).json(false, "USER NOT FOUND");
    }

    res.json(sendResponse(true, "USER SUCCESSFULLY FETCHED", user));
  } catch (error) {
    res.json(sendResponse(false, error.message));
  }
};

// get users
exports.fetchUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    if (!users) {
      res.status(statusCodes.NOT_FOUND).json(false, "USERS NOT FOUND");
    }

    res.json(sendResponse(true, "USERS SUCCESSFULLY FETCHED", users));
  } catch (error) {
    res.json(sendResponse(false, error.message));
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    // Fetch Data
    const userId = req.user._id;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword || !userId) {
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
      return res.status(500).json({
        success: false,
        message: "PASSWORD NOT MATCHED",
      });
    }

    // Hashed Password
    const hashPass = await bcrypt.hash(newPassword, 10);
    user.password = hashPass;
    await user.save();

    // SEND EMAIL TO USER
    await sendEmail(user.email, "YOUR PASSWORD SUCCESSFULLY CHANGE");

    res.status(200).json({
      success: true,
      message: "SUCCESSFULLY PASSWORD CHANGE",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "ERROR IN PASSWORD CHANGE",
      error: error.message,
    });
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
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(500).json({
        success: false,
        message: "USER NOT FOUND",
      });
    }

    // GENERATE A TOKEN
    const token = crypto.randomBytes(20).toString("hex");
    user.resetToken = token;

    // CREATE A LINK FOR USER
    const link = `http://localhost:5173/resetPassword/ID${user._id}/${token}`;

    // SEND EMAIL TO THE USER
    await sendEmail(email, `<a href="${link}">CLICK TO THE LINK</a>`);

    res.status(200).json({
      success: true,
      message: "CHECK YOUR EMAIL AND CLICK ON THE LINK",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "ERROR IN GENERATE LINK",
    });
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    // Fetch Data
    const { token, userId, newPassword, confirmPassword } = req.body;

    if (!token || !userId || !newPassword || !confirmPassword) {
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
    const existUser = await User.findOne({ _id: userId });
    if (!existUser) {
      return res.status(404).json({
        success: false,
        message: "USER NOT FOUND",
      });
    }

    // VERIFY TOKEN
    if (token !== existUser.resetToken) {
      return res.status(500).json({
        success: false,
        message: "RESET TOKEN EXPIRED SO TRY TO GENERATE ANOTHER LINK",
      });
    }

    // Compare password
    const hashPassword = await bcrypt.hash(newPassword, 10);

    // Save this password in user database
    const updateData = await User.findByIdAndUpdate(
      userId,
      {
        password: hashPassword,
        resetToken: "",
      },
      { new: true }
    );

    // SEND EMAIL TO USER
    await sendMail(existUser.email, "YOUR PASSWORD SUCCESSFULLY RESET");

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
    if (!name || !username || !bio) {
      return res.status(404).json({
        success: false,
        message: "ALL FIELDS ARE MENDANTORY",
      });
    }

    const userdata = {
      name,
      username,
      bio,
      privacy,
    };

    if (req.file) {
      const file = await uploadToCloudinary(req.file.path);
      userdata.profilePicture = file.secure_url;
    }

    // Check user existence
    const user = await User.findByIdAndUpdate(
      userId,
      {
        ...userdata,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "USER NOT FOUND",
      });
    }

    res.status(200).json({
      success: true,
      message: "USER INFORMATION SUCCESSFULLY UPDATE",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "ERROR IN USER INFORMATION UPDATE PROCESS",
      error: error.message,
    });
  }
};
