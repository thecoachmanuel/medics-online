import { Server } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';
import type { Server as IOServer } from 'socket.io';

interface SocketServer extends HTTPServer {
  io?: IOServer | undefined;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (res.socket.server.io) {
    console.log('Socket is already running');
    res.end();
    return;
  }

  console.log('Socket is initializing');
  const io = new Server(res.socket.server, {
    path: '/api/socket',
    addTrailingSlash: false,
  });
  res.socket.server.io = io;

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
        .map(userStr => JSON.parse(userStr as string))
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
          const user = JSON.parse(userStr as string);
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
          const user = JSON.parse(userStr as string);
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

  res.end();
}
