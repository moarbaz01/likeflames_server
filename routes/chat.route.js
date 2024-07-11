const Router = require("express").Router();
const upload = require("../utils/uploadFile");

// Import Handlers
const {
  send,
  getAll,
  deleteByAll,
  deleteByOneSide,
  getUserChat,
  deleteChat,
  readChat,
} = require("../controllers/chat");
const { verifyUser } = require("../middlewares/auth.mid");

// ROUTES
Router.post("/send", upload.array("files"), verifyUser, send);
Router.delete("/all/:id", verifyUser, deleteByAll);
Router.delete("/single/:id", verifyUser, deleteByOneSide);
Router.get("/", verifyUser, getAll);
Router.get("/user", verifyUser, getUserChat);
Router.delete("/fullChat", verifyUser, deleteChat);
Router.put("/readChat/:id", verifyUser, readChat);

module.exports = Router;
