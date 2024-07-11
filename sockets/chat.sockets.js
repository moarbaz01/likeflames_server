exports.chatSockets = ({ io, socket, connectedUser }) => {
  socket.on("send:chat", (data) => {
    const { from, to } = data;
    console.log(to);
    const toSocketId = connectedUser[to];
    console.log("to : ", toSocketId);
    if (!toSocketId) return;
    io.to(toSocketId).emit("receive:chat", { from, to });
  });
};
