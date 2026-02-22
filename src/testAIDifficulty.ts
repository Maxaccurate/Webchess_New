import { AI_DIFFICULTIES, getAIConfigByScore, SimpleChessAI } from './services/ChessAI';

// 测试AI难度配置
console.log('=== 国象联盟AI难度系统测试 ===\n');

console.log('可用的难度级别:');
AI_DIFFICULTIES.forEach(diff => {
  console.log(`  ${diff.name.padEnd(8)} - ${diff.score.toString().padStart(4)}分 - 思考深度:${diff.depth} - 时间:${diff.time}ms - 失误率:${(diff.blunderRate * 100).toFixed(1)}%`);
});

console.log('\n=== 测试不同分数的AI配置 ===');
const testScores = [100, 500, 1000, 1800, 2500, 3000];
testScores.forEach(score => {
  const config = getAIConfigByScore(score);
  console.log(`分数 ${score.toString().padStart(4)} -> ${config.name} (${config.score}分)`);
});

console.log('\n=== AI走棋测试 ===');
const ai = new SimpleChessAI();

// 测试不同难度的AI走棋
async function testAIMoves() {
  const testCases = [
    { score: 100, name: '初学者' },
    { score: 600, name: '业余' },
    { score: 1500, name: '高级' },
    { score: 2500, name: '大师' },
  ];

  for (const testCase of testCases) {
    console.log(`\n测试 ${testCase.name} (${testCase.score}分):`);
    
    // 重置棋局
    ai.setFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    
    const startTime = Date.now();
    const newFen = await ai.thinkAndMove(testCase.score);
    const timeTaken = Date.now() - startTime;
    
    if (newFen) {
      console.log(`  走棋完成，耗时: ${timeTaken}ms`);
      console.log(`  新FEN: ${newFen.substring(0, 50)}...`);
    } else {
      console.log('  走棋失败');
    }
  }
}

// 运行测试
testAIMoves().then(() => {
  console.log('\n=== 测试完成 ===');
});