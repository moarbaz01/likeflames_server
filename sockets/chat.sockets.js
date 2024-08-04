exports.chatSockets = ({ io, socket, connectedUser }) => {
  socket.on("send:chat", (data) => {
    const { from, to } = data;
    const toSocketId = connectedUser[to];
    if (!toSocketId) return;
    io.to(toSocketId).emit("receive:chat", { from, to });
  });

  socket.on("send:typing", (data) => {
    const { to } = data;
    const toSocketId = connectedUser[to];
    if (!toSocketId) return;
    io.to(toSocketId).emit("receive:typing", data);
  });
};
