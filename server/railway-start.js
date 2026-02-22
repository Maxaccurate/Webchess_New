#!/usr/bin/env node

/**
 * Railway 专用启动文件
 * 解决 Railway 部署问题
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// 配置CORS - Railway 环境
const io = socketIo(server, {
  cors: {
    origin: '*', // Railway 上先允许所有，生产环境再限制
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// 中间件
app.use(cors());
app.use(express.json());

// 存储游戏房间
const rooms = new Map();
const users = new Map();

// 生成6位房间代码
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 清理过期房间（100分钟自动关闭）
function cleanupExpiredRooms() {
  const now = Date.now();
  for (const [roomCode, room] of rooms.entries()) {
    if (now - room.createdAt > 100 * 60 * 1000) { // 100分钟
      console.log(`清理过期房间: ${roomCode}`);
      
      // 通知房间内所有用户
      if (room.players.white) {
        io.to(room.players.white.socketId).emit('roomClosed', { reason: '房间已过期' });
      }
      if (room.players.black) {
        io.to(room.players.black.socketId).emit('roomClosed', { reason: '房间已过期' });
      }
      
      // 通知观战者
      room.spectators.forEach(spectator => {
        io.to(spectator.socketId).emit('roomClosed', { reason: '房间已过期' });
      });
      
      // 删除房间
      rooms.delete(roomCode);
    }
  }
}

// 每5分钟清理一次过期房间
setInterval(cleanupExpiredRooms, 5 * 60 * 1000);

// Socket.IO 连接处理
io.on('connection', (socket) => {
  console.log(`新用户连接: ${socket.id}`);
  users.set(socket.id, { socketId: socket.id, roomCode: null });
  
  // 创建房间
  socket.on('createRoom', (data) => {
    const { username } = data;
    
    if (!username || username.trim() === '') {
      socket.emit('error', { message: '用户名不能为空' });
      return;
    }
    
    let roomCode;
    do {
      roomCode = generateRoomCode();
    } while (rooms.has(roomCode));
    
    const room = {
      code: roomCode,
      players: {
        white: { socketId: socket.id, username, color: 'white', joinedAt: Date.now() },
        black: null
      },
      spectators: [],
      gameState: {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        history: [],
        turn: 'w',
        gameOver: false,
        winner: null,
        reason: null
      },
      chat: [],
      createdAt: Date.now(),
      lastActivity: Date.now()
    };
    
    rooms.set(roomCode, room);
    users.set(socket.id, { ...users.get(socket.id), roomCode, username });
    
    socket.join(roomCode);
    socket.emit('roomCreated', { roomCode, color: 'white' });
    
    console.log(`房间创建: ${roomCode} by ${username}`);
  });
  
  // 加入房间
  socket.on('join', (data) => {
    const { username, roomCode } = data;
    
    if (!username || username.trim() === '') {
      socket.emit('error', { message: '用户名不能为空' });
      return;
    }
    
    if (!roomCode || roomCode.length !== 6) {
      socket.emit('error', { message: '房间代码必须是6位' });
      return;
    }
    
    const room = rooms.get(roomCode.toUpperCase());
    if (!room) {
      socket.emit('error', { message: '房间不存在' });
      return;
    }
    
    // 检查用户名是否已存在
    const existingUser = Array.from(users.values()).find(
      user => user.roomCode === roomCode && user.username === username
    );
    if (existingUser) {
      socket.emit('error', { message: '用户名已存在' });
      return;
    }
    
    users.set(socket.id, { ...users.get(socket.id), roomCode: roomCode.toUpperCase(), username });
    
    // 加入房间
    socket.join(roomCode);
    
    // 更新房间活动时间
    room.lastActivity = Date.now();
    
    // 通知现有玩家
    if (room.players.white) {
      io.to(room.players.white.socketId).emit('playerJoined', { username, color: 'white' });
    }
    if (room.players.black) {
      io.to(room.players.black.socketId).emit('playerJoined', { username, color: 'black' });
    }
    
    // 通知观战者
    room.spectators.forEach(spectator => {
      io.to(spectator.socketId).emit('playerJoined', { username, color: 'spectator' });
    });
    
    // 分配角色
    if (!room.players.black) {
      // 作为黑方加入
      room.players.black = { socketId: socket.id, username, color: 'black', joinedAt: Date.now() };
      socket.emit('joinedAsPlayer', { roomCode, color: 'black', gameState: room.gameState });
      
      // 游戏可以开始了
      io.to(roomCode).emit('gameStarted', { 
        white: room.players.white.username, 
        black: room.players.black.username,
        gameState: room.gameState
      });
    } else {
      // 作为观战者加入
      room.spectators.push({ socketId: socket.id, username });
      socket.emit('joinedAsSpectator', { roomCode, gameState: room.gameState, chat: room.chat });
    }
    
    console.log(`用户加入: ${username} -> ${roomCode}`);
  });
  
  // 走棋
  socket.on('makeMove', (data) => {
    const { roomCode, move, fen } = data;
    const user = users.get(socket.id);
    
    if (!user || user.roomCode !== roomCode) {
      socket.emit('error', { message: '未在房间中' });
      return;
    }
    
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('error', { message: '房间不存在' });
      return;
    }
    
    // 更新游戏状态
    room.gameState.fen = fen;
    room.gameState.history.push({
      move,
      player: user.username,
      color: room.players.white?.socketId === socket.id ? 'white' : 'black',
      timestamp: Date.now()
    });
    room.gameState.turn = room.gameState.turn === 'w' ? 'b' : 'w';
    
    room.lastActivity = Date.now();
    
    // 广播走棋
    io.to(roomCode).emit('moveMade', {
      move,
      player: user.username,
      fen,
      turn: room.gameState.turn,
      history: room.gameState.history
    });
    
    console.log(`走棋: ${user.username} -> ${move} in ${roomCode}`);
  });
  
  // 发送聊天消息
  socket.on('sendMessage', (data) => {
    const { roomCode, message } = data;
    const user = users.get(socket.id);
    
    if (!user || user.roomCode !== roomCode) {
      socket.emit('error', { message: '未在房间中' });
      return;
    }
    
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('error', { message: '房间不存在' });
      return;
    }
    
    const chatMessage = {
      id: Date.now().toString(),
      username: user.username,
      message: message.trim(),
      timestamp: Date.now(),
      color: room.players.white?.socketId === socket.id ? 'white' : 
             room.players.black?.socketId === socket.id ? 'black' : 'spectator'
    };
    
    room.chat.push(chatMessage);
    room.lastActivity = Date.now();
    
    // 限制聊天历史长度
    if (room.chat.length > 100) {
      room.chat = room.chat.slice(-100);
    }
    
    // 广播消息
    io.to(roomCode).emit('newMessage', chatMessage);
    
    console.log(`聊天: ${user.username} in ${roomCode}: ${message}`);
  });
  
  // 游戏结束
  socket.on('gameOver', (data) => {
    const { roomCode, winner, reason } = data;
    const user = users.get(socket.id);
    
    if (!user || user.roomCode !== roomCode) {
      socket.emit('error', { message: '未在房间中' });
      return;
    }
    
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('error', { message: '房间不存在' });
      return;
    }
    
    room.gameState.gameOver = true;
    room.gameState.winner = winner;
    room.gameState.reason = reason;
    room.lastActivity = Date.now();
    
    // 广播游戏结束
    io.to(roomCode).emit('gameEnded', { winner, reason });
    
    console.log(`游戏结束: ${roomCode} - 胜者: ${winner}, 原因: ${reason}`);
  });
  
  // 新游戏
  socket.on('newGame', (data) => {
    const { roomCode } = data;
    const user = users.get(socket.id);
    
    if (!user || user.roomCode !== roomCode) {
      socket.emit('error', { message: '未在房间中' });
      return;
    }
    
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('error', { message: '房间不存在' });
      return;
    }
    
    // 重置游戏状态
    room.gameState = {
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      history: [],
      turn: 'w',
      gameOver: false,
      winner: null,
      reason: null
    };
    
    room.lastActivity = Date.now();
    
    // 广播新游戏
    io.to(roomCode).emit('gameStarted', { 
      white: room.players.white.username, 
      black: room.players.black.username,
      gameState: room.gameState
    });
    
    console.log(`新游戏: ${roomCode}`);
  });
  
  // 断开连接
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (!user) return;
    
    console.log(`用户断开连接: ${user.username || socket.id}`);
    
    if (user.roomCode) {
      const room = rooms.get(user.roomCode);
      if (room) {
        room.lastActivity = Date.now();
        
        // 从房间中移除用户
        if (room.players.white?.socketId === socket.id) {
          room.players.white = null;
          io.to(user.roomCode).emit('playerLeft', { username: user.username, color: 'white' });
        } else if (room.players.black?.socketId === socket.id) {
          room.players.black = null;
          io.to(user.roomCode).emit('playerLeft', { username: user.username, color: 'black' });
        } else {
          // 移除观战者
          room.spectators = room.spectators.filter(s => s.socketId !== socket.id);
          io.to(user.roomCode).emit('playerLeft', { username: user.username, color: 'spectator' });
        }
        
        // 如果房间空了，清理房间
        if (!room.players.white && !room.players.black && room.spectators.length === 0) {
          rooms.delete(user.roomCode);
          console.log(`房间清空删除: ${user.roomCode}`);
        }
      }
    }
    
    users.delete(socket.id);
  });
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    rooms: rooms.size,
    users: users.size,
    uptime: process.uptime()
  });
});

// 房间列表端点
app.get('/rooms', (req, res) => {
  const roomList = Array.from(rooms.values()).map(room => ({
    code: room.code,
    players: {
      white: room.players.white?.username || null,
      black: room.players.black?.username || null
    },
    spectators: room.spectators.length,
    createdAt: room.createdAt,
    lastActivity: room.lastActivity
  }));
  
  res.json({
    rooms: roomList,
    count: roomList.length
  });
});

// 根端点
app.get('/', (req, res) => {
  res.json({
    name: 'WebChess Server',
    version: '1.0.0',
    description: '多人对战国际象棋服务器',
    endpoints: {
      health: '/health',
      rooms: '/rooms',
      websocket: '/socket.io'
    }
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WebChess 服务器运行在端口 ${PORT}`);
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 WebSocket 端点: ws://0.0.0.0:${PORT}`);
  console.log(`📊 健康检查: http://0.0.0.0:${PORT}/health`);
});

// 处理未捕获异常
process.on('uncaughtException', (error) => {
  console.error('未捕获异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});