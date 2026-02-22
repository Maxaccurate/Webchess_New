const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// 配置CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://webchess.vercel.app', 'https://webchess-app.vercel.app']
      : ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
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
      
      rooms.delete(roomCode);
    }
  }
}

// 每5分钟清理一次过期房间
setInterval(cleanupExpiredRooms, 5 * 60 * 1000);

// Socket.IO连接处理
io.on('connection', (socket) => {
  console.log(`用户连接: ${socket.id}`);
  
  // 用户加入
  socket.on('join', (data) => {
    const { username, roomCode } = data;
    
    if (!username || username.trim() === '') {
      socket.emit('error', { message: '请输入用户名' });
      return;
    }
    
    if (!roomCode || roomCode.length !== 6) {
      socket.emit('error', { message: '房间代码必须是6位' });
      return;
    }
    
    let room = rooms.get(roomCode);
    
    if (!room) {
      // 创建新房间
      room = {
        code: roomCode,
        players: {
          white: null,
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
      console.log(`创建新房间: ${roomCode}`);
    }
    
    // 检查房间是否已满
    if (room.players.white && room.players.black) {
      // 房间已满，加入观战者
      room.spectators.push({
        socketId: socket.id,
        username: username
      });
      socket.join(roomCode);
      socket.emit('joinedAsSpectator', {
        roomCode,
        username,
        players: {
          white: room.players.white?.username,
          black: room.players.black?.username
        },
        gameState: room.gameState,
        chat: room.chat
      });
      console.log(`${username} 加入房间 ${roomCode} 作为观战者`);
    } else {
      // 加入为玩家
      const playerColor = room.players.white ? 'black' : 'white';
      const player = {
        socketId: socket.id,
        username: username,
        color: playerColor,
        joinedAt: Date.now()
      };
      
      room.players[playerColor] = player;
      socket.join(roomCode);
      
      // 存储用户信息
      users.set(socket.id, { username, roomCode, color: playerColor });
      
      // 通知用户加入成功
      socket.emit('joinedAsPlayer', {
        roomCode,
        username,
        color: playerColor,
        players: {
          white: room.players.white?.username,
          black: room.players.black?.username
        },
        gameState: room.gameState,
        chat: room.chat
      });
      
      console.log(`${username} 加入房间 ${roomCode} 作为 ${playerColor}`);
      
      // 如果房间已满，开始游戏
      if (room.players.white && room.players.black) {
        io.to(roomCode).emit('gameStarted', {
          whitePlayer: room.players.white.username,
          blackPlayer: room.players.black.username,
          gameState: room.gameState
        });
        console.log(`房间 ${roomCode} 游戏开始`);
      }
    }
    
    // 通知房间内其他用户
    socket.to(roomCode).emit('playerJoined', {
      username,
      players: {
        white: room.players.white?.username,
        black: room.players.black?.username
      }
    });
  });
  
  // 创建房间
  socket.on('createRoom', (data) => {
    const { username } = data;
    
    if (!username || username.trim() === '') {
      socket.emit('error', { message: '请输入用户名' });
      return;
    }
    
    // 生成唯一房间代码
    let roomCode;
    do {
      roomCode = generateRoomCode();
    } while (rooms.has(roomCode));
    
    // 创建房间
    const room = {
      code: roomCode,
      players: {
        white: {
          socketId: socket.id,
          username: username,
          color: 'white',
          joinedAt: Date.now()
        },
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
    users.set(socket.id, { username, roomCode, color: 'white' });
    socket.join(roomCode);
    
    socket.emit('roomCreated', {
      roomCode,
      username,
      color: 'white',
      players: {
        white: username,
        black: null
      },
      gameState: room.gameState,
      chat: room.chat
    });
    
    console.log(`${username} 创建房间: ${roomCode}`);
  });
  
  // 走棋
  socket.on('makeMove', (data) => {
    const { roomCode, move, fen } = data;
    const user = users.get(socket.id);
    
    if (!user || user.roomCode !== roomCode) {
      socket.emit('error', { message: '未加入房间' });
      return;
    }
    
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('error', { message: '房间不存在' });
      return;
    }
    
    // 检查是否是当前回合
    const currentTurn = room.gameState.turn;
    const playerColor = user.color;
    
    if ((currentTurn === 'w' && playerColor !== 'white') || 
        (currentTurn === 'b' && playerColor !== 'black')) {
      socket.emit('error', { message: '不是你的回合' });
      return;
    }
    
    // 更新游戏状态
    room.gameState.fen = fen;
    room.gameState.history.push({
      move,
      player: user.username,
      color: playerColor,
      timestamp: Date.now()
    });
    room.gameState.turn = currentTurn === 'w' ? 'b' : 'w';
    room.lastActivity = Date.now();
    
    // 广播走棋
    io.to(roomCode).emit('moveMade', {
      move,
      fen,
      player: user.username,
      color: playerColor,
      turn: room.gameState.turn,
      history: room.gameState.history
    });
    
    console.log(`房间 ${roomCode}: ${user.username}(${playerColor}) 走棋: ${move}`);
  });
  
  // 发送聊天消息
  socket.on('sendMessage', (data) => {
    const { roomCode, message } = data;
    const user = users.get(socket.id);
    
    if (!user || user.roomCode !== roomCode) {
      socket.emit('error', { message: '未加入房间' });
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
      message: message,
      timestamp: Date.now(),
      color: user.color
    };
    
    room.chat.push(chatMessage);
    room.lastActivity = Date.now();
    
    // 限制聊天记录长度
    if (room.chat.length > 100) {
      room.chat = room.chat.slice(-100);
    }
    
    // 广播聊天消息
    io.to(roomCode).emit('newMessage', chatMessage);
    
    console.log(`房间 ${roomCode}: ${user.username}: ${message}`);
  });
  
  // 游戏结束
  socket.on('gameOver', (data) => {
    const { roomCode, winner, reason } = data;
    const user = users.get(socket.id);
    
    if (!user || user.roomCode !== roomCode) {
      socket.emit('error', { message: '未加入房间' });
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
    
    io.to(roomCode).emit('gameEnded', {
      winner,
      reason,
      finalState: room.gameState
    });
    
    console.log(`房间 ${roomCode}: 游戏结束 - 胜利者: ${winner}, 原因: ${reason}`);
  });
  
  // 新游戏
  socket.on('newGame', (data) => {
    const { roomCode } = data;
    const user = users.get(socket.id);
    
    if (!user || user.roomCode !== roomCode) {
      socket.emit('error', { message: '未加入房间' });
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
    
    io.to(roomCode).emit('gameReset', {
      gameState: room.gameState
    });
    
    console.log(`房间 ${roomCode}: 新游戏开始`);
  });
  
  // 断开连接
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    
    if (user) {
      const { username, roomCode, color } = user;
      const room = rooms.get(roomCode);
      
      if (room) {
        // 如果是玩家，从房间移除
        if (color && room.players[color]?.socketId === socket.id) {
          room.players[color] = null;
          
          // 通知房间内其他用户
          socket.to(roomCode).emit('playerLeft', {
            username,
            color,
            players: {
              white: room.players.white?.username,
              black: room.players.black?.username
            }
          });
          
          console.log(`${username} 离开房间 ${roomCode}`);
          
          // 如果房间没有玩家了，清理房间
          if (!room.players.white && !room.players.black && room.spectators.length === 0) {
            // 延迟清理，给重新连接的机会
            setTimeout(() => {
              const currentRoom = rooms.get(roomCode);
              if (currentRoom && 
                  !currentRoom.players.white && 
                  !currentRoom.players.black && 
                  currentRoom.spectators.length === 0) {
                rooms.delete(roomCode);
                console.log(`清理空房间: ${roomCode}`);
              }
            }, 30000); // 30秒后清理
          }
        } else {
          // 如果是观战者，从观战者列表移除
          room.spectators = room.spectators.filter(s => s.socketId !== socket.id);
        }
      }
      
      users.delete(socket.id);
    }
    
    console.log(`用户断开连接: ${socket.id}`);
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

// 获取房间信息
app.get('/rooms', (req, res) => {
  const roomList = Array.from(rooms.values()).map(room => ({
    code: room.code,
    players: {
      white: room.players.white?.username,
      black: room.players.black?.username
    },
    spectators: room.spectators.length,
    createdAt: room.createdAt,
    lastActivity: room.lastActivity,
    gameOver: room.gameState.gameOver
  }));
  
  res.json({
    total: roomList.length,
    rooms: roomList
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    name: 'WebChess Server',
    version: '1.0.0',
    description: '多人国际象棋对战服务器',
    endpoints: {
      health: '/health',
      rooms: '/rooms',
      websocket: '/socket.io'
    }
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`WebChess 服务器运行在端口 ${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`WebSocket 端点: ws://localhost:${PORT}`);
});