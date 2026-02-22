#!/bin/bash

# WebChess 服务器部署脚本
# 用于部署到 Railway

set -e

echo "🚀 开始部署 WebChess 服务器到 Railway..."

# 检查是否已安装 Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI 未安装"
    echo "请先安装 Railway CLI:"
    echo "  npm install -g @railway/cli"
    echo "然后运行: railway login"
    exit 1
fi

# 检查是否已登录
if ! railway status &> /dev/null; then
    echo "❌ 未登录 Railway"
    echo "请运行: railway login"
    exit 1
fi

echo "✅ Railway CLI 已安装并登录"

# 创建 railway.toml 配置文件
echo "📝 创建 railway.toml 配置文件..."
cat > railway.toml << EOF
[build]
builder = "nixpacks"
watchPatterns = ["server/**"]

[deploy]
healthcheckPath = "/health"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3

[[services]]
name = "webchess-server"
port = 3000
EOF

echo "✅ railway.toml 配置文件已创建"

# 部署到 Railway
echo "🚂 部署到 Railway..."
railway up --service webchess-server

echo ""
echo "🎉 部署完成！"
echo ""
echo "📋 下一步操作："
echo "1. 在 Railway 控制台获取服务器 URL"
echo "2. 配置前端连接到服务器 URL"
echo "3. 测试多人对战功能"
echo ""
echo "🔗 Railway 控制台: https://railway.app"
echo ""
echo "💡 提示："
echo "- 运行 'railway logs' 查看服务器日志"
echo "- 运行 'railway status' 查看部署状态"
echo "- 运行 'railway environment' 管理环境变量"