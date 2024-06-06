const Router = require("express").Router();

// Import Handlers
const {
  create,
  deleteNotifications,
} = require("../controllers/notifications");
const { verifyUser } = require("../middlewares/auth.mid");

// ROUTES
Router.post("/", verifyUser, create);
Router.delete("/", verifyUser, deleteNotifications);
// Router.get("/", verifyUser, getNotifications);

module.exports = Router;
