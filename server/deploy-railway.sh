#!/bin/bash

# Railway 部署脚本
echo "🚀 开始部署 WebChess 服务器到 Railway..."

# 检查必要文件
echo "📁 检查项目文件..."
if [ ! -f "package.json" ]; then
    echo "❌ 错误: package.json 不存在"
    exit 1
fi

if [ ! -f "minimal-server.js" ]; then
    echo "❌ 错误: minimal-server.js 不存在"
    exit 1
fi

echo "✅ 项目文件检查通过"

# 安装依赖
echo "📦 安装依赖..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo "✅ 依赖安装完成"

# 检查端口
PORT=${PORT:-3000}
echo "🔌 使用端口: $PORT"

# 启动服务器测试
echo "🚀 启动服务器测试..."
node minimal-server.js &

# 等待服务器启动
sleep 3

# 测试服务器
echo "🧪 测试服务器连接..."
curl -f http://localhost:$PORT/health

if [ $? -eq 0 ]; then
    echo "✅ 服务器测试成功"
    # 停止测试服务器
    pkill -f "node minimal-server.js"
    echo "🛑 测试服务器已停止"
else
    echo "❌ 服务器测试失败"
    pkill -f "node minimal-server.js"
    exit 1
fi

echo ""
echo "🎉 部署准备完成！"
echo "📋 服务器信息:"
echo "   - 主文件: minimal-server.js"
echo "   - 端口: $PORT"
echo "   - 健康检查: /health"
echo "   - 根端点: /"
echo ""
echo "🚂 现在可以部署到 Railway 了！"