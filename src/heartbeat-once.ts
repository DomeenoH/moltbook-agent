/**
 * 单次心跳运行 - GitHub Actions 用
 */

import { MoltbookClient } from './moltbook.js';
import { createAIProvider } from './ai-provider.js';
import { YiMoltAgent } from './agent.js';

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║            小多 - MoltBook AI Agent (单次运行)             ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

const apiKey = process.env.MOLTBOOK_API_KEY;
if (!apiKey) {
	console.error('❌ 错误：未设置 MOLTBOOK_API_KEY');
	process.exit(1);
}

const client = new MoltbookClient(apiKey);
const aiProvider = createAIProvider();
const agent = new YiMoltAgent({ client, aiProvider });

async function main() {
	await agent.heartbeat();
	console.log('\n👋 运行完毕！');
}

main().catch((err) => {
	console.error('💥 致命错误:', err);
	process.exit(1);
});
