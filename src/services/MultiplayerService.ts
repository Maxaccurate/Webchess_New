import { io, Socket } from 'socket.io-client';

// 服务器URL配置
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

// 游戏状态接口
export interface GameState {
  fen: string;
  history: Array<{
    move: string;
    player: string;
    color: string;
    timestamp: number;
  }>;
  turn: 'w' | 'b';
  gameOver: boolean;
  winner: string | null;
  reason: string | null;
}

// 玩家信息接口
export interface PlayerInfo {
  socketId: string;
  username: string;
  color: 'white' | 'black';
  joinedAt: number;
}

// 房间信息接口
export interface RoomInfo {
  code: string;
  players: {
    white: PlayerInfo | null;
    black: PlayerInfo | null;
  };
  spectators: Array<{
    socketId: string;
    username: string;
  }>;
  gameState: GameState;
  chat: Array<{
    id: string;
    username: string;
    message: string;
    timestamp: number;
    color?: string;
  }>;
  createdAt: number;
  lastActivity: number;
}

// 聊天消息接口
export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: number;
  color?: string;
}

// 多人对战服务类
class MultiplayerService {
  private socket: Socket | null = null;
  private roomCode: string | null = null;
  private username: string | null = null;
  private playerColor: 'white' | 'black' | 'spectator' | null = null;
  
  // 事件监听器
  private listeners: {
    [event: string]: Array<(data: any) => void>;
  } = {};

  constructor() {
    this.setupEventListeners();
  }

  // 连接到服务器
  public connect(): void {
    if (this.socket?.connected) {
      console.log('已经连接到服务器');
      return;
    }

    this.socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupSocketListeners();
    console.log('正在连接到服务器:', SERVER_URL);
  }

  // 断开连接
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.roomCode = null;
      this.username = null;
      this.playerColor = null;
      console.log('已断开服务器连接');
    }
  }

  // 创建房间
  public createRoom(username: string): void {
    if (!this.socket) {
      this.connect();
    }

    this.username = username;
    
    this.socket?.emit('createRoom', { username });
    console.log(`创建房间，用户名: ${username}`);
  }

  // 加入房间
  public joinRoom(username: string, roomCode: string): void {
    if (!this.socket) {
      this.connect();
    }

    this.username = username;
    this.roomCode = roomCode.toUpperCase();
    
    this.socket?.emit('join', { username, roomCode: this.roomCode });
    console.log(`加入房间 ${this.roomCode}，用户名: ${username}`);
  }

  // 走棋
  public makeMove(move: string, fen: string): void {
    if (!this.socket || !this.roomCode) {
      console.error('未连接到房间');
      return;
    }

    this.socket.emit('makeMove', { roomCode: this.roomCode, move, fen });
  }

  // 发送聊天消息
  public sendMessage(message: string): void {
    if (!this.socket || !this.roomCode) {
      console.error('未连接到房间');
      return;
    }

    this.socket.emit('sendMessage', { roomCode: this.roomCode, message });
  }

  // 游戏结束
  public gameOver(winner: string, reason: string): void {
    if (!this.socket || !this.roomCode) {
      console.error('未连接到房间');
      return;
    }

    this.socket.emit('gameOver', { roomCode: this.roomCode, winner, reason });
  }

  // 新游戏
  public newGame(): void {
    if (!this.socket || !this.roomCode) {
      console.error('未连接到房间');
      return;
    }

    this.socket.emit('newGame', { roomCode: this.roomCode });
  }

  // 离开房间
  public leaveRoom(): void {
    if (this.socket && this.roomCode) {
      // Socket.IO 会自动处理断开连接
      this.roomCode = null;
      this.playerColor = null;
      console.log('离开房间');
    }
  }

  // 获取当前房间信息
  public getCurrentRoom(): { code: string | null; color: string | null } {
    return {
      code: this.roomCode,
      color: this.playerColor
    };
  }

  // 获取当前用户名
  public getUsername(): string | null {
    return this.username;
  }

  // 检查是否已连接
  public isConnected(): boolean {
    return !!this.socket?.connected;
  }

  // 检查是否在房间中
  public isInRoom(): boolean {
    return !!this.roomCode;
  }

  // 设置事件监听器
  private setupEventListeners(): void {
    // 预定义事件类型
    const events = [
      'connected',
      'disconnected',
      'roomCreated',
      'joinedAsPlayer',
      'joinedAsSpectator',
      'gameStarted',
      'moveMade',
      'newMessage',
      'gameEnded',
      'playerJoined',
      'playerLeft',
      'roomClosed',
      'error'
    ];

    events.forEach(event => {
      this.listeners[event] = [];
    });
  }

  // 设置Socket监听器
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // 连接成功
    this.socket.on('connect', () => {
      console.log('连接到服务器成功');
      this.emit('connected', {});
    });

    // 连接断开
    this.socket.on('disconnect', () => {
      console.log('与服务器断开连接');
      this.emit('disconnected', {});
    });

    // 房间创建成功
    this.socket.on('roomCreated', (data) => {
      console.log('房间创建成功:', data.roomCode);
      this.roomCode = data.roomCode;
      this.playerColor = 'white';
      this.emit('roomCreated', data);
    });

    // 作为玩家加入
    this.socket.on('joinedAsPlayer', (data) => {
      console.log(`作为玩家加入: ${data.color}`);
      this.roomCode = data.roomCode;
      this.playerColor = data.color;
      this.emit('joinedAsPlayer', data);
    });

    // 作为观战者加入
    this.socket.on('joinedAsSpectator', (data) => {
      console.log('作为观战者加入');
      this.roomCode = data.roomCode;
      this.playerColor = 'spectator';
      this.emit('joinedAsSpectator', data);
    });

    // 游戏开始
    this.socket.on('gameStarted', (data) => {
      console.log('游戏开始');
      this.emit('gameStarted', data);
    });

    // 走棋通知
    this.socket.on('moveMade', (data) => {
      console.log(`走棋: ${data.move} by ${data.player}`);
      this.emit('moveMade', data);
    });

    // 新聊天消息
    this.socket.on('newMessage', (data) => {
      this.emit('newMessage', data);
    });

    // 游戏结束
    this.socket.on('gameEnded', (data) => {
      console.log(`游戏结束: ${data.winner} 胜利`);
      this.emit('gameEnded', data);
    });

    // 玩家加入
    this.socket.on('playerJoined', (data) => {
      console.log(`玩家加入: ${data.username}`);
      this.emit('playerJoined', data);
    });

    // 玩家离开
    this.socket.on('playerLeft', (data) => {
      console.log(`玩家离开: ${data.username}`);
      this.emit('playerLeft', data);
    });

    // 房间关闭
    this.socket.on('roomClosed', (data) => {
      console.log(`房间关闭: ${data.reason}`);
      this.roomCode = null;
      this.playerColor = null;
      this.emit('roomClosed', data);
    });

    // 错误信息
    this.socket.on('error', (data) => {
      console.error('服务器错误:', data.message);
      this.emit('error', data);
    });
  }

  // 添加事件监听
  public on(event: string, callback: (data: any) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  // 移除事件监听
  public off(event: string, callback: (data: any) => void): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  // 触发事件
  private emit(event: string, data: any): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`事件监听器错误 (${event}):`, error);
        }
      });
    }
  }
}

// 创建单例实例
const multiplayerService = new MultiplayerService();

export default multiplayerService;