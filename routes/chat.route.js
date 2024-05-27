const Router = require("express").Router();

// Import Handlers
const {
    send,
    getAll,
    deleteByAll,
    deleteByOneSide,
} = require("../controllers/chat");
const { verifyUser } = require("../middlewares/auth.mid");

// ROUTES
Router.post("/send", verifyUser, send);
Router.delete("/all", verifyUser, deleteByAll);
Router.delete("/", verifyUser, deleteByOneSide);
Router.get("/", verifyUser, getAll);

module.exports = Router;
