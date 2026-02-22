// 简单的服务器测试
const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ok',
    message: 'WebChess 服务器测试',
    timestamp: new Date().toISOString()
  }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ 测试服务器运行在端口 ${PORT}`);
  console.log(`📊 测试端点: http://0.0.0.0:${PORT}/`);
});

// 30秒后自动退出（用于测试）
setTimeout(() => {
  console.log('⏰ 测试完成，退出服务器');
  process.exit(0);
}, 30000);