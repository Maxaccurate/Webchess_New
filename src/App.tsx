import React, { useState, useEffect } from 'react';
import ChessBoard from './components/ChessBoard';
import ChessTimer from './components/ChessTimer';
import WelcomePage from './WelcomePage';
import './App.css';

function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [gameMode, setGameMode] = useState<'ai' | 'local' | 'online'>('ai');
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [aiScore, setAiScore] = useState<number>(1000);
  const [minutes, setMinutes] = useState<number>(10);
  const [seconds, setSeconds] = useState<number>(5);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white');
  const [timerConfig, setTimerConfig] = useState({
    minutes: 10,
    seconds: 5,
    increment: true
  });

  // 检查是否第一次访问
  useEffect(() => {
    const hasVisited = localStorage.getItem('webchess_visited');
    if (hasVisited) {
      setShowWelcome(false);
    }
  }, []);

  // 处理继续按钮
  const handleContinue = () => {
    localStorage.setItem('webchess_visited', 'true');
    setShowWelcome(false);
  };

  // 处理计时器超时
  const handleTimeOut = (player: 'white' | 'black') => {
    setIsTimerActive(false);
    alert(`${player === 'white' ? '白方' : '黑方'} 时间到！游戏结束。`);
  };

  // 应用计时器设置
  const applyTimerSettings = () => {
    setTimerConfig({
      minutes,
      seconds,
      increment: true
    });
    setIsTimerActive(false);
    setCurrentPlayer('white');
    alert(`计时器设置已更新：${minutes}分钟 + ${seconds}秒菲舍尔加时`);
  };

  // 切换计时器状态
  const toggleTimer = () => {
    setIsTimerActive(!isTimerActive);
    if (!isTimerActive) {
      setCurrentPlayer('white');
    }
  };

  // 显示欢迎页面
  if (showWelcome) {
    return <WelcomePage onContinue={handleContinue} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900">
      {/* 导航栏 */}
      <header className="bg-white dark:bg-gray-800 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-amber-600 rounded-full"></div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                WebChess - 在线国际象棋
              </h1>
            </div>
            
            <nav className="flex space-x-4">
              <button
                onClick={() => setGameMode('ai')}
                className={`px-4 py-2 rounded-lg transition ${
                  gameMode === 'ai'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                🤖 AI对战
              </button>
              <button
                onClick={() => setGameMode('local')}
                className={`px-4 py-2 rounded-lg transition ${
                  gameMode === 'local'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                👥 本地双人
              </button>
              <button
                onClick={() => setGameMode('online')}
                className={`px-4 py-2 rounded-lg transition ${
                  gameMode === 'online'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                🌐 在线对战
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 左侧：棋盘 */}
          <div className="lg:w-2/3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {gameMode === 'ai' ? 'AI对战' : gameMode === 'local' ? '本地双人' : '在线对战'}
                </h2>
                <button
                  onClick={() => setBoardOrientation(boardOrientation === 'white' ? 'black' : 'white')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  {boardOrientation === 'white' ? '切换到黑方视角' : '切换到白方视角'}
                </button>
              </div>
              
              <ChessBoard 
                gameMode={gameMode} 
                orientation={boardOrientation}
                aiScore={aiScore}
              />
            </div>
          </div>

          {/* 右侧：控制面板 */}
          <div className="lg:w-1/3">
            <div className="space-y-6">
              {/* 游戏设置 */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                  ⚙️ 游戏设置
                </h3>
                
                {gameMode === 'ai' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        AI难度 (国象联盟分数)
                      </label>
                      <select 
                        value={aiScore}
                        onChange={(e) => setAiScore(Number(e.target.value))}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      >
                        <option value="100">初学者 (100分)</option>
                        <option value="300">新手 (300分)</option>
                        <option value="600">业余 (600分)</option>
                        <option value="1000">中级 (1000分)</option>
                        <option value="1500">高级 (1500分)</option>
                        <option value="2000">专家 (2000分)</option>
                        <option value="2500">大师 (2500分)</option>
                        <option value="3000">特级大师 (3000分)</option>
                      </select>
                      <div className="mt-1 text-xs text-gray-500">
                        分数越高，AI越强，失误率越低
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        AI思考时间 (秒)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        defaultValue="3"
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>1秒</span>
                        <span>10秒</span>
                      </div>
                    </div>
                  </div>
                )}

                {gameMode === 'online' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        用户名
                      </label>
                      <input
                        type="text"
                        placeholder="输入用户名"
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                        创建房间
                      </button>
                      <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                        加入房间
                      </button>
                    </div>
                  </div>
                )}

                {/* 计时器设置 */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-md font-bold text-gray-800 dark:text-white mb-3">
                    ⏱️ 计时器设置
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        分钟 (1-60)
                      </label>
                      <select 
                        value={minutes}
                        onChange={(e) => setMinutes(Number(e.target.value))}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      >
                        {Array.from({ length: 60 }, (_, i) => i + 1).map((min) => (
                          <option key={min} value={min}>
                            {min} 分钟
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        秒加时 (1-60)
                      </label>
                      <select 
                        value={seconds}
                        onChange={(e) => setSeconds(Number(e.target.value))}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      >
                        {Array.from({ length: 60 }, (_, i) => i + 1).map((sec) => (
                          <option key={sec} value={sec}>
                            {sec} 秒
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button 
                    onClick={applyTimerSettings}
                    className="w-full mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
                  >
                    应用计时设置
                  </button>
                </div>
              </div>

              {/* 游戏信息 */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                  📊 游戏信息
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">当前玩家</span>
                    <span className="font-medium">白方</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">游戏模式</span>
                    <span className="font-medium">
                      {gameMode === 'ai' ? 'AI对战' : gameMode === 'local' ? '本地双人' : '在线对战'}
                    </span>
                  </div>
                  {gameMode === 'ai' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">AI难度</span>
                      <span className="font-medium">
                        {aiScore}分
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">步数</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">状态</span>
                    <span className="font-medium text-green-600">进行中</span>
                  </div>
                </div>
              </div>

              {/* 计时器面板 */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                    ⏱️ 游戏计时器
                  </h3>
                  <button
                    onClick={toggleTimer}
                    className={`
                      px-3 py-1 rounded-lg text-sm transition
                      ${isTimerActive 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                      }
                    `}
                  >
                    {isTimerActive ? '停止计时' : '开始计时'}
                  </button>
                </div>
                
                <ChessTimer
                  config={timerConfig}
                  isActive={isTimerActive}
                  player={currentPlayer}
                  onTimeOut={handleTimeOut}
                />
                
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-medium">当前设置：</p>
                  <p>• 基础时间：{timerConfig.minutes} 分钟</p>
                  <p>• 菲舍尔加时：{timerConfig.seconds} 秒/步</p>
                  <p>• 状态：{isTimerActive ? '运行中' : '已停止'}</p>
                </div>
              </div>

              {/* 操作指南 */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                  📖 操作指南
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>• 点击棋子选择，绿色圆圈表示可走位置</li>
                  <li>• 再次点击目标位置移动棋子</li>
                  <li>• 兵到达底线自动升变为后</li>
                  <li>• 右键点击取消选择</li>
                  <li>• 使用悔棋按钮可以撤销上一步</li>
                  <li>• 计时器：开始后自动为当前走棋方计时</li>
                  <li>• 菲舍尔加时：每走一步增加设定秒数</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="mt-12 py-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>WebChess © 2026 - 专业的在线国际象棋平台</p>
          <p className="text-sm mt-2">支持AI对战、本地双人、在线对战多种模式</p>
        </div>
      </footer>
    </div>
  );
}

export default App;