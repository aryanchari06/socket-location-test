"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const server = (0, http_1.createServer)();
const io = new socket_io_1.Server(server, {
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
