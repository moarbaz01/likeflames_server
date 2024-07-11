const Notifications = require("../models/notifications.schema");
const User = require("../models/user.schema");
const statusCodes = require("../services/statusCodes");
const { sendResponse } = require("../services/handlingResponse");

exports.create = async (req, res) => {
  try {
    const from = req.user._id;
    const { info, type, to, link } = req.body;
    if (!info || !type || !from || !to) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(sendResponse(false, "ALL FIELDS ARE REQUIRED"));
    }

    if (from === to) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(sendResponse(false, "YOU CAN'T SEND NOTIFICATION TO YOURSELF"));
    }

    const sender = await User.findById(from);
    if (!sender) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(sendResponse(false, "USER NOT FOUND"));
    }

    const user = await User.findById(to);
    if (!user) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(sendResponse(false, "USER NOT FOUND"));
    }

    const notifications = await Notifications.create({
      info,
      type,
      from,
      to,
      link,
    });

    

    user.notifications.push(notifications._id);
    await user.save();

    res.json(
      sendResponse(true, "SUCCESSFULLY SENT", notifications, "notifications")
    );
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(sendResponse(false, error.message));
  }
};

// Delete
exports.deleteNotifications = async (req, res) => {
  try {
    const id = req.user._id;
    const user = await User.findById(id);
    if (!user.notifications || user.notifications.length === 0) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "NOTIFICATIONS NOT FOUND"));
    }

    await Notifications.deleteMany({
      to: id,
      type: { $ne: "request" },
    });

    user.notifications = [];
    await user.save();
    res.json(sendResponse(true, "NOTIFICATIONS DELETED SUCCESSFULLY"));
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(sendResponse(false, error.message));
  }
};

// exports.getNotifications = async (req, res) => {
//   try {
//     const id = req.user._id;
//     const user = await User.findById(id).populate("notifications");
//     if (!user.notifications || user.notifications.length === 0) {
//       return res
//         .status(statusCodes.NOT_FOUND)
//         .json(sendResponse(false, "NOTIFICATIONS NOT FOUND"));
//     }

//     res.json(sendResponse(true, user.notifications));
//   } catch (error) {
//     res
//       .status(statusCodes.INTERNAL_SERVER_ERROR)
//       .json(sendResponse(false, error.message));
//   }
// };
