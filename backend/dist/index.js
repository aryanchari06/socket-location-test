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
let waitingUser = null;
server.listen(8000, () => {
    console.log("Listening on PORT: ", 8000);
});
io.on("connection", (socket) => {
    console.log("New socket connection: ", socket.id);
    if (waitingUser) {
        const pairedUser = waitingUser;
        waitingUser = null;
        // pair users
        socket.pairedUser = pairedUser;
        pairedUser.pairedUser = socket;
        socket.emit("paired", { message: `Paired with ${pairedUser.id}` });
        pairedUser.emit("paired", { message: `Paired with ${socket.id}` });
        console.log(`Paired users ${socket.id} <-> ${pairedUser.id}`);
        // share coords between users
        socket.on("user-coords", (coords) => {
            var _a;
            console.log(`Sending coordinates from ${socket.id}:`, coords);
            // added Math.random() to differentiate between the two coords
            coords.lat = coords.lat + Math.random() * 0.0006;
            coords.long = coords.long + Math.random() * 0.0006;
            console.log("mew coords:", coords);
            (_a = socket.pairedUser) === null || _a === void 0 ? void 0 : _a.emit("user-coords", { coords, user: socket.id });
        });
        pairedUser.on("user-coords", (coords) => {
            var _a;
            console.log(`Sending coordinates from ${pairedUser.id}:`, coords);
            (_a = pairedUser.pairedUser) === null || _a === void 0 ? void 0 : _a.emit("user-coords", {
                coords,
                user: pairedUser.id,
            });
        });
    }
    else {
        waitingUser = socket;
        socket.emit("wait-message", { message: "Waiting for user to join..." });
        console.log("Waiting user: ", socket.id);
    }
    // disconnect
    socket.on("disconnect", () => {
        console.log(`User ${socket.id} disconnected`);
        // If the disconnected user was waiting
        if (waitingUser === socket) {
            waitingUser = null;
        }
        if (socket.pairedUser) {
            socket.pairedUser.emit("message", { message: "Your pair disconnected." });
            socket.pairedUser.pairedUser = undefined;
        }
    });
});
