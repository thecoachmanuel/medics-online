import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import express from 'express';
import cors from 'cors';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// prepare next app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Vitals state on global object for sharing with App Router
if (!global.vitalsData) {
  global.vitalsData = {
    latestRealVitals: null,
    lastUpdatedTime: Date.now(),
    MOCK_ENABLED: true
  };
}

const generateRealisticVitals = () => {
  if (global.vitalsData.latestRealVitals && Date.now() - global.vitalsData.lastUpdatedTime < 30000) {
    return global.vitalsData.latestRealVitals;
  }
  const baseHeartRate = 82;
  const baseSpo2 = 98;
  const heartRateVariation = Math.floor(Math.random() * 8) - 3;
  const spo2Variation = Math.floor(Math.random() * 3) - 1;
  return {
    bpm: Math.max(60, Math.min(100, baseHeartRate + heartRateVariation)).toString(),
    spo2: Math.max(95, Math.min(100, baseSpo2 + spo2Variation)).toString(),
    timestamp: Date.now()
  };
};

app.prepare().then(() => {
  const server = express();
  
  // Basic middlewares for the custom routes
  server.use(cors());
  server.use(express.json());

  // Vitals Receiver (Persistent endpoint)
  server.post('/data', (req, res) => {
    try {
      let { bpm, spo2 } = req.body;
      if (!bpm || !spo2) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }
      console.log(`📥 Vitals received - BPM: ${bpm}, SpO2: ${spo2}`);
      global.vitalsData.latestRealVitals = { bpm, spo2, timestamp: Date.now() };
      global.vitalsData.lastUpdatedTime = Date.now();
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Vitals Provider for App Router compatibility
  // We'll also expose this as a special internal route or just keep it here
  server.get('/internal/vitals', (req, res) => {
    let vitals = global.vitalsData.MOCK_ENABLED ? generateRealisticVitals() : global.vitalsData.latestRealVitals;
    if (!vitals) return res.status(404).json({ success: false });
    res.json({ success: true, ...vitals });
  });

  // Pass all other requests to Next.js
  server.all(':path*', (req, res) => {
    return handle(req, res);
  });

  const httpServer = createServer(server);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Socket.IO Logic
  const activeRooms = new Map();

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join-room', ({ roomId, userName }) => {
      socket.join(roomId);
      if (!activeRooms.has(roomId)) activeRooms.set(roomId, new Set());
      const roomUsers = activeRooms.get(roomId);
      const userInfo = { id: socket.id, name: userName };
      roomUsers.add(JSON.stringify(userInfo));
      console.log(`${userName} joined room ${roomId}`);
      socket.to(roomId).emit('user-joined', { userId: socket.id, userName });
      
      const existingUsers = Array.from(roomUsers)
        .map(userStr => JSON.parse(userStr))
        .filter(user => user.id !== socket.id);
      socket.emit('existing-users', existingUsers);
    });

    socket.on('webrtc-offer', ({ offer, targetUserId, roomId }) => {
      socket.to(targetUserId).emit('webrtc-offer', { offer, offerUserId: socket.id, roomId });
    });

    socket.on('webrtc-answer', ({ answer, targetUserId, roomId }) => {
      socket.to(targetUserId).emit('webrtc-answer', { answer, answerUserId: socket.id, roomId });
    });

    socket.on('webrtc-ice-candidate', ({ candidate, targetUserId, roomId }) => {
      socket.to(targetUserId).emit('webrtc-ice-candidate', { candidate, candidateUserId: socket.id, roomId });
    });

    socket.on('leave-room', ({ roomId, userName }) => {
      socket.leave(roomId);
      if (activeRooms.has(roomId)) {
        const roomUsers = activeRooms.get(roomId);
        for (const userStr of roomUsers) {
          const user = JSON.parse(userStr);
          if (user.id === socket.id) {
            roomUsers.delete(userStr);
            break;
          }
        }
        if (roomUsers.size === 0) activeRooms.delete(roomId);
      }
      socket.to(roomId).emit('user-left', { userId: socket.id, userName });
    });

    socket.on('disconnect', () => {
      for (const [roomId, roomUsers] of activeRooms.entries()) {
        for (const userStr of roomUsers) {
          const user = JSON.parse(userStr);
          if (user.id === socket.id) {
            roomUsers.delete(userStr);
            socket.to(roomId).emit('user-left', { userId: socket.id, userName: user.name });
            break;
          }
        }
        if (roomUsers.size === 0) activeRooms.delete(roomId);
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
