import React, { useState, useEffect } from 'react';
import multiplayerService, { Room, Player } from '../services/MultiplayerService';

interface MultiplayerLobbyProps {
  onJoinRoom: (roomCode: string, username: string) => void;
  onCreateRoom: (username: string) => void;
}

const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({ onJoinRoom, onCreateRoom }) => {
  const [username, setUsername] = useState<string>('');
  const [roomCode, setRoomCode] = useState<string>('');
  const [activeRooms, setActiveRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');

  // 检查连接状态
  useEffect(() => {
    const checkConnection = () => {
      const connected = multiplayerService.isConnected();
      setConnectionStatus(connected ? 'connected' : 'disconnected');
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  // 生成随机房间代码
  const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRoomCode(code);
  };

  // 获取活跃房间列表
  const fetchActiveRooms = async () => {
    try {
      setLoading(true);
      // 这里可以调用服务器API获取房间列表
      // 暂时模拟一些房间
      const mockRooms: Room[] = [
        {
          code: 'ABC123',
          players: [
            { id: '1', username: '玩家1', color: 'w', joinedAt: Date.now(), ready: true }
          ],
          spectators: [],
          gameState: {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            turn: 'w',
            history: [],
            status: 'waiting'
          },
          chat: [],
          settings: {
            timer: {
              whiteTime: 600000,
              blackTime: 600000,
              increment: 0
            }
          },
          createdAt: Date.now(),
          lastActivity: Date.now(),
          status: 'waiting'
        },
        {
          code: 'DEF456',
          players: [
            { id: '2', username: '玩家2', color: 'w', joinedAt: Date.now(), ready: true },
            { id: '3', username: '玩家3', color: 'b', joinedAt: Date.now(), ready: false }
          ],
          spectators: [],
          gameState: {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            turn: 'w',
            history: [],
            status: 'ready'
          },
          chat: [],
          settings: {
            timer: {
              whiteTime: 600000,
              blackTime: 600000,
              increment: 0
            }
          },
          createdAt: Date.now(),
          lastActivity: Date.now(),
          status: 'ready'
        }
      ];
      
      setActiveRooms(mockRooms);
    } catch (error) {
      console.error('获取房间列表失败:', error);
      setError('无法获取房间列表');
    } finally {
      setLoading(false);
    }
  };

  // 处理加入房间
  const handleJoinRoom = () => {
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    
    if (!roomCode.trim()) {
      setError('请输入房间代码');
      return;
    }
    
    if (!multiplayerService.isConnected()) {
      setError('未连接到服务器');
      return;
    }
    
    onJoinRoom(roomCode.toUpperCase(), username);
  };

  // 处理创建房间
  const handleCreateRoom = () => {
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    
    if (!multiplayerService.isConnected()) {
      setError('未连接到服务器');
      return;
    }
    
    const newRoomCode = roomCode || generateRoomCode();
    onCreateRoom(username);
  };

  // 处理快速加入
  const handleQuickJoin = () => {
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    
    if (activeRooms.length > 0) {
      const availableRoom = activeRooms.find(room => room.players.length < 2);
      if (availableRoom) {
        onJoinRoom(availableRoom.code, username);
      } else {
        setError('没有可用的房间，请创建新房间');
      }
    } else {
      setError('没有活跃的房间，请创建新房间');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
        多人对战大厅
      </h2>

      {/* 连接状态 */}
      <div className="mb-6">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          connectionStatus === 'connected' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${
            connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          {connectionStatus === 'connected' ? '已连接到服务器' : '未连接到服务器'}
        </div>
      </div>

      {/* 用户名输入 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          用户名
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="输入你的用户名"
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          maxLength={20}
        />
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          最多20个字符，不支持特殊符号
        </p>
      </div>

      {/* 房间代码输入 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            房间代码
          </label>
          <button
            onClick={generateRoomCode}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            生成随机代码
          </button>
        </div>
        <input
          type="text"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          placeholder="输入6位房间代码"
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
          maxLength={6}
          pattern="[A-Z0-9]{6}"
        />
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          6位大写字母或数字，例如：ABC123
        </p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={handleCreateRoom}
          disabled={!username.trim() || !multiplayerService.isConnected()}
          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          创建房间
        </button>
        
        <button
          onClick={handleJoinRoom}
          disabled={!username.trim() || !roomCode.trim() || !multiplayerService.isConnected()}
          className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          加入房间
        </button>
        
        <button
          onClick={handleQuickJoin}
          disabled={!username.trim() || !multiplayerService.isConnected()}
          className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          快速加入
        </button>
      </div>

      {/* 活跃房间列表 */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            活跃房间
          </h3>
          <button
            onClick={fetchActiveRooms}
            disabled={loading}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            {loading ? '刷新中...' : '刷新列表'}
          </button>
        </div>

        {activeRooms.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>暂无活跃房间</p>
            <p className="text-sm mt-2">创建新房间开始游戏</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeRooms.map((room) => (
              <div
                key={room.code}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="font-mono font-bold text-lg text-gray-800 dark:text-white">
                      {room.code}
                    </span>
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      room.status === 'waiting' 
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : room.status === 'ready'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {room.status === 'waiting' ? '等待中' : room.status === 'ready' ? '已准备' : '游戏中'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (username.trim()) {
                        onJoinRoom(room.code, username);
                      } else {
                        setError('请先输入用户名');
                      }
                    }}
                    disabled={room.players.length >= 2}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {room.players.length >= 2 ? '已满' : '加入'}
                  </button>
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-gray-400 mr-2"></div>
                      <span>玩家: {room.players.length}/2</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-gray-400 mr-2"></div>
                      <span>观众: {room.spectators.length}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-gray-400 mr-2"></div>
                      <span>创建时间: {new Date(room.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  
                  {room.players.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">当前玩家:</p>
                      <div className="flex flex-wrap gap-2">
                        {room.players.map((player: Player) => (
                          <div
                            key={player.id}
                            className="flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded"
                          >
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              player.color === 'w' ? 'bg-gray-300' : 'bg-gray-800'
                            }`}></div>
                            <span className="text-sm">{player.username}</span>
                            {player.ready && (
                              <span className="ml-2 text-xs text-green-600 dark:text-green-400">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 使用说明 */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          使用说明
        </h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• 输入用户名和房间代码加入现有房间</li>
          <li>• 点击"创建房间"生成新房间并等待对手加入</li>
          <li>• 点击"快速加入"自动加入有空位的房间</li>
          <li>• 房间100分钟无活动会自动清理</li>
          <li>• 最多2名玩家，观众数量不限</li>
        </ul>
      </div>
    </div>
  );
};

export default MultiplayerLobby;