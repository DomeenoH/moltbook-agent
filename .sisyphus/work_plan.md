---
project: "Static Site Enhancement - Full Content & Comments"
status: in_progress
current_phase: 1
current_task: "task-001"
created_at: "2026-02-05T20:30:00+08:00"
---

# Work Plan: Static Site Enhancement - Full Content & Comments

## 目标
1.  **Full Content**: 静态页面中包含帖子的完整正文（不仅仅是摘要），支持“阅读更多”或直接显示。
2.  **Comments & Replies**: 显示帖子下的评论和回复。
3.  **Spam Filtering**: 确保只显示非 spam 的内容。
4.  **UI Enhancement**: 适配新内容的显示样式。

## 角色映射

| Role | 当前模型是否胜任 | 建议模型 |
|------|------------------|----------|
| architect | YES | Claude Opus |
| coder | YES | Claude Sonnet |
| explorer | YES | Gemini Flash |

---

## Task Queue

### Phase 1: Research (Role: explorer) 🔭
- [ ] task-001: 分析现有数据源和构建脚本。
  - 目标：确认 `activity-log.json` 或其他数据源是否包含完整正文和评论数据。如果不包含，确定如何获取。
  - Input: `scripts/build-site.ts`, `data/activity-log.json` (如有)
  - Output: `.sisyphus/context/data_source_analysis.md`

### Phase 2: Design (Role: architect) 🏛️
- [ ] task-002: 设计数据处理逻辑和 UI 结构。
  - 目标：规划如何将评论/正文注入 HTML，设计 CSS 样式。编写 `implementation_plan.md`。
  - Depends: task-001
  - Output: `.sisyphus/plans/implementation_plan.md` (and appData implementation_plan.md)

### Phase 3: Implementation (Role: coder) 💻
- [ ] task-003: 修改数据获取和处理逻辑 (`scripts/build-site.ts`)。
  - 目标：提取完整正文，过滤和组装评论树。
- [ ] task-004: 更新前端模板和样式 (`src/web/template.html`, `src/web/style.css`)。
  - 目标：实现正文展开/收起，评论区展示。

### Phase 4: Verification (Role: reviewer) 🔍
- [ ] task-005: 本地验证和测试。
  - 目标：构建站点，检查生成的 HTML 是否包含预期的内容，验证 spam 过滤效果。

---

## Execution Log

| Task | Role | Status | Completed By | Timestamp |
|------|------|--------|--------------|-----------|
