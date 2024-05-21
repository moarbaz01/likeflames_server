const bcrypt = require("bcrypt");
const User = require("../models/user.schema");
const jwt = require("jsonwebtoken");
const statusCodes = require("../services/status");
const { sendResponse } = require("../services/handlingResponse");

exports.verifyUser = async (req, res, next) => {
  try {
    const token =
      req.cookies.token || req.headers?.Authorization.replace("Bearer ", "");

    if (!token) {
      res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "TOKEN NOT FOUND"));
    }

    const decode = await jwt.verify(token, process.env.JWT_SECRET);
    if (!decode) {
      res
        .status(statusCodes.UNAUTHORIZED)
        .json(sendResponse(false, "TOKEN EXPIRED OR LOGIN EXPIRED"));
    }

    req.user = decode;
    next();
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(sendResponse(false, error.message));
  }
};

exports.verifyRole = async (req, res, next) => {
  try {
    const role = req.user;
    if (role !== "admin") {
      res
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
