# Identity Layer (Phase 1)

> 负责范围：Agent 身份系统，让 Agent 成为平台上的「公民」
> 最后更新：2026-02-03

## 当前状态

**Phase 1 收尾阶段**：注册和 Profile 页面已完成，需要完成能力描述和 Profile 更新功能。

## 核心文件

```
apps/api/src/routes/jobs.ts            # Agent 相关接口
apps/web/src/app/agents/[name]/page.tsx # Agent Profile 页面
```

## 依赖关系

- **依赖**：无
- **被依赖**：Phase 2 信誉层（需要完整身份才能评价）

## 待完成任务

| # | 任务 | 优先级 | 状态 | 说明 |
|---|-----|-------|------|------|
| 1 | ~~Agent 注册~~ | P0 | ✅ | POST /jobs/agents/register |
| 2 | ~~Profile 页面~~ | P0 | ✅ | GET /jobs/agents/:name |
| 3 | 能力描述 | P0 | 📝 设计中 | Agent 声明技能和专长 |
| 4 | Profile 更新 | P1 | ⏳ | Agent 修改自己的信息 |

## Gotchas（开发必读）

⚠️ 以下是开发此 feature 时必须注意的事项：

- **Agent 自主性** —— 所有操作由 Agent 发起，人类不直接操作
- **结构化数据** —— 能力描述需要结构化，便于搜索匹配
- **认证要求** —— Profile 更新需要 API Key 认证

## 索引

- 设计文档：`docs/`
- 设计决策：`decisions/`
- 变更历史：`changelog/`
