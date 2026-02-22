# WebChess 部署指南

## 🚀 快速开始

### 1. GitHub 仓库
- 地址: https://github.com/Maxaccurate/Webchess_New
- 分支: main
- 状态: ✅ 代码已推送

### 2. Railway 部署（多人对战服务器）

#### 步骤：
1. **访问 Railway**: https://railway.app
2. **创建新项目**: "Start a New Project"
3. **选择仓库**: "Deploy from GitHub repo"
4. **授权**: 使用 GitHub 账号登录并授权
5. **选择仓库**: `Maxaccurate/Webchess_New`
6. **配置服务**:
   - 服务名称: `webchess-server`
   - 根目录: `server`
   - 端口: `3000`
7. **环境变量** (部署后在 Railway 设置中添加):
   ```
   PORT=3000
   NODE_ENV=production
   CORS_ORIGIN=https://webchess.vercel.app
   ```
8. **获取服务器 URL**:
   - 部署完成后，在 "Domains" 部分获取 URL
   - 格式: `https://webchess-server.up.railway.app`

### 3. Vercel 部署（前端）

#### 步骤：
1. **访问 Vercel**: https://vercel.com
2. **创建新项目**: "Add New" → "Project"
3. **导入仓库**: 选择 `Maxaccurate/Webchess_New`
4. **配置项目**:
   - Framework Preset: Vite
   - Root Directory: `.` (根目录)
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **环境变量** (可选):
   ```
   VITE_APP_NAME=WebChess
   VITE_APP_DESCRIPTION=Web-based chess game with AI对战 and multiplayer
   ```
6. **部署**: 点击 "Deploy"
7. **获取前端 URL**:
   - 格式: `https://webchess.vercel.app`

## 🔧 配置连接

### 前端连接后端
部署完成后，需要更新前端配置以连接 Railway 服务器：

1. **在 Vercel 环境变量中添加**:
   ```
   VITE_WS_URL_PROD=wss://你的-railway-服务器.up.railway.app
   VITE_API_URL_PROD=https://你的-railway-服务器.up.railway.app
   ```

2. **在 Railway 环境变量中更新 CORS**:
   ```
   CORS_ORIGIN=https://你的-vercel-域名.vercel.app
   ```

## 📊 部署状态检查

使用检查脚本验证部署状态：

```bash
# 检查 GitHub 仓库
python check_deployment.py

# 检查 Railway 服务器（部署后）
python check_deployment.py --railway https://你的-railway-服务器.up.railway.app

# 保存服务器 URL 到配置
python check_deployment.py --railway https://你的-railway-服务器.up.railway.app --save
```

## 🎮 功能测试

部署完成后，测试以下功能：

### 1. AI 对战
- 选择不同难度 (100-3000分)
- 测试计时器功能
- 验证游戏规则

### 2. 本地双人
- 同一设备双人对战
- 计时器同步
- 游戏状态管理

### 3. 多人对战
- 创建房间 (6位代码)
- 加入房间
- 实时对战
- 聊天功能
- 100分钟自动清理

### 4. 计时器
- 自定义时间 (1-60分钟)
- 菲舍尔加时 (1-60秒)
- 双时钟显示
- 时间颜色提示

## ⚠️ 故障排除

### 常见问题

#### 1. Railway 部署失败
- 检查 `server/package.json` 是否存在
- 确认 Node.js 版本 >= 18
- 查看 Railway 日志

#### 2. WebSocket 连接失败
- 检查 Railway 服务器 URL
- 确认 CORS 配置正确
- 验证 WebSocket 协议 (ws:// 或 wss://)

#### 3. Vercel 构建失败
- 检查 `package.json` 脚本
- 确认依赖安装成功
- 查看构建日志

#### 4. 多人对战无法连接
- 检查服务器健康状态: `https://服务器URL/health`
- 验证环境变量配置
- 检查浏览器控制台错误

### 日志查看

#### Railway 日志
```bash
# 在 Railway 控制台查看
railway logs
```

#### Vercel 日志
- 在 Vercel 项目页面查看部署日志
- 检查构建输出

## 🔒 安全建议

### 1. GitHub Token
- 使用后立即撤销
- 仅授予必要权限
- 不要在代码中硬编码

### 2. 环境变量
- 保护敏感信息
- 使用平台提供的 secrets 管理
- 定期轮换

### 3. CORS 配置
- 仅允许信任的域名
- 生产环境禁用通配符
- 定期审查配置

### 4. 服务器安全
- 启用 HTTPS
- 设置适当的超时
- 监控异常请求

## 📈 监控和维护

### 1. 健康检查
- 定期访问 `/health` 端点
- 监控服务器响应时间
- 检查房间和用户数量

### 2. 性能监控
- 监控内存使用
- 检查 CPU 负载
- 跟踪网络流量

### 3. 日志管理
- 保留访问日志
- 监控错误日志
- 定期清理旧日志

### 4. 备份策略
- 定期备份配置
- 导出重要数据
- 测试恢复流程

## 🔄 更新部署

### 代码更新
```bash
# 1. 本地修改代码
git add .
git commit -m "更新描述"
git push

# 2. 自动部署
# Railway 和 Vercel 会自动检测并部署
```

### 配置更新
1. **Railway**: 在项目设置中更新环境变量
2. **Vercel**: 在项目设置中更新环境变量
3. **重启服务** (如果需要)

## 📞 支持

### 问题反馈
1. 检查部署日志
2. 查看错误信息
3. 提供复现步骤

### 紧急情况
1. 重启服务
2. 回滚到稳定版本
3. 联系平台支持

---

**部署状态**: 🟢 准备就绪  
**最后更新**: 2026-02-22  
**维护者**: Max Chen  

> 提示: 部署完成后，请测试所有功能并更新此文档中的 URL。