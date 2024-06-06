const Router = require("express").Router();
const upload = require("../utils/uploadFile");

// IMPORT HANDLERS
const {
  signup,
  login,
  logout,
  fetchUser,
  fetchUsers,
  sendOTP,
  changePassword,
  resetPassword,
  generateResetToken,
  followAndUnfollow,
  acceptAndRejectFollowingRequest,
} = require("../controllers/auth");
const { verifyUser } = require("../middlewares/auth.mid");

// ROUTE
Router.post("/signup", upload.single("profilePicture"), signup);
Router.post("/login", login);
Router.post("/otp", sendOTP);
Router.get("/logout", verifyUser, logout);
Router.get("/user", verifyUser, fetchUser);
Router.get("/users", fetchUsers);
Router.put("/follow-unfollow", verifyUser, followAndUnfollow);
Router.put("/request", verifyUser, acceptAndRejectFollowingRequest);
Router.post("/reset-password", resetPassword);
Router.post("/generate-reset-token", generateResetToken);
Router.post("/change-password", verifyUser, changePassword);

// EXPORT ROUTER
module.exports = Router;
