const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { Chess } = require('chess.js');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // 允许所有来源，生产环境应限制
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// 存储游戏房间
const rooms = new Map();
// 存储用户连接
const users = new Map();

// 生成6位数字房间代码
function generateRoomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 清理闲置房间
function cleanupRooms() {
  const now = Date.now();
  for (const [roomCode, room] of rooms.entries()) {
    if (now - room.lastActivity > 100 * 60 * 1000) { // 100分钟
      console.log(`清理闲置房间: ${roomCode}`);
      rooms.delete(roomCode);
      
      // 通知房间内所有用户
      io.to(roomCode).emit('room_closed', { reason: '房间闲置超时' });
    }
  }
}

// 每5分钟检查一次闲置房间
setInterval(cleanupRooms, 5 * 60 * 1000);

// Socket.io连接处理
io.on('connection', (socket) => {
  console.log(`新连接: ${socket.id}`);
  
  // 用户加入
  socket.on('join', ({ roomCode, username }) => {
    if (!roomCode || !username) {
      socket.emit('error', { message: '房间代码和用户名不能为空' });
      return;
    }
    
    // 清理用户名
    const cleanUsername = username.trim().substring(0, 20);
    
    let room = rooms.get(roomCode);
    
    if (!room) {
      // 创建新房间
      room = {
        code: roomCode,
        game: new Chess(),
        players: {},
        spectators: new Set(),
        createdAt: Date.now(),
        lastActivity: Date.now()
      };
      rooms.set(roomCode, room);
      console.log(`创建新房间: ${roomCode}`);
    }
    
    // 检查房间是否已满（最多2名玩家）
    const playerCount = Object.keys(room.players).length;
    
    if (playerCount >= 2) {
      // 作为观战者加入
      room.spectators.add(socket.id);
      socket.join(roomCode);
      users.set(socket.id, { roomCode, username: cleanUsername, isSpectator: true });
      
      socket.emit('joined_as_spectator', {
        roomCode,
        username: cleanUsername,
        gameState: room.game.fen(),
        players: room.players
      });
      
      console.log(`${cleanUsername} 作为观战者加入房间 ${roomCode}`);
    } else {
      // 作为玩家加入
      const playerColor = playerCount === 0 ? 'white' : 'black';
      room.players[socket.id] = {
        username: cleanUsername,
        color: playerColor
      };
      
      socket.join(roomCode);
      users.set(socket.id, { roomCode, username: cleanUsername, isSpectator: false });
      
      // 更新房间活动时间
      room.lastActivity = Date.now();
      
      // 通知用户加入成功
      socket.emit('joined', {
        roomCode,
        username: cleanUsername,
        color: playerColor,
        gameState: room.game.fen(),
        players: room.players
      });
      
      // 通知房间内其他用户
      socket.to(roomCode).emit('player_joined', {
        username: cleanUsername,
        color: playerColor,
        players: room.players
      });
      
      console.log(`${cleanUsername} 作为${playerColor}加入房间 ${roomCode}`);
      
      // 如果房间已满，开始游戏
      if (Object.keys(room.players).length === 2) {
        io.to(roomCode).emit('game_start', {
          message: '游戏开始！白方先走。',
          gameState: room.game.fen(),
          players: room.players
        });
        console.log(`房间 ${roomCode} 游戏开始`);
      }
    }
  });
  
  // 创建房间
  socket.on('create_room', ({ username }) => {
    if (!username) {
      socket.emit('error', { message: '用户名不能为空' });
      return;
    }
    
    const cleanUsername = username.trim().substring(0, 20);
    const roomCode = generateRoomCode();
    
    // 创建房间
    const room = {
      code: roomCode,
      game: new Chess(),
      players: {},
      spectators: new Set(),
      createdAt: Date.now(),
      lastActivity: Date.now()
    };
    
    // 创建者作为白方加入
    room.players[socket.id] = {
      username: cleanUsername,
      color: 'white'
    };
    
    rooms.set(roomCode, room);
    socket.join(roomCode);
    users.set(socket.id, { roomCode, username: cleanUsername, isSpectator: false });
    
    socket.emit('room_created', {
      roomCode,
      username: cleanUsername,
      color: 'white',
      gameState: room.game.fen()
    });
    
    console.log(`${cleanUsername} 创建房间 ${roomCode}`);
  });
  
  // 移动棋子
  socket.on('move', ({ from, to, promotion = 'q' }) => {
    const user = users.get(socket.id);
    if (!user || user.isSpectator) {
      socket.emit('error', { message: '观战者不能移动棋子' });
      return;
    }
    
    const room = rooms.get(user.roomCode);
    if (!room) {
      socket.emit('error', { message: '房间不存在' });
      return;
    }
    
    // 检查是否轮到该玩家
    const player = room.players[socket.id];
    const currentTurn = room.game.turn() === 'w' ? 'white' : 'black';
    
    if (player.color !== currentTurn) {
      socket.emit('error', { message: '现在不是你的回合' });
      return;
    }
    
    try {
      // 执行移动
      const move = room.game.move({
        from,
        to,
        promotion
      });
      
      if (!move) {
        socket.emit('error', { message: '非法走法' });
        return;
      }
      
      // 更新房间活动时间
      room.lastActivity = Date.now();
      
      // 广播移动结果
      io.to(user.roomCode).emit('move_made', {
        from,
        to,
        promotion,
        san: move.san,
        fen: room.game.fen(),
        turn: room.game.turn() === 'w' ? 'white' : 'black',
        player: player.username
      });
      
      // 检查游戏状态
      let gameStatus = 'playing';
      let statusMessage = '';
      
      if (room.game.isCheckmate()) {
        gameStatus = 'checkmate';
        statusMessage = `${currentTurn === 'white' ? '黑方' : '白方'} 将死！`;
      } else if (room.game.isStalemate()) {
        gameStatus = 'stalemate';
        statusMessage = '逼和';
      } else if (room.game.isDraw()) {
        gameStatus = 'draw';
        statusMessage = '和棋';
      } else if (room.game.isCheck()) {
        gameStatus = 'check';
        statusMessage = '将军！';
      }
      
      if (gameStatus !== 'playing') {
        io.to(user.roomCode).emit('game_over', {
          status: gameStatus,
          message: statusMessage,
          fen: room.game.fen()
        });
      }
      
      console.log(`房间 ${user.roomCode}: ${player.username} 移动 ${from}-${to}`);
      
    } catch (error) {
      console.error('移动错误:', error);
      socket.emit('error', { message: '移动失败: ' + error.message });
    }
  });
  
  // 聊天消息
  socket.on('chat_message', ({ message }) => {
    const user = users.get(socket.id);
    if (!user || !message) return;
    
    const room = rooms.get(user.roomCode);
    if (!room) return;
    
    // 清理消息
    const cleanMessage = message.trim().substring(0, 500);
    
    // 广播聊天消息
    io.to(user.roomCode).emit('chat_message', {
      username: user.username,
      message: cleanMessage,
      timestamp: Date.now(),
      isSpectator: user.isSpectator
    });
    
    console.log(`房间 ${user.roomCode} 聊天: ${user.username}: ${cleanMessage}`);
  });
  
  // 投降
  socket.on('resign', () => {
    const user = users.get(socket.id);
    if (!user || user.isSpectator) return;
    
    const room = rooms.get(user.roomCode);
    if (!room) return;
    
    const player = room.players[socket.id];
    
    io.to(user.roomCode).emit('player_resigned', {
      username: player.username,
      winner: player.color === 'white' ? 'black' : 'white'
    });
    
    console.log(`房间 ${user.roomCode}: ${player.username} 投降`);
  });
  
  // 请求悔棋
  socket.on('request_undo', () => {
    const user = users.get(socket.id);
    if (!user || user.isSpectator) return;
    
    const room = rooms.get(user.roomCode);
    if (!room) return;
    
    // 通知对手
    const opponentId = Object.keys(room.players).find(id => id !== socket.id);
    if (opponentId) {
      io.to(opponentId).emit('undo_requested', {
        username: user.username
      });
    }
  });
  
  // 同意悔棋
  socket.on('accept_undo', () => {
    const user = users.get(socket.id);
    if (!user || user.isSpectator) return;
    
    const room = rooms.get(user.roomCode);
    if (!room) return;
    
    try {
      // 撤销两步（对方一步 + 自己一步）
      room.game.undo();
      room.game.undo();
      
      io.to(user.roomCode).emit('undo_accepted', {
        fen: room.game.fen(),
        turn: room.game.turn() === 'w' ? 'white' : 'black'
      });
      
      console.log(`房间 ${user.roomCode}: 悔棋成功`);
    } catch (error) {
      console.error('悔棋错误:', error);
    }
  });
  
  // 断开连接
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (!user) return;
    
    const room = rooms.get(user.roomCode);
    if (!room) {
      users.delete(socket.id);
      return;
    }
    
    if (user.isSpectator) {
      // 观战者离开
      room.spectators.delete(socket.id);
    } else {
      // 玩家离开
      const player = room.players[socket.id];
      if (player) {
        // 通知其他玩家
        socket.to(user.roomCode).emit('player_left', {
          username: player.username,
          color: player.color
        });
        
        delete room.players[socket.id];
        
        // 如果房间没有玩家了，清理房间
        if (Object.keys(room.players).length === 0 && room.spectators.size === 0) {
          rooms.delete(user.roomCode);
          console.log(`房间 ${user.roomCode} 已清理`);
        }
      }
    }
    
    users.delete(socket.id);
    console.log(`用户断开连接: ${user.username}`);
  });
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    rooms: rooms.size,
    users: users.size,
    timestamp: Date.now()
  });
});

// 获取房间信息
app.get('/room/:code', (req, res) => {
  const room = rooms.get(req.params.code);
  if (!room) {
    return res.status(404).json({ error: '房间不存在' });
  }
  
  res.json({
    code: room.code,
    playerCount: Object.keys(room.players).length,
    spectatorCount: room.spectators.size,
    createdAt: room.createdAt,
    lastActivity: room.lastActivity,
    gameState: room.game.fen()
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebChess服务器运行在端口 ${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
});