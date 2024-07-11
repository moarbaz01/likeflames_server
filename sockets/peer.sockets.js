exports.peerSockets = ({ io, socket, connectedUser }) => {
  // Send Ice Candidates
  socket.on("send:candidate", ({ from, to, candidate }) => {
    io.to(connectedUser[to]).emit("receive:candidate", {
      candidate,
      from,
      to,
    });
  });

  socket.on("send:offer", ({ from, offer, to }) => {
    io.to(connectedUser[to]).emit("receive:offer", {
      offer,
      from,
      to,
    });
  });

  socket.on("send:answer", ({ from, to, answer }) => {
    io.to(connectedUser[to]).emit("receive:answer", {
      answer,
      from,
      to,
    });
  });

  socket.on("reject:offer", ({ from, to }) => {
    io.to(connectedUser[to]).emit("receiveReject:offer", {
      from,
      to,
    });
    console.log("TO", to);
  });

  socket.on("reject:mid-offer", ({ from, to }) => {
    io.to(connectedUser[to]).emit("receiveReject:mid-offer", {
      from,
      to,
    });
    console.log("TO", to);
  });
};
