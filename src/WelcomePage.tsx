import { useEffect, useState } from 'react';

function WelcomePage({ onContinue }: { onContinue: () => void }) {
  const [serverStatus, setServerStatus] = useState<'loading' | 'online' | 'offline'>('loading');
  const [domain, setDomain] = useState('');

  useEffect(() => {
    // 获取当前域名
    const currentDomain = window.location.hostname;
    setDomain(currentDomain);

    // 检查服务器状态
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch (error) {
      console.error('服务器检查失败:', error);
      setServerStatus('offline');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col items-center justify-center p-4">
      {/* 主内容 */}
      <div className="max-w-4xl w-full">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl flex items-center justify-center shadow-2xl">
              <span className="text-3xl">♔</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              WebChess
            </h1>
          </div>
          
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            欢迎使用你的专属国际象棋平台！现在部署在
          </p>
          
          {/* 域名展示 */}
          <div className="inline-flex items-center px-6 py-4 bg-gray-800/50 rounded-xl border-2 border-blue-500/30 backdrop-blur-sm mb-8">
            <div className="mr-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-xl">🌐</span>
              </div>
            </div>
            <div className="text-left">
              <div className="text-sm text-gray-400 mb-1">你的专属域名</div>
              <code className="text-2xl md:text-3xl font-mono text-blue-400 font-bold">
                {domain}
              </code>
            </div>
          </div>

          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
            这是一个功能完整的国际象棋平台，支持 AI 对战、多人游戏和自定义计时器。
            所有功能都已准备就绪！
          </p>
        </div>

        {/* 状态面板 */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🚀</span>
              </div>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
                已部署
              </span>
            </div>
            <h3 className="text-xl font-bold mb-2">前端应用</h3>
            <p className="text-gray-400 text-sm">
              React + TypeScript + Vite + Tailwind CSS
            </p>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <span className={`px-3 py-1 text-sm rounded-full ${
                serverStatus === 'online' ? 'bg-green-500/20 text-green-400' :
                serverStatus === 'offline' ? 'bg-red-500/20 text-red-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {serverStatus === 'online' ? '在线' :
                 serverStatus === 'offline' ? '离线' :
                 '检查中'}
              </span>
            </div>
            <h3 className="text-xl font-bold mb-2">API 服务器</h3>
            <p className="text-gray-400 text-sm">
              Vercel Serverless Functions
            </p>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔒</span>
              </div>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full">
                已配置
              </span>
            </div>
            <h3 className="text-xl font-bold mb-2">安全连接</h3>
            <p className="text-gray-400 text-sm">
              自动 HTTPS + SSL 证书
            </p>
          </div>
        </div>

        {/* 功能特性 */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">✨ 核心功能</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-800/20 rounded-lg p-4 flex items-center space-x-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <span className="text-lg">🤖</span>
              </div>
              <div>
                <div className="font-semibold">AI 对战</div>
                <div className="text-sm text-gray-400">离线智能对战</div>
              </div>
            </div>
            <div className="bg-gray-800/20 rounded-lg p-4 flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-lg">👥</span>
              </div>
              <div>
                <div className="font-semibold">多人游戏</div>
                <div className="text-sm text-gray-400">实时在线对战</div>
              </div>
            </div>
            <div className="bg-gray-800/20 rounded-lg p-4 flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-lg">⏰</span>
              </div>
              <div>
                <div className="font-semibold">自定义计时器</div>
                <div className="text-sm text-gray-400">分钟+秒数调整</div>
              </div>
            </div>
            <div className="bg-gray-800/20 rounded-lg p-4 flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <span className="text-lg">💬</span>
              </div>
              <div>
                <div className="font-semibold">实时聊天</div>
                <div className="text-sm text-gray-400">游戏内交流</div>
              </div>
            </div>
            <div className="bg-gray-800/20 rounded-lg p-4 flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <span className="text-lg">🔄</span>
              </div>
              <div>
                <div className="font-semibold">棋盘翻转</div>
                <div className="text-sm text-gray-400">切换视角</div>
              </div>
            </div>
            <div className="bg-gray-800/20 rounded-lg p-4 flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                <span className="text-lg">📱</span>
              </div>
              <div>
                <div className="font-semibold">响应式设计</div>
                <div className="text-sm text-gray-400">手机/平板/电脑</div>
              </div>
            </div>
          </div>
        </div>

        {/* 开始按钮 */}
        <div className="text-center">
          <button
            onClick={onContinue}
            className="px-12 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-bold text-lg hover:opacity-90 transition-all transform hover:scale-105 shadow-2xl"
          >
            🎮 开始使用 WebChess
          </button>
          <p className="text-gray-400 mt-4">
            点击按钮进入完整的国际象棋平台
          </p>
        </div>

        {/* 部署信息 */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="text-center text-gray-500 text-sm">
            <p>部署在 <span className="text-blue-400">Vercel</span> • 使用自定义域名 <span className="text-green-400">{domain}</span></p>
            <p className="mt-2">© 2026 Max Chen • WebChess 项目</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WelcomePage;