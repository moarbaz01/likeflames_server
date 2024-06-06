const Router = require("express").Router();

// Import Handlers
const {
  create,
  getComments,
  likeOnComment,
} = require("../controllers/comment");
const { verifyUser } = require("../middlewares/auth.mid");

// ROUTES
Router.post("/", verifyUser, create);
Router.put("/like/:id", verifyUser, likeOnComment);
Router.get("/", verifyUser, getComments);

module.exports = Router;
