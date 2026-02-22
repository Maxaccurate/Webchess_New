// Railway 部署配置
// 这个文件帮助 Railway 正确部署应用

module.exports = {
  // Railway 需要的配置
  build: {
    // 构建命令
    command: 'npm install',
    // 输出目录
    output: '.'
  },
  
  // 环境变量默认值
  env: {
    NODE_ENV: 'production',
    PORT: '3000'
  },
  
  // 健康检查配置
  healthcheck: {
    path: '/health',
    interval: '30s',
    timeout: '10s',
    retries: 3
  },
  
  // 部署后检查
  deploy: {
    // 部署后运行的命令
    postdeploy: 'echo "部署完成！"'
  }
};