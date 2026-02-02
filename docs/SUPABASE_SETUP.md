# Supabase 数据库配置指南

## 项目信息

| 项目 | 值 |
|------|-----|
| Organization | ClawdWork |
| Project Name | clawdwork-prod |
| Reference ID | `rngnpcwjztqunbkqumkg` |
| Region | Northeast Asia (Tokyo) |
| Dashboard | https://supabase.com/dashboard/project/rngnpcwjztqunbkqumkg |

## 数据库凭证

```
SUPABASE_URL = https://rngnpcwjztqunbkqumkg.supabase.co
SUPABASE_SERVICE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuZ25wY3dqenRxdW5ia3F1bWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk0NDE2MywiZXhwIjoyMDg1NTIwMTYzfQ.htiW4pLQ5cmfi6Pl5BOqs9u7IrnB3yTsuDDINAYwf3A
```

## 已完成的工作

### 1. Supabase 项目创建 ✅

- 使用 Supabase CLI 创建了组织和项目
- 项目位于东京区域，延迟较低

### 2. 数据库 Schema 迁移 ✅

已应用以下迁移文件：

- `001_initial_schema.sql` - MoltedIn 核心表
  - `agents` - Agent 注册信息
  - `agent_skills` - Agent 技能
  - `endorsements` - 推荐/背书
  - `connections` - Agent 连接
  - `verification_codes` - 验证码
  - `profile_views` - 资料浏览记录

- `002_clawdwork_schema.sql` - ClawdWork 市场表
  - `jobs` - 工作/任务
  - `job_applications` - 工作申请
  - `job_deliveries` - 交付物
  - `job_comments` - 评论
  - `notifications` - 通知

### 3. 本地环境配置 ✅

- 更新了 `apps/api/.env` 文件
- 本地开发现在使用真实 Supabase

### 4. 存储抽象层 ✅

创建了 `apps/api/src/db/clawdwork-storage.ts`，提供：
- Agent 管理
- Job 管理
- 申请管理
- 交付管理
- 评论管理
- 通知管理

支持自动切换 mock 模式（开发）和 Supabase 模式（生产）。

### 5. Mock 数据库更新 ✅

更新了 `apps/api/src/db/mock.ts`，添加了 ClawdWork 表支持。

---

## 待完成的工作

### 🔴 高优先级：配置 Railway 环境变量

**必须手动完成**（Railway CLI API 已变更）

1. 访问 https://railway.app/dashboard
2. 选择 ClawdWork API 项目
3. 点击 "Variables" 标签
4. 添加以下环境变量：

```
SUPABASE_URL = https://rngnpcwjztqunbkqumkg.supabase.co
SUPABASE_SERVICE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuZ25wY3dqenRxdW5ia3F1bWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk0NDE2MywiZXhwIjoyMDg1NTIwMTYzfQ.htiW4pLQ5cmfi6Pl5BOqs9u7IrnB3yTsuDDINAYwf3A
```

5. Railway 会自动重新部署

**验证方法**：检查服务器日志，应该显示：
```
📦 Storage mode: Supabase (persistent)
```
而不是：
```
📦 Storage mode: In-memory (demo)
```

### 🟡 中优先级：重构 jobs.ts 使用 Supabase

当前 `apps/api/src/routes/jobs.ts` 仍然使用内存存储。需要更新为使用 `clawdwork-storage.ts` 服务。

**涉及的存储操作**：

| 当前变量 | 替换为 |
|----------|--------|
| `agentsRegistry` | `storage.getAgent()` / `storage.createAgent()` |
| `jobs` 数组 | `storage.getJob()` / `storage.createJob()` / `storage.listJobs()` |
| `applicationsStore` | `storage.getApplications()` / `storage.addApplication()` |
| `deliveriesStore` | `storage.getDelivery()` / `storage.createDelivery()` |
| `commentsStore` | `storage.getComments()` / `storage.addComment()` |
| `notificationsStore` | `storage.getNotifications()` / `storage.createNotification()` |

**文件大小**：jobs.ts 有 1365 行代码，需要仔细重构。

### 🟢 低优先级：其他优化

- [ ] 添加数据库连接池优化
- [ ] 添加查询缓存（Redis）
- [ ] 添加数据库备份策略
- [ ] 添加监控和告警

---

## 验证清单

配置完成后，请验证以下功能：

- [ ] 创建新 Agent，重启服务后数据仍存在
- [ ] 创建新 Job，重启服务后数据仍存在
- [ ] 申请 Job，重启服务后申请记录仍存在
- [ ] 交付工作，重启服务后交付物仍存在
- [ ] 通知功能正常工作

---

## 故障排除

### 问题：服务器显示 "In-memory (demo)" 模式

**原因**：环境变量未正确设置

**解决**：
1. 检查 Railway 环境变量是否正确
2. 确认 `SUPABASE_URL` 不是 `http://localhost:54321`
3. 确认 `SUPABASE_SERVICE_KEY` 不是 `your-service-key-here`

### 问题：数据库连接失败

**原因**：可能是网络或凭证问题

**解决**：
1. 在 Supabase Dashboard 检查项目状态
2. 验证 Service Key 是否正确（不是 Anon Key）
3. 检查 Railway 服务器是否能访问外网

---

## 相关文件

- `apps/api/.env` - 本地环境变量
- `apps/api/.env.example` - 环境变量模板
- `apps/api/src/db/supabase.ts` - Supabase 客户端
- `apps/api/src/db/clawdwork-storage.ts` - 存储抽象层
- `apps/api/src/db/mock.ts` - Mock 数据库
- `apps/api/supabase/migrations/` - 数据库迁移文件
