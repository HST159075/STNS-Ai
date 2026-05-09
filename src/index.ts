import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { auth } from "./config/auth";
import { toNodeHandler } from "better-auth/node";
import { Server } from 'socket.io';
import app from './app';

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", process.env.FRONTEND_URL || ""],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Pass io to app for use in controllers
app.set('io', io);


// Socket logic
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`User ${socket.id} joined conversation: ${conversationId}`);
  });

  socket.on('join_user', (userId) => {
    socket.join(userId);
    console.log(`User ${socket.id} joined personal room: ${userId}`);
  });

  socket.on('send_message', (data) => {
    // data: { conversationId, senderId, content, ... }
    const roomId = data.conversationId || data.projectId;
    if (roomId) {
      io.to(roomId).emit('receive_message', data);
    }
  });


  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Real-time Socket.io initialized ⚡`);

  // KeepAlive: Self-ping every 14 minutes to prevent Render free tier from sleeping
  const SELF_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;
  setInterval(async () => {
    try {
      const response = await fetch(SELF_URL);
      console.log(`[KeepAlive] Self-ping successful: ${response.status}`);
    } catch (err) {
      console.warn(`[KeepAlive] Self-ping failed:`, err);
    }
  }, 14 * 60 * 1000); // Every 14 minutes
});

export { io };
