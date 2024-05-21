const Router = require("express").Router();
const upload = require("../utils/uploadFile");

// IMPORT HANDLERS
const { signup, login } = require("../controllers/auth");

// ROUTE
Router.post("/signup", upload.single("profilePicture"), signup);
Router.post("/login", login);
// EXPORT ROUTER
module.exports = Router;
