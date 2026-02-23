export default function handler(req, res) {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'WebChess API',
    version: '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
}