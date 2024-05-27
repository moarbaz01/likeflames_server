const Router = require("express").Router();

// Import Handlers
const {
  create,
  getComments,
  likeOnComment,
  unlikeOnComment,
} = require("../controllers/comment");
const { verifyUser } = require("../middlewares/auth.mid");

// ROUTES
Router.post("/", verifyUser, create);
Router.put("/like", verifyUser, likeOnComment);
Router.put("/unlike", verifyUser, unlikeOnComment);
Router.get("/", verifyUser, getComments);

module.exports = Router;
