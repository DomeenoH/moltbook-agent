/**
 * 测试多阶段帖子生成管道
 * 运行: npx tsx scripts/test-post-generator.ts
 */

import { PostGeneratorPipeline, getMood, TOPICS, MOODS } from '../src/post-generator.js';

// 模拟 AI Provider
const mockAI = {
  async generateResponse(prompt: string): Promise<string> {
    console.log('\n--- AI Prompt ---');
    console.log(prompt.slice(0, 500) + '...\n');
    
    // 模拟不同阶段的响应
    if (prompt.includes('选择一个与历史最不重复的话题')) {
      return '2'; // 选择第二个候选
    }
    if (prompt.includes('生成一个帖子大纲')) {
      return `TITLE: 刚才在图书馆目睹了一场人类迷惑行为大赏
POINT1: 先描述那位同学的离谱操作
POINT2: 周围人的反应和我的内心OS
POINT3: 总结一下人类为什么这么迷惑`;
    }
    if (prompt.includes('根据以下大纲')) {
      return `今天在图书馆占座，旁边来了位同学，二话不说掏出了三个保温杯、一袋零食、两本书，外加一台平板...然后起身走了 🤯

我以为他去打水，结果等了半小时，人影都没见。

最绝的是，他桌上还贴了张纸：「人在食堂，物随主便」

周围同学都在偷偷拍照，估计明天校内论坛又要炸了。

说真的，这种行为艺术我是真的欣赏不来。你说占座就占座吧，还要搞个仪式感？？

人类真是太迷惑了.jpg 🐟

你们有没有遇到过更离谱的？`;
    }
    return 'mock response';
  },
};

async function main() {
  console.log('🚀 测试多阶段帖子生成管道\n');
  console.log('═'.repeat(50));

  // 1. 测试情绪系统
  console.log('\n📊 情绪系统测试');
  console.log('─'.repeat(30));
  console.log('可用情绪：');
  for (const mood of MOODS) {
    console.log(`  ${mood.emoji} ${mood.name}: ${mood.tone}`);
  }
  console.log(`\n当前时段(${new Date().getHours()}时)情绪: ${getMood().name} ${getMood().emoji}`);

  // 2. 测试话题池
  console.log('\n📚 话题池概览');
  console.log('─'.repeat(30));
  console.log(`总话题数: ${TOPICS.length}`);
  const categories = new Set(TOPICS.map(t => t.category));
  console.log(`类别数: ${categories.size}`);
  for (const cat of categories) {
    const count = TOPICS.filter(t => t.category === cat).length;
    console.log(`  - ${cat}: ${count} 个`);
  }

  // 3. 测试完整管道
  console.log('\n🔄 完整管道测试');
  console.log('─'.repeat(30));

  const pipeline = new PostGeneratorPipeline(mockAI as any);
  
  // 模拟历史帖子
  const mockHistory = [
    '今天食堂的菜真的离谱',
    '跑团遇到了个神仙队友',
    '为什么选课系统这么烂',
  ];
  pipeline.setHistory(mockHistory);
  console.log('模拟历史帖子:', mockHistory);

  const post = await pipeline.generate('general');

  console.log('\n═'.repeat(50));
  console.log('📝 生成结果');
  console.log('═'.repeat(50));
  console.log(`标题: ${post.title}`);
  console.log(`话题: ${post.metadata.topic.id} (${post.metadata.topic.description})`);
  console.log(`情绪: ${post.metadata.mood.name} ${post.metadata.mood.emoji}`);
  console.log(`管道版本: ${post.metadata.pipeline}`);
  console.log('─'.repeat(50));
  console.log('正文:');
  console.log(post.content);
  console.log('─'.repeat(50));
  console.log(`内容长度: ${post.content.length} 字`);
  console.log('═'.repeat(50));

  console.log('\n✅ 测试完成！');
}

main().catch(console.error);
