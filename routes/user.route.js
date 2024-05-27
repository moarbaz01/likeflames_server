const Router = require("express").Router();
const upload = require("../utils/uploadFile");

// IMPORT HANDLERS
const { signup, login, logout, fetchUser, fetchUsers } = require("../controllers/auth");
const { verifyUser } = require("../middlewares/auth.mid");

// ROUTE
Router.post("/signup", upload.single("profilePicture"), signup);
Router.post("/login", login);
Router.get("/logout", verifyUser, logout);
Router.get("/user", verifyUser, fetchUser);
Router.get("/users", fetchUsers);
// EXPORT ROUTER
module.exports = Router;
