const Router = require("express").Router();
const upload = require("../utils/uploadFile");

// Import Handlers
const {
  create,
  update,
  deletePost,
  get,
  getAll,
  likedislike
} = require("../controllers/post");
const { verifyUser } = require("../middlewares/auth.mid");

// ROUTES
Router.post("/post", upload.array("files"), verifyUser, create);
Router.put("/post/:id", verifyUser, update);
Router.delete("/post/:id", verifyUser, deletePost);
Router.get("/post/:id", get);
Router.get("/", getAll);
Router.put("/post/likedislike/:id", verifyUser, likedislike);

module.exports = Router;
