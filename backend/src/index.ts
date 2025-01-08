import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const server = createServer();
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST"],
  },
});

server.listen(8000, () => {
  console.log("Listening on PORT: ", 8000);
});

io.on("connection", (socket) => {
  console.log("New socket connection: ", socket.id);

  // Emit current list of users to the newly connected client
  io.emit("live-users", [...io.sockets.sockets.keys()]);

  // Listen for user coordinates and broadcast to other users
  socket.on("user-coords", (coords) => {
    coords.lat = coords.lat + Math.random() * 0.0009; // Add random offset for demo
    coords.long = coords.long + Math.random() * 0.0009;
    console.log(`User ${socket.id} coords: `, coords);
    io.emit("coords", { coords, id: socket.id }); // Broadcast to all users
  });

  // Clean up when a user disconnects
  socket.on("disconnect", () => {
    console.log(`User ${socket.id} disconnected`);
  });
});
