# Railway 部署指南

## 🚀 快速部署

### 方法1: 自动部署（推荐）
1. 访问 https://railway.app
2. 点击 "Start a New Project"
3. 选择 "Deploy from GitHub repo"
4. 授权 GitHub 账号
5. 选择 `Maxaccurate/Webchess_New` 仓库
6. Railway 会自动检测并部署

### 方法2: 手动配置
如果自动部署失败，手动配置：

#### 构建设置:
- **构建命令**: `npm install`
- **输出目录**: `.` (当前目录)

#### 启动设置:
- **启动命令**: `npm start`
- **端口**: `3000`

#### 环境变量:
```
PORT=3000
NODE_ENV=production
```

## 🔧 故障排除

### 常见问题1: 构建失败
**错误**: `npm install` 失败

**解决方案**:
1. 在 Railway 项目设置中，手动设置构建命令:
   ```
   cd server && npm install
   ```
2. 或者使用预构建的依赖

### 常见问题2: 启动失败
**错误**: 服务器无法启动

**解决方案**:
1. 检查启动命令是否正确
2. 确保 `minimal-server.js` 存在
3. 检查端口是否被占用

### 常见问题3: 健康检查失败
**错误**: `/health` 端点无响应

**解决方案**:
1. 检查服务器是否正在运行
2. 查看 Railway 日志
3. 测试本地运行: `npm start`

## 📊 验证部署

部署成功后，访问以下端点验证:

### 1. 健康检查
```
GET https://你的域名/health
```
**预期响应**:
```json
{
  "status": "healthy",
  "uptime": 123.45,
  "timestamp": "2026-02-22T14:51:00.000Z"
}
```

### 2. 根端点
```
GET https://你的域名/
```
**预期响应**:
```json
{
  "status": "ok",
  "service": "WebChess Server",
  "version": "1.0.0",
  "timestamp": "2026-02-22T14:51:00.000Z",
  "message": "服务器运行正常"
}
```

### 3. 测试端点
```
GET https://你的域名/test
```
**预期响应**:
```json
{
  "message": "测试成功",
  "environment": "production",
  "port": 3000
}
```

## 🎯 部署后步骤

### 1. 获取域名
部署完成后，Railway 会提供一个域名，如:
```
https://webchess-server.up.railway.app
```

### 2. 配置前端
在前端项目中，配置服务器 URL:
```env
VITE_API_URL_PROD=https://你的域名
VITE_WS_URL_PROD=wss://你的域名
```

### 3. 更新 CORS
如果需要，在 Railway 环境变量中添加:
```
CORS_ORIGIN=https://你的前端域名
```

## 📝 文件说明

### 核心文件
- `minimal-server.js` - 最简单的服务器，确保部署成功
- `railway-start.js` - 完整的 WebSocket 服务器（部署成功后启用）
- `package.json` - 项目配置和依赖

### 辅助文件
- `deploy-railway.sh` - 部署脚本
- `test-server.js` - 测试服务器
- `railway.config.js` - Railway 配置

## 🔄 切换到完整服务器

部署成功后，可以切换到完整的 WebSocket 服务器:

### 步骤1: 修改 package.json
```json
"main": "railway-start.js",
"scripts": {
  "start": "node railway-start.js"
}
```

### 步骤2: 重新部署
Railway 会自动重新部署

### 步骤3: 测试 WebSocket
访问前端，测试多人对战功能

## 📞 支持

### 查看日志
```bash
# 在 Railway 控制台查看
railway logs
```

### 重启服务
在 Railway 控制台点击 "Restart"

### 联系支持
如果问题持续，联系 Railway 支持或查看文档

---

**部署状态**: 🟡 等待部署  
**最后更新**: 2026-02-22  
**维护者**: Max Chen  

> 提示: 先使用 `minimal-server.js` 确保部署成功，然后再切换到完整功能。