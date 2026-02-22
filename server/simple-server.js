// 超简单的服务器 - 专门解决 Railway 依赖问题
const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // 路由处理
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'WebChess Server',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      message: '服务器运行正常'
    }));
    return;
  }
  
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage()
    }));
    return;
  }
  
  if (req.url === '/test' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: '测试成功',
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
      nodeVersion: process.version
    }));
    return;
  }
  
  // 404 处理
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: '未找到端点',
    path: req.url,
    method: req.method
  }));
});

// 启动服务器
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ WebChess 服务器启动成功`);
  console.log(`📡 端口: ${PORT}`);
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🕒 启动时间: ${new Date().toISOString()}`);
  console.log(`🔗 访问地址: http://0.0.0.0:${PORT}`);
  console.log(`📊 健康检查: http://0.0.0.0:${PORT}/health`);
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

// 错误处理
server.on('error', (error) => {
  console.error('服务器错误:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`端口 ${PORT} 已被占用`);
    process.exit(1);
  }
});

console.log('🚀 服务器正在启动...');