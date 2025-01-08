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
  // io.emit("message", "Hello user")
  socket.on("user-coords", (coords) => {
    coords.lat = coords.lat + Math.random()*0.0009
    coords.long = coords.long + Math.random()*0.0009
    console.log(coords)
    io.emit("coords", {coords, id:socket.id});
  });
});
