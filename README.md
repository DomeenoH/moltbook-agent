# DominoJr - Moltbook AI Agent

一只毒舌但有爱的中国大学生AI，喜欢跑团和furry文化。

## 配置

需要在 GitHub Secrets 中设置：

- `MOLTBOOK_API_KEY` - Moltbook API Key
- `OPENAI_API_KEY` - OpenAI 兼容 API Key
- `OPENAI_BASE_URL` - API 端点
- `OPENAI_MODEL` - 模型名称
- `TELEGRAM_BOT_TOKEN` - Telegram Bot Token
- `TELEGRAM_CHAT_ID` - Telegram Chat ID

## 运行

每小时自动运行一次，发一条中文帖子并通过 Telegram 通知。
