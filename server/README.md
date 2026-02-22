# WebChess 多人对战服务器

基于 Node.js + Socket.IO 的实时国际象棋对战服务器。

## 功能特性

- 🎮 **实时对战**: WebSocket 实时通信
- 🔢 **6位房间代码**: 简单易记的房间系统
- 👥 **双人对战**: 支持2名玩家对战
- 👁️ **观战模式**: 支持多人观战
- 💬 **实时聊天**: 房间内聊天功能
- ⏰ **自动清理**: 100分钟房间自动关闭
- 🏓 **健康检查**: 服务器状态监控

## 本地开发

### 环境要求
- Node.js >= 18.0.0
- npm 或 yarn

### 安装依赖
```bash
cd server
npm install
```

### 启动开发服务器
```bash
npm run dev
```

服务器将在 http://localhost:3000 启动。

### 环境变量
复制 `.env.example` 为 `.env` 并配置：
```bash
cp .env.example .env
```

## Railway 部署

### 步骤1: 创建 Railway 账号
1. 访问 [railway.app](https://railway.app)
2. 使用 GitHub 账号登录

### 步骤2: 创建新项目
1. 点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 授权 Railway 访问你的 GitHub 仓库

### 步骤3: 部署服务器
1. 选择 `webchess/server` 目录
2. Railway 会自动检测并部署
3. 等待部署完成

### 步骤4: 获取服务器URL
部署完成后，Railway 会提供一个公开URL，例如：
```
https://webchess-server.up.railway.app
```

### 步骤5: 配置环境变量
在 Railway 项目设置中，添加以下环境变量：
- `PORT`: 3000
- `NODE_ENV`: production
- `CORS_ORIGIN`: 你的前端域名（如 https://webchess.vercel.app）

## API 端点

### WebSocket 连接
```
ws://your-server-url/socket.io
```

### REST API
- `GET /` - 服务器信息
- `GET /health` - 健康检查
- `GET /rooms` - 获取房间列表

## WebSocket 事件

### 客户端发送事件
- `createRoom` - 创建房间
- `join` - 加入房间
- `makeMove` - 走棋
- `sendMessage` - 发送聊天消息
- `gameOver` - 游戏结束
- `newGame` - 新游戏

### 服务器发送事件
- `roomCreated` - 房间创建成功
- `joinedAsPlayer` - 作为玩家加入
- `joinedAsSpectator` - 作为观战者加入
- `gameStarted` - 游戏开始
- `moveMade` - 走棋通知
- `newMessage` - 新聊天消息
- `gameEnded` - 游戏结束
- `playerJoined` - 玩家加入
- `playerLeft` - 玩家离开
- `roomClosed` - 房间关闭
- `error` - 错误信息

## 房间系统

### 房间代码
- 6位大写字母和数字组合
- 自动生成，确保唯一性

### 房间生命周期
1. **创建**: 玩家创建房间，成为白方
2. **加入**: 另一玩家加入，成为黑方
3. **游戏**: 双方开始对战
4. **观战**: 房间满员后，其他人可加入观战
5. **清理**: 100分钟无活动自动关闭

### 玩家管理
- 白方: 创建房间的玩家
- 黑方: 第二个加入的玩家
- 观战者: 房间满员后加入的用户

## 前端集成

### 连接服务器
```javascript
import { io } from 'socket.io-client';

const socket = io('https://your-server-url', {
  transports: ['websocket']
});
```

### 创建房间
```javascript
socket.emit('createRoom', {
  username: '玩家1'
});
```

### 加入房间
```javascript
socket.emit('join', {
  username: '玩家2',
  roomCode: 'ABC123'
});
```

## 监控和日志

### 健康检查
访问 `/health` 端点查看服务器状态：
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "rooms": 5,
  "users": 10,
  "uptime": 3600
}
```

### 房间状态
访问 `/rooms` 端点查看所有房间：
```json
{
  "total": 5,
  "rooms": [
    {
      "code": "ABC123",
      "players": {
        "white": "玩家1",
        "black": "玩家2"
      },
      "spectators": 3,
      "createdAt": 1704067200000,
      "lastActivity": 1704067800000,
      "gameOver": false
    }
  ]
}
```

## 故障排除

### 常见问题
1. **连接失败**: 检查服务器URL和CORS配置
2. **房间不存在**: 确认房间代码正确，房间未过期
3. **无法走棋**: 检查是否是当前回合
4. **聊天不显示**: 检查消息格式和事件监听

### 日志查看
在 Railway 控制台查看实时日志：
1. 进入项目
2. 点击 "Logs" 标签页
3. 查看服务器输出

## 性能优化

### 建议配置
- **内存**: 至少 512MB
- **CPU**: 至少 0.5 vCPU
- **实例数**: 1-2个（根据负载调整）

### 扩展建议
1. **Redis**: 添加Redis用于会话存储
2. **负载均衡**: 多实例部署
3. **CDN**: 静态资源使用CDN

## 安全考虑

1. **输入验证**: 所有用户输入都经过验证
2. **CORS限制**: 只允许信任的域名
3. **速率限制**: 考虑添加API速率限制
4. **HTTPS**: Railway 自动提供HTTPS

## 许可证

MIT