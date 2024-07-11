const Router = require("express").Router();
const upload = require("../utils/uploadFile");

// Import Handlers
const {
  create,
  getComments,
  likeOnComment,
  replyOnComment,
  getPostComment,
} = require("../controllers/comment");
const { verifyUser } = require("../middlewares/auth.mid");

// ROUTES
Router.post("/", upload.single("gif"), verifyUser, create);
Router.post("/reply/:id", verifyUser, replyOnComment);
Router.put("/like/:id", verifyUser, likeOnComment);
Router.get("/", getComments);
Router.get("/post/:id", getPostComment);

module.exports = Router;
