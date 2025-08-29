const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/db");

require("dotenv").config();
connectDB();

const PORT = process.env.PORT || 8000;

// Create HTTP server
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: { origin: "http://localhost:4200", credentials: true },
});

// Track online users
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Store userId with socketId
  socket.on("user-online", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (let [key, value] of onlineUsers.entries()) {
      if (value === socket.id) onlineUsers.delete(key);
    }
  });
});

// Make io and onlineUsers accessible in routes
app.set("io", io);
app.set("onlineUsers", onlineUsers);

// Start server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
