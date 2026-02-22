// Vercel Serverless Function - 房间管理
// 简单的内存存储（Vercel Serverless 是无状态的，生产环境需要数据库）
const rooms = new Map();

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method === 'GET') {
    // 获取房间列表
    const roomList = Array.from(rooms.values()).map(room => ({
      code: room.code,
      players: room.players,
      spectators: room.spectators.length,
      createdAt: room.createdAt
    }));
    
    res.status(200).json({
      rooms: roomList,
      count: roomList.length,
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  if (req.method === 'POST') {
    // 创建房间
    try {
      const { username } = req.body;
      
      if (!username || username.trim() === '') {
        res.status(400).json({ error: '用户名不能为空' });
        return;
      }
      
      // 生成6位房间代码
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code;
      do {
        code = '';
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
      } while (rooms.has(code));
      
      const room = {
        code,
        players: {
          white: { username, joinedAt: Date.now() },
          black: null
        },
        spectators: [],
        gameState: {
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          history: [],
          turn: 'w',
          gameOver: false
        },
        chat: [],
        createdAt: Date.now(),
        lastActivity: Date.now()
      };
      
      rooms.set(code, room);
      
      // 清理过期房间（24小时）
      const now = Date.now();
      for (const [roomCode, roomData] of rooms.entries()) {
        if (now - roomData.createdAt > 24 * 60 * 60 * 1000) {
          rooms.delete(roomCode);
        }
      }
      
      res.status(201).json({
        success: true,
        roomCode: code,
        color: 'white',
        message: '房间创建成功'
      });
      
    } catch (error) {
      console.error('创建房间错误:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
    return;
  }
  
  res.status(405).json({ error: '方法不允许' });
}