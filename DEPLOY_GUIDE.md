# WebChess 部署指南

## 🚀 Railway 部署（现在做）

### 步骤1: 删除旧项目
1. 访问 https://railway.app
2. 找到之前的项目
3. 点击设置 → 删除项目

### 步骤2: 创建新项目
1. 点击 "Start a New Project"
2. 选择 "Deploy from GitHub repo"
3. 授权 GitHub 账号
4. 选择 `Maxaccurate/Webchess_New` 仓库

### 步骤3: 手动配置
部署时，**手动设置以下配置**：

#### 构建设置:
- **构建命令**: `cd server && npm install`
- **输出目录**: `.`

#### 启动设置:
- **启动命令**: `npm start`
- **端口**: `3000`

#### 环境变量:
```
PORT=3000
NODE_ENV=production
```

### 步骤4: 验证部署
部署成功后，访问：
1. `https://你的域名/health` - 应该返回健康状态
2. `https://你的域名/` - 应该返回服务器信息

## 🎯 Vercel 部署（Railway 成功后做）

### 步骤1: 部署前端
1. 访问 https://vercel.com
2. 点击 "Add New" → "Project"
3. 导入 `Maxaccurate/Webchess_New` 仓库
4. 使用 GitHub 账号授权

### 步骤2: 配置环境变量
在 Vercel 项目设置中，添加：
```
VITE_API_URL=https://你的Railway域名
VITE_WS_URL=wss://你的Railway域名
```

### 步骤3: 获取前端 URL
部署完成后，Vercel 会提供 URL，如：
```
https://webchess.vercel.app
```

## 🔧 故障排除

### Railway 部署失败
**问题**: `Error: Cannot find module 'express'`

**解决方案**:
1. 确保使用 `simple-server.js`（无依赖版本）
2. 手动设置构建命令为 `cd server && npm install`
3. 如果还失败，尝试删除 `node_modules` 重新部署

### Vercel 部署失败
**问题**: 构建错误

**解决方案**:
1. 检查 Vite 配置
2. 确保依赖正确安装
3. 查看构建日志

### 连接问题
**问题**: 前端无法连接后端

**解决方案**:
1. 检查环境变量是否正确
2. 验证 Railway 服务器是否运行
3. 检查 CORS 设置

## 📊 验证清单

### Railway 验证
- [ ] `https://域名/health` 返回健康状态
- [ ] `https://域名/` 返回服务器信息
- [ ] 服务器日志显示正常运行

### Vercel 验证
- [ ] 前端页面正常加载
- [ ] 控制台无错误
- [ ] 可以创建/加入房间

### 功能验证
- [ ] AI 对战功能正常
- [ ] 计时器可自定义
- [ ] 多人对战可连接
- [ ] 聊天功能正常

## 📞 支持

### 查看日志
```bash
# Railway 日志
railway logs

# Vercel 日志
vercel logs
```

### 重启服务
- Railway: 控制台点击 "Restart"
- Vercel: 重新部署

### 紧急联系方式
如果部署持续失败：
1. 截图错误日志
2. 发送给我
3. 我会提供解决方案

---

**部署状态**: 🟡 等待 Railway 部署  
**最后更新**: 2026-02-22  
**维护者**: Max Chen  

> 提示: 先确保 Railway 部署成功，再部署 Vercel。