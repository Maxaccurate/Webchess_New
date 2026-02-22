import { Chess } from 'chess.js';

// AI难度级别对应的国象联盟分数和思考深度（100-3000分制）
export const AI_DIFFICULTIES = [
  { name: '初学者', score: 100, depth: 1, time: 500, blunderRate: 0.5 },
  { name: '新手', score: 300, depth: 1, time: 800, blunderRate: 0.3 },
  { name: '业余', score: 600, depth: 2, time: 1200, blunderRate: 0.2 },
  { name: '中级', score: 1000, depth: 2, time: 1500, blunderRate: 0.15 },
  { name: '高级', score: 1500, depth: 3, time: 2000, blunderRate: 0.1 },
  { name: '专家', score: 2000, depth: 3, time: 2500, blunderRate: 0.05 },
  { name: '大师', score: 2500, depth: 4, time: 3000, blunderRate: 0.02 },
  { name: '特级大师', score: 3000, depth: 5, time: 4000, blunderRate: 0.01 },
];

// 根据国象联盟分数获取AI配置
export const getAIConfigByScore = (score: number) => {
  // 找到最接近的难度级别
  const sortedDifficulties = [...AI_DIFFICULTIES].sort((a, b) => Math.abs(a.score - score) - Math.abs(b.score - score));
  return sortedDifficulties[0];
};

// 获取所有可选的分数级别
export const getAvailableScores = () => {
  return AI_DIFFICULTIES.map(d => d.score);
};

// 简单的AI走棋算法（基于棋局评估）
export class SimpleChessAI {
  private game: Chess;
  
  constructor(fen?: string) {
    this.game = fen ? new Chess(fen) : new Chess();
  }
  
  // 评估棋局分数（正数对白方有利，负数对黑方有利）
  private evaluatePosition(): number {
    const board = this.game.board();
    let score = 0;
    
    // 棋子价值评估
    const pieceValues: { [key: string]: number } = {
      'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000,
      'P': -100, 'N': -320, 'B': -330, 'R': -500, 'Q': -900, 'K': -20000
    };
    
    // 计算棋子价值
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          const pieceCode = `${piece.color}${piece.type}`;
          score += pieceValues[pieceCode] || 0;
        }
      }
    }
    
    // 位置优势评估（简单的中心控制）
    const centerSquares = ['d4', 'd5', 'e4', 'e5'];
    for (const square of centerSquares) {
      const piece = this.game.get(square);
      if (piece) {
        const pieceCode = `${piece.color}${piece.type}`;
        const value = Math.abs(pieceValues[pieceCode] || 0) / 100;
        score += piece.color === 'w' ? value * 5 : -value * 5;
      }
    }
    
    return score;
  }
  
  // 极小化极大算法搜索
  private minimax(depth: number, isMaximizing: boolean, alpha: number, beta: number): number {
    if (depth === 0 || this.game.isGameOver()) {
      return this.evaluatePosition();
    }
    
    const moves = this.game.moves({ verbose: true });
    
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        this.game.move(move);
        const evaluation = this.minimax(depth - 1, false, alpha, beta);
        this.game.undo();
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break; // Alpha-Beta剪枝
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        this.game.move(move);
        const evaluation = this.minimax(depth - 1, true, alpha, beta);
        this.game.undo();
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break; // Alpha-Beta剪枝
      }
      return minEval;
    }
  }
  
  // 获取AI的最佳走法
  public getBestMove(depth: number = 2): string | null {
    const moves = this.game.moves({ verbose: true });
    if (moves.length === 0) return null;
    
    let bestMove: any = null;
    let bestValue = this.game.turn() === 'w' ? -Infinity : Infinity;
    
    for (const move of moves) {
      this.game.move(move);
      const moveValue = this.minimax(depth - 1, this.game.turn() === 'b', -Infinity, Infinity);
      this.game.undo();
      
      if (this.game.turn() === 'w') {
        // 白方最大化分数
        if (moveValue > bestValue) {
          bestValue = moveValue;
          bestMove = move;
        }
      } else {
        // 黑方最小化分数
        if (moveValue < bestValue) {
          bestValue = moveValue;
          bestMove = move;
        }
      }
    }
    
    return bestMove ? bestMove.san : null;
  }
  
  // 模拟AI思考（带延迟和失误率）
  public async thinkAndMove(score: number = 1000): Promise<string | null> {
    const config = getAIConfigByScore(score);
    
    // 模拟思考时间
    await new Promise(resolve => setTimeout(resolve, config.time));
    
    // 根据失误率决定是否走最佳走法
    const shouldBlunder = Math.random() < config.blunderRate;
    
    let moveToMake: string | null;
    
    if (shouldBlunder && config.score < 2000) {
      // 走一个次优走法（模拟失误）
      moveToMake = this.getSuboptimalMove(config.depth);
    } else {
      // 走最佳走法
      moveToMake = this.getBestMove(config.depth);
    }
    
    if (moveToMake) {
      try {
        this.game.move(moveToMake);
        return this.game.fen();
      } catch (error) {
        console.error('AI走棋失败:', error);
        // 如果失误走法失败，尝试走最佳走法
        const bestMove = this.getBestMove(config.depth);
        if (bestMove) {
          this.game.move(bestMove);
          return this.game.fen();
        }
        return null;
      }
    }
    
    return null;
  }
  
  // 获取次优走法（用于模拟失误）
  private getSuboptimalMove(depth: number): string | null {
    const moves = this.game.moves({ verbose: true });
    if (moves.length === 0) return null;
    
    // 评估所有走法
    const moveEvaluations: Array<{move: any, value: number}> = [];
    
    for (const move of moves) {
      this.game.move(move);
      const moveValue = this.minimax(depth - 1, this.game.turn() === 'b', -Infinity, Infinity);
      this.game.undo();
      moveEvaluations.push({ move, value: moveValue });
    }
    
    // 排序：白方最大化分数，黑方最小化分数
    if (this.game.turn() === 'w') {
      moveEvaluations.sort((a, b) => b.value - a.value); // 降序
    } else {
      moveEvaluations.sort((a, b) => a.value - b.value); // 升序
    }
    
    // 选择不是最佳的几个走法中的一个（模拟失误）
    const suboptimalIndex = Math.floor(Math.random() * Math.min(3, moveEvaluations.length - 1)) + 1;
    return moveEvaluations[suboptimalIndex]?.move.san || null;
  }
  
  // 获取当前FEN
  public getFen(): string {
    return this.game.fen();
  }
  
  // 设置棋局
  public setFen(fen: string): void {
    this.game = new Chess(fen);
  }
}

