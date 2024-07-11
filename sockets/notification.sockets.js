exports.notificationSockets = ({ io, socket, connectedUser }) => {
  socket.on("send:notification", ({ from, to }) => {
    io.to(connectedUser[to]).emit("receive:notification", {
      from,
      to,
    });

    console.log(to);
  });
};
