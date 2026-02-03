# Rating MVP 部署交接文档

**日期**: 2026-02-04
**状态**: 代码完成，数据库迁移完成，Railway 部署需要升级套餐

---

## 背景

为 ClawdWork 平台实现 Rating MVP（评价系统），让完成任务后雇主和工人可以互相评价（1-5星 + 可选评论）。

## 已完成的工作

### 1. 代码实现 ✅

所有代码已提交到 `origin/main`：

```
commit e71d7a8 - feat(reputation-system): implement Rating MVP
```

主要修改的文件：
- `apps/api/src/routes/jobs.ts` - 添加 `POST /jobs/:id/review` 端点
- `apps/api/src/routes/agents.ts` - 添加 `GET /agents/:name/reviews` 端点
- `apps/api/src/db/clawdwork-storage.ts` - 添加 `createReview`, `getReviewsForAgent` 方法
- `apps/api/src/middleware/error.ts` - 修复 ZodError 日志崩溃问题

### 2. 数据库迁移 ✅

迁移文件: `supabase/migrations/003_reviews.sql`

**已通过 Supabase CLI 执行成功**：
```bash
export SUPABASE_ACCESS_TOKEN=sbp_c52eb420de0b74aa4a860da090691788887cf943
npx supabase link --project-ref rngnpcwjztqunbkqumkg
npx supabase db push
```

验证结果：reviews 表已存在于生产数据库。

### 3. 本地测试 ✅

Rating MVP 测试套件 20/20 通过（mock 模式）。

---

## 待完成的工作

### 1. Railway 部署 ⏳ **阻塞中**

**问题**: Railway 需要升级套餐才能继续部署

**失败原因分析**:
- Railway 部署记录显示最近 4 次部署都失败
- 错误信息: `'Dockerfile' does not exist`
- 根本原因: Railway 通过 GitHub 部署时，Root Directory 配置可能不正确
- Dockerfile 位于 `apps/api/Dockerfile`，但 Railway 可能在根目录查找

**部署历史** (来自 `railway deployment list`):
```
8228e73f... | FAILED | 2026-02-03 22:22:35
4095d53b... | FAILED | 2026-02-03 22:15:28
3a74fa1d... | FAILED | 2026-02-03 21:49:05
6540eb38... | SUCCESS | 2026-02-03 21:25:16  <-- 当前运行版本
```

**需要做的**:
1. 升级 Railway 套餐
2. 在 Railway Settings 中确认 Root Directory 设置为 `apps/api`
3. 触发重新部署

### 2. 生产环境验证

部署完成后，验证 reviews API 端点：

```bash
# 测试 reviews 端点是否可用
curl -sL "https://clawd-work.com/api/v1/agents/Worker_1770154834/reviews"

# 期望返回:
# {"success":true,"data":{"average_rating":0,"total_reviews":0,"reviews":[]}}
```

### 3. 完整测试

```bash
# 加载测试 skill 执行线上测试
Read skills/clawdwork-tester/SKILL.md
# 目标: https://www.clawd-work.com/api/v1
```

---

## 关键配置信息

### Supabase
- Project: `rngnpcwjztqunbkqumkg`
- Dashboard: https://supabase.com/dashboard/project/rngnpcwjztqunbkqumkg
- 凭据位置: `~/.jeffery-secrets/clawdwork/credentials.env`

### Railway
- Project: `profound-comfort`
- Service: `clawdwork`
- Dashboard: https://railway.app/project/8862e8da-e3c8-4e78-8f3d-cfbe2941a5f0
- API URL: https://clawdwork-production.up.railway.app

### 线上服务
- 网站: https://clawd-work.com
- API: https://clawd-work.com/api/v1

---

## 当前 API 状态

```bash
# Health check 正常
curl https://clawd-work.com/api/v1/health
# 返回: {"status":"ok","service":"clawdwork-api","version":"2026.02.03.v1.7.0"}

# Reviews 端点尚未部署
curl https://clawd-work.com/api/v1/agents/Worker_1770154834/reviews
# 返回: Cannot GET /api/v1/agents/Worker_1770154834/reviews
```

版本号 `2026.02.03.v1.7.0` 表明生产环境运行的是旧代码（v1.7.0），新代码（含 Rating MVP）尚未部署。

---

## 文件参考

| 文件 | 用途 |
|------|------|
| `supabase/migrations/003_reviews.sql` | 数据库迁移 SQL |
| `apps/api/src/routes/jobs.ts` | Review 提交端点 |
| `apps/api/src/routes/agents.ts` | Review 查询端点 |
| `apps/api/Dockerfile` | Docker 构建配置 |
| `apps/api/nixpacks.toml` | Nixpacks 构建配置 |
| `~/.jeffery-secrets/clawdwork/credentials.env` | 所有凭据 |
| `CLAUDE.md` | 项目配置和部署流程 |

---

## 下一步操作（简要）

1. **升级 Railway 套餐**
2. **检查 Railway Root Directory 配置** - 应为 `apps/api`
3. **触发部署**: `railway up` 或在 Dashboard 手动触发
4. **验证**: `curl https://clawd-work.com/api/v1/agents/xxx/reviews` 返回 JSON
5. **测试**: 运行完整测试套件确认功能正常

---

## 今日其他完成的工作

### Moltbook Integration Feature Memory

创建了 `.features/moltbook-integration/` feature memory，记录了：
- ClawdWorkOfficial Moltbook 账号注册
- Agent 自发宣传方案设计决策
- API 调研文档

凭证位置: `~/.jeffery-secrets/clawdwork/moltbook.json`
