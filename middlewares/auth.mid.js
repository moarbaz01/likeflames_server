const jwt = require("jsonwebtoken");
const statusCodes = require("../services/statusCodes");
const { sendResponse } = require("../services/handlingResponse");

exports.verifyUser = async (req, res, next) => {
  try {
    const token =
      req.cookies.token ||
      (req.headers.authorization &&
        req.headers.authorization.replace("Bearer ", ""));

    if (!token) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "TOKEN EXPIRED || NOT FOUND"));
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET);
    if (!decode) {
      return res
        .status(statusCodes.UNAUTHORIZED)
        .json(sendResponse(false, "TOKEN EXPIRED OR LOGIN EXPIRED"));
    }

    req.user = decode;
    next();
  } catch (error) {
    console.log(error.name);
    if (error.name === "TokenExpiredError") {
      return res
        .status(statusCodes.UNAUTHORIZED)
        .json(sendResponse(false, "TOKEN EXPIRED"));
    } else if (error.name === "JsonWebTokenError") {
      return res
        .status(statusCodes.UNAUTHORIZED)
        .json(sendResponse(false, "INVALID TOKEN"));
    } else {
      console.log(error.message);
      return res
        .status(statusCodes.INTERNAL_SERVER_ERROR)
        .json(sendResponse(false, error.message));
    }
  }
};
exports.verifyRole = async (req, res, next) => {
  try {
    const { role } = req.user;
    if (role !== "admin") {
      return res
        .status(statusCodes.UNAUTHORIZED)
        .json(sendResponse(false, "PROTECTED ROUTE"));
    }
    next();
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(sendResponse(false, error.message));
  }
};
