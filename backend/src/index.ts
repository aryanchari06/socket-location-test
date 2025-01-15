import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";

interface Coords {
  lat: number;
  long: number;
}

// Extend the Socket interface to include pairedUser
declare module "socket.io" {
  interface Socket {
    pairedUser?: Socket | null;
  }
}

const server = createServer();

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST"],
  },
});

let waitingUser: Socket | null = null;

server.listen(8000, () => {
  console.log("Listening on PORT: 8000");
});

// Utility function to send coordinates
const sendCoordinates = (source: Socket, target: Socket, coords: Coords) => {
  // coords.lat += Math.random() * 0.0006;
  // coords.long += Math.random() * 0.0006;
  target.emit("user-coords", { coords, user: source.id });
};

io.on("connection", (socket: Socket) => {
  console.log("New socket connection: ", socket.id);

  if (waitingUser) {
    const pairedUser = waitingUser;
    waitingUser = null;

    // Pair users
    socket.pairedUser = pairedUser;
    pairedUser.pairedUser = socket;

    socket.emit("paired", { message: `Paired with ${pairedUser.id}` });
    pairedUser.emit("paired", { message: `Paired with ${socket.id}` });
    console.log(`Paired users: ${socket.id} <-> ${pairedUser.id}`);

    // Handle coordinate sharing
    socket.on("user-coords", (coords: Coords) => {
      if (socket.pairedUser) {
        sendCoordinates(socket, socket.pairedUser, coords);
      }
    });

    pairedUser.on("user-coords", (coords: Coords) => {
      if (pairedUser.pairedUser) {
        sendCoordinates(pairedUser, pairedUser.pairedUser, coords);
      }
    });
  } else {
    waitingUser = socket;
    socket.emit("wait-message", { message: "Waiting for a user to join..." });
    console.log("Waiting user: ", socket.id);
  }

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User ${socket.id} disconnected`);

    if (waitingUser === socket) {
      waitingUser = null;
    }

    if (socket.pairedUser) {
      socket.pairedUser.emit("message", { message: "Your pair disconnected." });
      socket.pairedUser.pairedUser = null;
    }
  });
});
