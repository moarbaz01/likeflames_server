const { chatSockets } = require("../sockets/chat.sockets");
const { notificationSockets } = require("../sockets/notification.sockets");
const { peerSockets } = require("../sockets/peer.sockets");
const User = require("../models/user.schema");
const connectedUser = {};
const userLastSeen = {};

exports.mySockets = ({ io }) => {
  io.on("connection", (socket) => {
    // Initialize chat sockets
    chatSockets({ io, socket, connectedUser });
    peerSockets({ io, socket, connectedUser });
    notificationSockets({ io, socket, connectedUser });

    // User Registered
    socket.on("register", (userId) => {
      connectedUser[userId] = socket.id;
      // Emit updated connected users and last seen times to all clients
      io.emit("get:sockets", connectedUser);
      io.emit("get:lastSeen", userLastSeen);
    });

    // User Disconnected
    socket.on("disconnect", async () => {
      for (const [key] of Object.entries(connectedUser)) {
        if (connectedUser[key] === socket.id) {
          const currentDate = new Date();
          await User.findByIdAndUpdate(key, { lastSeen: currentDate });
          delete connectedUser[key];
          io.emit("get:sockets", connectedUser);
        }
      }
    });

    // Error handling
    socket.on("error", (error) => {
      console.error(`Socket error: ${error.message}`);
      // Handle error appropriately (e.g., logging, notifying admins, etc.)
    });
  });
};
