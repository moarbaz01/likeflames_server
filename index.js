const express = require("express");
const app = express();
const cors = require("cors");
const server = require("http").createServer(app);
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", process.env.CLIENT_URL], // Remove the trailing slash
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

// Path to the uploads directory
const uploadsDir = path.join(__dirname, "uploads");

// Create the directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Socket Configuration
const { mySockets } = require("./utils/sockets");
mySockets({ io });

// Use cors middleware for regular HTTP routes
app.use(
  cors({
    origin: ["http://localhost:5173", process.env.CLIENT_URL], // Allow requests from this origin
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const PORT = process.env.PORT || 5000;
require("dotenv").config();
require("./config/database").dbConnect();
require("./config/cloudinary")();

const user = require("./routes/user.route");
const post = require("./routes/post.route");
const notifications = require("./routes/notifications.route");
const comment = require("./routes/comment.route");
const chat = require("./routes/chat.route");

// Middleware
app.use(require("cookie-parser")());
app.use(require("body-parser").json());
app.use(require("body-parser").urlencoded({ extended: true }));

// Routes
app.use("/api/v1/posts", post);
app.use("/api/v1", user);
app.use("/api/v1/comment", comment);
app.use("/api/v1/notifications", notifications);
app.use("/api/v1/chat", chat);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// app.get("/check", (req, res) => {
//   res.status(200).json({
//     success: true,
//     data: "Hi",
//   });
// });

// Start the server
server.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
