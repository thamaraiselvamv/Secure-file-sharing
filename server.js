const express = require("express");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Log when the server starts
console.log("Server is starting...");

// Socket.IO logic
io.on("connection", (socket) => {
    console.log("A client connected:", socket.id);

    // Handle sender joining a room
    socket.on("sender-join", (data) => {
        console.log("Sender joined with UID:", data.uid);
        socket.join(data.uid);
    });

    // Handle receiver joining a room
    socket.on("receiver-join", (data) => {
        console.log("Receiver joined with UID:", data.uid);
        socket.join(data.uid);
        socket.to(data.sender_uid).emit("init", data.uid);
    });

    // Handle receiving file metadata
    socket.on("file-meta", (data) => {
        console.log("Received file metadata:", data.metadata);
        socket.to(data.uid).emit("fs-meta", data.metadata);
    });

    // Handle file sharing start signal
    socket.on("fs-start", (data) => {
        console.log("File sharing started for UID:", data.uid);
        socket.to(data.uid).emit("fs-share", {});
    });

    // Handle receiving file data (raw buffer)
    socket.on("file-raw", (data) => {
        console.log("Received file buffer, sharing...");
        socket.to(data.uid).emit("fs-share", data.buffer);
    });

    // Handle client disconnect
    socket.on("disconnect", () => {
        console.log("A client disconnected:", socket.id);
    });
});

// Set the port dynamically or use 5000 as a fallback
const PORT = process.env.PORT || 5000;

// Start the server and handle errors like "EADDRINUSE"
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}).on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Please use a different port.`);
        process.exit(1);
    } else {
        console.error("Server error:", err);
        process.exit(1);
    }
});
