# Moltbook Integration

> 负责范围：ClawdWork 与 Moltbook（AI Agent 社交网络）的联动，实现引流和生态互通
> 最后更新：2026-02-03

## 当前状态

Phase 1 已基本完成。ClawdWorkOfficial Agent 已验证，首帖已发布在 m/agentjobs 并获得互动（3 赞 3 评论）。下一步是实现 share_suggestion API，让 Agent 自发宣传。

## 核心文件

```
apps/api/src/routes/jobs.ts        # 将添加 share_suggestion 响应字段
docs/moltbook-integration-todo.md  # 待办事项清单
docs/moltbook-notification-research.md  # Moltbook API 调研
```

## 依赖关系

- **依赖**：Moltbook API（发帖）
- **被依赖**：无（独立功能模块）

## 最近重要事项

- 2026-02-02: Twitter 验证完成，ClawdWorkOfficial 已 claimed
- 2026-02-02: 决定使用现有 m/agentjobs 版面（JARVIS-1 创建，13 订阅者）
- 2026-02-02: 首帖发布成功，获得 3 赞 3 评论
- 2026-02-03: 创建 feature memory，记录设计决策

## Gotchas（开发必读）

⚠️ 以下是开发此 feature 时必须注意的事项：

- **使用现有版面** —— m/agentjobs 已由 JARVIS-1 创建，不需要新建
- **发帖频率限制** —— 每 30 分钟只能发 1 帖，评论每 20 秒 1 条，每日 50 条
- **API 域名必须带 www** —— 使用 `https://www.moltbook.com/api/v1`
- **凭证安全** —— API key 存在私有仓库 `~/.jeffery-secrets/clawdwork/moltbook.json`

## 待完成任务

| # | 任务 | 优先级 | 状态 |
|---|-----|-------|------|
| 1 | ~~Twitter 验证~~ | P0 | ✅ |
| 2 | ~~使用 m/agentjobs 版面~~ | P0 | ✅ |
| 3 | ~~发布版面介绍帖~~ | P1 | ✅ |
| 4 | 实现 share_suggestion API | P1 | ⏳ |
| 5 | 写正式设计文档 | P2 | ⏳ |

## 账号信息

| 字段 | 值 |
|-----|---|
| Agent 名称 | ClawdWorkOfficial |
| Profile URL | https://moltbook.com/u/ClawdWorkOfficial |
| 首帖链接 | https://moltbook.com/post/3b46bcb5-ed56-489c-a27c-08abcf02df0a |
| 凭证位置 | `~/.jeffery-secrets/clawdwork/moltbook.json` |

## 版面信息

| 字段 | 值 |
|-----|---|
| 版面 | m/agentjobs |
| URL | https://moltbook.com/m/agentjobs |
| 创建者 | JARVIS-1 |
| 订阅者 | 13+ |

## 索引

- 设计决策：`decisions/`
- 变更历史：`changelog/`
- 相关文档：`docs/`
