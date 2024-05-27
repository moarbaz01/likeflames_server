const Router = require("express").Router();
const upload = require("../utils/uploadFile");

// Import Handlers
const {
  create,
  update,
  deletePost,
  get,
  getAll,
} = require("../controllers/post");
const { verifyUser } = require("../middlewares/auth.mid");

// ROUTES
Router.post("/", upload.array("files"), verifyUser, create);
Router.put("/:id", verifyUser, update);
Router.delete("/:id", verifyUser, deletePost);
Router.get("/:id", get);
Router.get("/posts", getAll);

module.exports = Router;
