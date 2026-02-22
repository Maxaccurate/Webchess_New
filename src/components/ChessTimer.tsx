import React, { useState, useEffect, useRef } from 'react';

interface TimerConfig {
  minutes: number;      // 基础分钟数
  seconds: number;      // 菲舍尔加时秒数
  increment: boolean;   // 是否使用菲舍尔加时
}

interface ChessTimerProps {
  config: TimerConfig;
  isActive: boolean;
  player: 'white' | 'black';
  onTimeOut: (player: 'white' | 'black') => void;
}

const ChessTimer: React.FC<ChessTimerProps> = ({ 
  config, 
  isActive, 
  player, 
  onTimeOut 
}) => {
  const [whiteTime, setWhiteTime] = useState(config.minutes * 60 * 1000); // 毫秒
  const [blackTime, setBlackTime] = useState(config.minutes * 60 * 1000); // 毫秒
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white');
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  // 格式化时间显示
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    
    if (ms < 60000) {
      // 少于1分钟，显示秒和毫秒
      return `${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    } else {
      // 多于1分钟，显示分钟和秒
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  // 获取时间颜色（根据剩余时间）
  const getTimeColor = (ms: number): string => {
    if (ms < 10000) return 'text-red-600';      // 少于10秒：红色
    if (ms < 30000) return 'text-yellow-600';   // 少于30秒：黄色
    if (ms < 60000) return 'text-amber-600';    // 少于1分钟：琥珀色
    return 'text-gray-800 dark:text-gray-200';  // 正常时间
  };

  // 开始计时器
  const startTimer = () => {
    if (isRunning) return;
    
    setIsRunning(true);
    lastUpdateRef.current = Date.now();
    
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastUpdateRef.current;
      lastUpdateRef.current = now;
      
      if (currentPlayer === 'white') {
        setWhiteTime(prev => {
          const newTime = prev - elapsed;
          if (newTime <= 0) {
            clearInterval(intervalRef.current!);
            onTimeOut('white');
            return 0;
          }
          return newTime;
        });
      } else {
        setBlackTime(prev => {
          const newTime = prev - elapsed;
          if (newTime <= 0) {
            clearInterval(intervalRef.current!);
            onTimeOut('black');
            return 0;
          }
          return newTime;
        });
      }
    }, 10); // 每10毫秒更新一次
  };

  // 停止计时器
  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  };

  // 切换玩家
  const switchPlayer = () => {
    if (!isActive) return;
    
    // 停止当前计时
    stopTimer();
    
    // 为刚走完的玩家添加菲舍尔加时
    if (config.increment && config.seconds > 0) {
      if (currentPlayer === 'white') {
        setWhiteTime(prev => prev + config.seconds * 1000);
      } else {
        setBlackTime(prev => prev + config.seconds * 1000);
      }
    }
    
    // 切换玩家
    const newPlayer = currentPlayer === 'white' ? 'black' : 'white';
    setCurrentPlayer(newPlayer);
    
    // 开始新玩家的计时
    if (isActive) {
      setTimeout(() => {
        startTimer();
      }, 100);
    }
  };

  // 暂停/继续
  const toggleTimer = () => {
    if (isRunning) {
      stopTimer();
    } else if (isActive) {
      startTimer();
    }
  };

  // 重置计时器
  const resetTimer = () => {
    stopTimer();
    setWhiteTime(config.minutes * 60 * 1000);
    setBlackTime(config.minutes * 60 * 1000);
    setCurrentPlayer('white');
    setIsRunning(false);
    
    if (isActive) {
      setTimeout(() => {
        startTimer();
      }, 100);
    }
  };

  // 初始化效果
  useEffect(() => {
    if (isActive && !isRunning) {
      startTimer();
    } else if (!isActive && isRunning) {
      stopTimer();
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  // 配置变化时重置
  useEffect(() => {
    resetTimer();
  }, [config.minutes, config.seconds]);

  // 玩家变化时（外部控制）
  useEffect(() => {
    if (player !== currentPlayer) {
      switchPlayer();
    }
  }, [player]);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* 计时器显示 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* 白方计时器 */}
        <div className={`
          p-4 rounded-xl shadow-lg transition-all
          ${currentPlayer === 'white' && isRunning 
            ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 ring-2 ring-blue-500' 
            : 'bg-white dark:bg-gray-800'
          }
        `}>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              白方
            </div>
            <div className={`text-3xl font-bold ${getTimeColor(whiteTime)}`}>
              {formatTime(whiteTime)}
            </div>
            {currentPlayer === 'white' && isRunning && (
              <div className="mt-2 flex justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
        </div>
        
        {/* 黑方计时器 */}
        <div className={`
          p-4 rounded-xl shadow-lg transition-all
          ${currentPlayer === 'black' && isRunning 
            ? 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-800/30 ring-2 ring-gray-500' 
            : 'bg-white dark:bg-gray-800'
          }
        `}>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              黑方
            </div>
            <div className={`text-3xl font-bold ${getTimeColor(blackTime)}`}>
              {formatTime(blackTime)}
            </div>
            {currentPlayer === 'black' && isRunning && (
              <div className="mt-2 flex justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 计时器信息 */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
        <p>
          当前走棋: 
          <span className={`font-bold ml-2 ${currentPlayer === 'white' ? 'text-blue-600' : 'text-gray-800 dark:text-gray-300'}`}>
            {currentPlayer === 'white' ? '白方' : '黑方'}
          </span>
        </p>
        <p className="mt-1">
          计时模式: {config.increment ? `菲舍尔加时 (${config.seconds}秒)` : '简单倒计时'}
        </p>
      </div>
      
      {/* 控制按钮 */}
      <div className="flex justify-center space-x-3">
        <button
          onClick={toggleTimer}
          className={`
            px-4 py-2 rounded-lg transition
            ${isRunning 
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white'
            }
          `}
        >
          {isRunning ? '⏸️ 暂停' : '▶️ 继续'}
        </button>
        <button
          onClick={switchPlayer}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          disabled={!isActive}
        >
          🔄 切换玩家
        </button>
        <button
          onClick={resetTimer}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          🔄 重置
        </button>
      </div>
      
      {/* 时间进度条 */}
      <div className="mt-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>白方剩余时间</span>
          <span>{Math.round(whiteTime / (config.minutes * 60 * 1000) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (whiteTime / (config.minutes * 60 * 1000)) * 100)}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 mt-3 mb-1">
          <span>黑方剩余时间</span>
          <span>{Math.round(blackTime / (config.minutes * 60 * 1000) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gray-800 dark:bg-gray-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (blackTime / (config.minutes * 60 * 1000)) * 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ChessTimer;