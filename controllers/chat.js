const Chat = require("../models/chat.schema");
const User = require("../models/user.schema");
const { sendResponse } = require("../services/handlingResponse");
const statusCodes = require("../services/statusCodes");
const {
  uploadToCloudinary,
  removeFromCloudinary,
} = require("../utils/uploadMedia");

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

    // Get Reciever
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

    res.json(sendResponse(true, "CHAT SUCCESSFULLY CREATED", chat, "chat"));
  } catch (error) {
    console.log(error);
    res.status(500).json(sendResponse(false, error.message));
  }
};

exports.getAll = async (req, res) => {
  try {
    const chats = await Chat.find().populate("from").populate("to");
    res.json(sendResponse(true, "CHATS FOUND", chats, "chats"));
  } catch (error) {
    console.log(error);
    res.status(500).json(sendResponse(false, error.message));
  }
};

// Delete Chat
exports.deleteByAll = async (req, res) => {
  try {
    const { id } = req.params;
    const chat = await Chat.findById(id);
    if (!chat)
      return res.status(404).json(sendResponse(false, "CHAT NOT FOUND"));

    await User.updateMany(
      { chats: { $in: chat._id } },
      { $pull: { chats: chat._id } }
    );

    // Destroy cloudinary files
    if (chat.files && chat.files.length > 0) {
      const deletePromises = chat.files.map(async (file) => {
        await removeFromCloudinary(file);
      });
      await Promise.all(deletePromises)
        .then(() => console.log("All files are deleted successfully"))
        .catch((err) => console.log(err));
      chat.files = [];
      await chat.save();
    }

    // remove chat from database
    await Chat.findByIdAndDelete(id);

    res.json(sendResponse(true, "MESSAGE DELETED BY ALL"));
  } catch (error) {
    console.log(error);
    res.status(500).json(sendResponse(false, error.message));
  }
};

exports.deleteByOneSide = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: chatId } = req.params;

    const chat = await Chat.findById(chatId).populate({
      path: "from to",
    });
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const opponentId = chat.from._id.equals(user._id)
      ? chat.to._id
      : chat.from._id;

    const opponent = await User.findById(opponentId).populate({
      path: "chats",
      populate: {
        path: "from to",
      },
    });

    const isChatDeletedByOpponent = opponent.chats.some((c) =>
      c._id.equals(chat._id)
    );
    user.chats.pull(chat._id);
    await user.save();
    console.log(isChatDeletedByOpponent);

    if (!isChatDeletedByOpponent) {
      if (chat.files && chat.files.length > 0) {
        const deletePromises = chat.files.map(async (file) => {
          await removeFromCloudinary(file);
        });
        await Promise.all(deletePromises)
          .then(() => console.log("All files are deleted successfully"))
          .catch((err) => console.log(err));
        chat.files = [];
        await chat.save();
      }
      await Chat.findByIdAndDelete(chatId);
    }

    res.json(sendResponse(true, "CHAT SUCCESSFULLY DELETED BY ONE SIDE"));
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(sendResponse(false, "Internal server error"));
  }
};

exports.getUserChat = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate({
      path: "chats",
      populate: {
        path: "from to",
        select: "name profilePicture",
      },
    });

    if (!user) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "User not found"));
    }

    res.json(
      sendResponse(
        true,
        "User chats retrieved successfully",
        user.chats,
        "chats"
      )
    );
  } catch (error) {
    console.log(error);
    res.status(500).json(sendResponse(false, error.message));
  }
};

exports.deleteChat = async (req, res) => {
  try {
    console.log("Request body:", req.body); // Log request body for debugging
    const id = req.user._id;
    const { opponentId } = req.body;

    // Validate opponentId
    console.log(opponentId);
    if (!opponentId) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(sendResponse(false, "opponentId is required"));
    }

    // Fetch user details
    const user = await User.findById(id).populate({
      path: "chats",
      populate: {
        path: "from to",
      },
    });
    console.log("User:", user); // Log user for debugging

    if (!user) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "User not found"));
    }

    // Fetch opponent details
    const opponent = await User.findById(opponentId).populate({
      path: "chats",
      populate: {
        path: "from to",
      },
    });
    console.log("Opponent:", opponent); // Log opponent for debugging

    if (!opponent) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "Opponent not found"));
    }

    // Filter chats between user and opponent
    const chats = user.chats.filter(
      (chat) =>
        chat.to._id.toString() === opponentId ||
        chat.from._id.toString() === opponentId
    );

    // Filter opponent's chats with user
    const opponentChats = opponent.chats.filter(
      (chat) => chat.to._id.toString() === id || chat.from._id.toString() === id
    );

    // Find chats deleted by opponent
    const deletedChatsByOpponent = chats.filter((chat) =>
      opponentChats.every(
        (opponentChat) => opponentChat._id.toString() !== chat._id.toString()
      )
    );

    // Update user's chats
    user.chats = user.chats.filter(
      (chat) =>
        chat.to._id.toString() !== opponentId &&
        chat.from._id.toString() !== opponentId
    );
    await user.save();
    console.log("Updated user chats:", user.chats);

    // Log details of chats to be deleted
    console.log("Deleted Chats by Opponent:", deletedChatsByOpponent);

    // Delete files from Cloudinary
    if (deletedChatsByOpponent.length > 0) {
      const deletePromises = deletedChatsByOpponent.map(async (chat) => {
        if (chat.files && chat.files.length > 0) {
          const fileDeletePromises = chat.files.map(async (file) => {
            await removeFromCloudinary(file);
          });
          await Promise.all(fileDeletePromises);
          console.log("All files deleted successfully for chat:", chat._id);
        }
      });
      await Promise.all(deletePromises);

      // Delete chats from database
      await Chat.deleteMany({
        _id: { $in: deletedChatsByOpponent.map((chat) => chat._id) },
      });
      console.log(
        "Chats deleted from database:",
        deletedChatsByOpponent.map((chat) => chat._id)
      );
    }

    res.json(sendResponse(true, "CHAT DELETED SUCCESSFULLY"));
  } catch (error) {
    console.error("Error deleting chat:", error);
    res.status(500).json(sendResponse(false, "Internal server error"));
  }
};

exports.readChat = async (req, res) => {
  try {
    const id = req.user._id;
    const { id: chatId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    chat.isRead = true;
    await chat.save();

    res.json(sendResponse(true, "CHAT SUCCESSFULLY SEEN"));
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(sendResponse(false, "Internal server error"));
  }
};
