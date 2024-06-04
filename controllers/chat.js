const Chat = require("../models/chat.schema");
const User = require("../models/user.schema");
const { sendResponse } = require("../services/handlingResponse");
const statusCodes = require("../services/statusCodes");

exports.send = async (req, res) => {
  try {
    const from = req.user._id;
    const { type, to, message } = req.body;

    const sender = await User.findById(from);
    if (!sender) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "Sender not found"));
    }

    const receiver = await User.findById(to);
    if (!receiver) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "Receiver not found"));
    }

    let filesURLS = [];
    if (req.files && req.files.length > 0) {
      // Upload files
      const uploadPromises = req.files.map(async (element) => {
        const f = await uploadToCloudinary(element);
        return f.secure_url;
      });

      // Wait for all uploads to complete
      filesURLS = await Promise.all(uploadPromises);
    }

    // Create chat
    const chat = await Chat.create({
      message,
      from,
      to,
      type,
      files: filesURLS,
    });

    // Push chat to sender and receiver
    sender.chats.push(chat._id);
    await sender.save();
    receiver.chats.push(chat._id);
    await receiver.save();

    res.json(sendResponse(true, "CHAT SUCCESSFULLY CREATED", chat));
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

exports.getAll = async (req, res) => {
  try {
    const chats = await Chat.find().populate("from").populate("to");
    res.json(sendResponse(true, "CHATS FOUND", chats));
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Delete Chat
exports.deleteByAll = async (req, res) => {
  try {
    const { id } = req.params;
    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    chat.isDeletedAll = true;
    await chat.save();
    res.json(sendResponse(true, "CHAT DELETED BY ALL", chat));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteByOneSide = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const chat = await Chat.findById(id);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.chats.pull(chat._id);
    await user.save();

    res.json(sendResponse(true, "CHAT SUCCESSFULLY DELETED BY ONE SIDE"));
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(sendResponse(false, "CHAT SUCCESSFULLY DELETED BY ONE SIDE"));
  }
};
