// 最简单的服务器 - 专门解决 Railway 部署问题
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// 最基本的中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 根路由
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'WebChess Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    message: '服务器运行正常'
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 测试端点
app.get('/test', (req, res) => {
  res.json({
    message: '测试成功',
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    error: '未找到端点',
    path: req.path,
    method: req.method
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    error: '服务器内部错误',
    message: err.message
  });
});

// 启动服务器
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ WebChess 服务器启动成功`);
  console.log(`📡 端口: ${PORT}`);
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🕒 启动时间: ${new Date().toISOString()}`);
  console.log(`🔗 访问地址: http://0.0.0.0:${PORT}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

// 导出给测试使用
module.exports = app;