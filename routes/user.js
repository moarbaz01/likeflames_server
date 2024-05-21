const Router = require("express").Router();
const upload = require("../utils/uploadFile");

// IMPORT HANDLERS
const { signup } = require("../controllers/auth");

// ROUTE
Router.post("/signup", upload.single("profilePicture"), signup);
// EXPORT ROUTER
module.exports = Router;
