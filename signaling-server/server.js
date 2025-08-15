const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.io
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:8080", "http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    activeUsers: activeUsers.size,
    activeRooms: activeRooms.size,
    version: '1.0.0'
  });
});

// Basic status endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Chat2Chat WebRTC Signaling Server',
    status: 'running',
    version: '1.0.0'
  });
});

// Store active users and their socket connections
const activeUsers = new Map();
const activeRooms = new Map();

io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  // User joins with their unique ID
  socket.on('join', (userData) => {
    const { uniqueId, displayName } = userData;
    
    // Store user info
    activeUsers.set(socket.id, { uniqueId, displayName, socketId: socket.id });
    
    // Join user to their personal room
    socket.join(uniqueId);
    
    console.log(`👤 ${displayName} (${uniqueId}) joined`);
    
    // Notify user they're connected
    socket.emit('joined', { uniqueId, displayName });
  });

  // Handle call initiation
  socket.on('initiate-call', (data) => {
    const { targetUserId, callType, callerInfo } = data;
    console.log(`📞 Call initiated: ${callerInfo.displayName} -> ${targetUserId} (${callType})`);
    
    // Send call invitation to target user
    io.to(targetUserId).emit('incoming-call', {
      callerId: callerInfo.uniqueId,
      callerName: callerInfo.displayName,
      callType: callType,
      callId: `call_${Date.now()}`
    });
  });

  // Handle call acceptance
  socket.on('accept-call', (data) => {
    const { callerId, callId } = data;
    const caller = Array.from(activeUsers.values()).find(user => user.uniqueId === callerId);
    
    if (caller) {
      console.log(`✅ Call accepted: ${callId}`);
      
      // Create room for the call
      const roomId = callId;
      activeRooms.set(roomId, { caller: callerId, callee: socket.id, callId });
      
      // Both users join the call room
      socket.join(roomId);
      io.sockets.sockets.get(caller.socketId)?.join(roomId);
      
      // Notify caller that call was accepted
      io.to(caller.socketId).emit('call-accepted', { roomId, callId });
      socket.emit('call-accepted', { roomId, callId });
    }
  });

  // Handle call rejection
  socket.on('reject-call', (data) => {
    const { callerId, callId } = data;
    const caller = Array.from(activeUsers.values()).find(user => user.uniqueId === callerId);
    
    if (caller) {
      console.log(`❌ Call rejected: ${callId}`);
      io.to(caller.socketId).emit('call-rejected', { callId });
    }
  });

  // Handle WebRTC signaling
  socket.on('webrtc-offer', (data) => {
    const { roomId, offer } = data;
    console.log(`🤝 WebRTC offer in room: ${roomId}`);
    socket.to(roomId).emit('webrtc-offer', { offer, from: socket.id });
  });

  socket.on('webrtc-answer', (data) => {
    const { roomId, answer } = data;
    console.log(`🤝 WebRTC answer in room: ${roomId}`);
    socket.to(roomId).emit('webrtc-answer', { answer, from: socket.id });
  });

  socket.on('webrtc-ice-candidate', (data) => {
    const { roomId, candidate } = data;
    console.log(`🧊 ICE candidate in room: ${roomId}`);
    socket.to(roomId).emit('webrtc-ice-candidate', { candidate, from: socket.id });
  });

  // Handle call end
  socket.on('end-call', (data) => {
    const { roomId, callId } = data;
    console.log(`📞❌ Call ended: ${callId}`);
    
    // Notify all users in the room
    io.to(roomId).emit('call-ended', { callId });
    
    // Clean up room
    activeRooms.delete(roomId);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      console.log(`👋 ${user.displayName} disconnected`);
      activeUsers.delete(socket.id);
      
      // End any active calls
      for (const [roomId, room] of activeRooms.entries()) {
        if (room.caller === user.uniqueId || room.callee === socket.id) {
          io.to(roomId).emit('call-ended', { reason: 'user-disconnected' });
          activeRooms.delete(roomId);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Signaling server running on port ${PORT}`);
  console.log(`📡 WebRTC signaling ready for Chat2Chat Web`);
  console.log(`🏥 Health check available at http://localhost:${PORT}/health`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});
