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
  updateInformation,
  fetchUserById,
} = require("../controllers/auth");
const { verifyUser } = require("../middlewares/auth.mid");
const { limiter } = require("../utils/rateLimiter");

// ROUTE
Router.post("/signup", upload.single("profilePicture"), signup);
Router.post("/login", login);
Router.post("/otp",sendOTP);
Router.get("/logout", verifyUser, logout);
Router.get("/user", verifyUser, fetchUser);
Router.get("/user/:id", fetchUserById);
Router.get("/users", fetchUsers);
Router.put("/follow-unfollow", verifyUser, followAndUnfollow);
Router.put("/request", verifyUser, acceptAndRejectFollowingRequest);
Router.post("/reset-password", resetPassword);
Router.put(
  "/info",
  upload.single("profilePicture"),
  verifyUser,
  updateInformation
);
Router.post("/generate-reset-token", limiter, generateResetToken);
Router.put("/change-password", verifyUser, changePassword);

// EXPORT ROUTER
module.exports = Router;
