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
    // io.emit("message", "Hello user")
    socket.on("user-coords", (coords) => {
        coords.lat = coords.lat + Math.random() * 0.0009;
        coords.long = coords.long + Math.random() * 0.0009;
        console.log(coords);
        io.emit("coords", { coords, id: socket.id });
    });
});