// 使用Web Worker运行Stockfish（如果可用）
export class StockfishAI {
  private worker: Worker | null = null;
  private isReady: boolean = false;
  
  constructor() {
    this.initWorker();
  }
  
  private initWorker() {
    try {
      // 尝试创建Stockfish Worker
      this.worker = new Worker('/stockfish.js');
      this.worker.onmessage = this.handleMessage.bind(this);
      
      // 初始化引擎
      this.sendCommand('uci');
      this.sendCommand('isready');
    } catch (error) {
      console.warn('Stockfish Worker不可用，使用简单AI:', error);
      this.worker = null;
    }
  }
  
  private handleMessage(event: MessageEvent) {
    const message = event.data;
    
    if (message === 'readyok') {
      this.isReady = true;
      console.log('Stockfish引擎就绪');
    }
  }
  
  private sendCommand(command: string) {
    if (this.worker) {
      this.worker.postMessage(command);
    }
  }
  
  // 获取Stockfish的最佳走法
  public async getBestMove(fen: string, depth: number = 15): Promise<string | null> {
    if (!this.worker || !this.isReady) {
      return null; // 回退到简单AI
    }
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(null);
      }, 5000);
      
      const handler = (event: MessageEvent) => {
        const message = event.data;
        
        if (message.startsWith('bestmove')) {
          clearTimeout(timeout);
          this.worker!.removeEventListener('message', handler);
          
          const parts = message.split(' ');
          if (parts.length > 1) {
            resolve(parts[1]);
          } else {
            resolve(null);
          }
        }
      };
      
      this.worker.addEventListener('message', handler);
      
      // 设置位置和搜索深度
      this.sendCommand(`position fen ${fen}`);
      this.sendCommand(`go depth ${depth}`);
    });
  }
  
  // 清理
  public destroy() {
    if (this.worker) {
      this.worker.terminate();
    }
  }
}

// 导出默认AI实例
export const chessAI = new SimpleChessAI();
export const stockfishAI = new StockfishAI();