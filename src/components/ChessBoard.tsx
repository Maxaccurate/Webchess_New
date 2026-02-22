import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { SimpleChessAI, getAIConfigByScore } from '../services/ChessAI';

interface ChessBoardProps {
  gameMode: 'ai' | 'local' | 'online';
  orientation?: 'white' | 'black';
  aiScore?: number;
  onMove?: (fen: string) => void;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ 
  gameMode, 
  orientation = 'white',
  aiScore = 1000,
  onMove 
}) => {
  const [game, setGame] = useState(new Chess());
  const [board, setBoard] = useState<string[][]>([]);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<string>('游戏进行中');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef(new SimpleChessAI());

  // 初始化棋盘
  useEffect(() => {
    updateBoard();
    aiRef.current.setFen(game.fen());
  }, []);

  // 更新棋盘状态
  const updateBoard = () => {
    const newBoard: string[][] = [];
    const boardState = game.board();
    
    for (let i = 0; i < 8; i++) {
      const row: string[] = [];
      for (let j = 0; j < 8; j++) {
        const piece = boardState[i][j];
        row.push(piece ? `${piece.color}${piece.type}` : '');
      }
      newBoard.push(row);
    }
    
    setBoard(newBoard);
    checkGameStatus();
    
    // 更新AI的棋局状态
    aiRef.current.setFen(game.fen());
    
    // 触发移动回调
    if (onMove) {
      onMove(game.fen());
    }
  };

  // 检查游戏状态
  const checkGameStatus = () => {
    if (game.isCheckmate()) {
      setGameStatus(`${game.turn() === 'w' ? '黑方' : '白方'} 将死！`);
    } else if (game.isStalemate()) {
      setGameStatus('逼和');
    } else if (game.isDraw()) {
      setGameStatus('和棋');
    } else if (game.isCheck()) {
      setGameStatus('将军！');
    } else {
      setGameStatus(`${game.turn() === 'w' ? '白方' : '黑方'} 走棋`);
    }
  };

  // AI走棋
  const makeAIMove = async () => {
    if (game.isGameOver() || isAIThinking) return;
    
    setIsAIThinking(true);
    
    try {
      const newFen = await aiRef.current.thinkAndMove(aiScore);
      
      if (newFen) {
        setGame(new Chess(newFen));
        updateBoard();
      }
    } catch (error) {
      console.error('AI走棋错误:', error);
    } finally {
      setIsAIThinking(false);
    }
  };

  // 处理方格点击
  const handleSquareClick = (row: number, col: number) => {
    if (isAIThinking) return;
    
    const square = `${String.fromCharCode(97 + col)}${8 - row}`;
    
    if (selectedSquare) {
      // 尝试移动棋子
      try {
        const move = game.move({
          from: selectedSquare,
          to: square,
          promotion: 'q' // 默认升变为后
        });
        
        if (move) {
          setGame(new Chess(game.fen()));
          updateBoard();
          setSelectedSquare(null);
          setValidMoves([]);
          
          // 如果是AI模式且轮到AI走棋
          if (gameMode === 'ai' && game.turn() === 'b') {
            setTimeout(() => {
              makeAIMove();
            }, 500);
          }
        }
      } catch (error) {
        // 非法走法，选择新的棋子
        selectPiece(square);
      }
    } else {
      selectPiece(square);
    }
  };

  // 选择棋子
  const selectPiece = (square: string) => {
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setValidMoves(moves.map(move => move.to));
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  // 渲染棋盘
  const renderBoard = () => {
    const squares = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isLight = (row + col) % 2 === 0;
        const squareId = `${String.fromCharCode(97 + col)}${8 - row}`;
        const isSelected = selectedSquare === squareId;
        const isValidMove = validMoves.includes(squareId);
        const piece = board[row]?.[col];
        
        squares.push(
          <div
            key={`${row}-${col}`}
            className={`
              w-12 h-12 md:w-16 md:h-16 flex items-center justify-center
              ${isLight ? 'bg-amber-100' : 'bg-amber-800'}
              ${isSelected ? 'ring-4 ring-blue-500 ring-inset' : ''}
              ${isValidMove ? 'ring-2 ring-green-500 ring-inset' : ''}
              hover:opacity-90 cursor-pointer transition-all
            `}
            onClick={() => handleSquareClick(row, col)}
          >
            {piece && renderPiece(piece)}
            {isValidMove && !piece && (
              <div className="w-4 h-4 rounded-full bg-green-500 opacity-70"></div>
            )}
          </div>
        );
      }
    }
    
    return squares;
  };

  // 渲染棋子
  const renderPiece = (pieceCode: string) => {
    const color = pieceCode[0];
    const type = pieceCode[1];
    
    const pieces: { [key: string]: string } = {
      'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚',
      'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔'
    };
    
    return (
      <span className={`
        text-3xl md:text-4xl
        ${color === 'w' ? 'text-white' : 'text-gray-900'}
        drop-shadow-lg
      `}>
        {pieces[type] || '?'}
      </span>
    );
  };

  // 重置游戏
  const resetGame = () => {
    setGame(new Chess());
    setSelectedSquare(null);
    setValidMoves([]);
    updateBoard();
  };

  // 翻转棋盘
  const flipBoard = () => {
    // 翻转逻辑将在后续实现
  };

  return (
    <div className="flex flex-col items-center p-4">
      {/* 游戏状态显示 */}
      <div className="mb-4 flex items-center space-x-4">
        <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
          {gameStatus}
        </div>
        {isAIThinking && (
          <div className="flex items-center space-x-2 text-amber-600">
            <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">AI思考中...</span>
          </div>
        )}
      </div>
      
      {/* 棋盘容器 */}
      <div 
        ref={boardRef}
        className="grid grid-cols-8 gap-0 border-4 border-amber-900 rounded-lg shadow-2xl"
        style={{ transform: orientation === 'black' ? 'rotate(180deg)' : 'none' }}
      >
        {renderBoard()}
      </div>
      
      {/* 坐标标签 */}
      <div className="mt-2 flex justify-between w-full max-w-md">
        <div className="flex space-x-4">
          {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((letter) => (
            <span key={letter} className="text-gray-700 dark:text-gray-300 font-medium">
              {letter}
            </span>
          ))}
        </div>
      </div>
      
      {/* 控制按钮 */}
      <div className="mt-6 flex space-x-4">
        <button
          onClick={resetGame}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          disabled={isAIThinking}
        >
          新游戏
        </button>
        <button
          onClick={flipBoard}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
          disabled={isAIThinking}
        >
          翻转棋盘
        </button>
        <button
          onClick={() => {
            try {
              game.undo();
              setGame(new Chess(game.fen()));
              updateBoard();
            } catch (error) {
              console.log('无法悔棋');
            }
          }}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition disabled:opacity-50"
          disabled={isAIThinking}
        >
          悔棋
        </button>
        {gameMode === 'ai' && game.turn() === 'b' && !isAIThinking && (
          <button
            onClick={makeAIMove}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            AI走棋
          </button>
        )}
      </div>
      
      {/* 游戏信息 */}
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>模式: {gameMode === 'ai' ? 'AI对战' : gameMode === 'local' ? '本地双人' : '在线对战'}</p>
        <p>AI难度: {getAIConfigByScore(aiScore).name} ({aiScore}分)</p>
        <p className="truncate max-w-md">FEN: {game.fen().split(' ')[0]}</p>
      </div>
    </div>
  );
};

export default ChessBoard;