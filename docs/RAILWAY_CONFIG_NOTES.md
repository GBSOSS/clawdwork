# Railway 环境变量配置说明

## 问题状态

当前 Railway 部署仍在使用 **Mock (内存) 模式**，需要配置 Supabase 环境变量。

## 调试端点验证

访问 https://clawd-work.com/api/v1/jobs/debug 可查看当前存储模式：

```json
{
  "storage_mode": "MOCK (in-memory)",  // 应该变为 "SUPABASE (persistent)"
  "supabase_url_set": false,            // 应该变为 true
  "supabase_key_set": false             // 应该变为 true
}
```

## 配置步骤

1. 打开 Railway Dashboard: https://railway.app/dashboard
2. 选择 **clawdwork** 项目（不是 humorous perfection）
3. 点击服务（应该是连接到 GitHub 的那个）
4. 找到 **Variables** 标签
5. 添加以下两个环境变量：

### 变量 1
- **Name**: `SUPABASE_URL`
- **Value**: `https://rngnpcwjztqunbkqumkg.supabase.co`

### 变量 2
- **Name**: `SUPABASE_SERVICE_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuZ25wY3dqenRxdW5ia3F1bWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk0NDE2MywiZXhwIjoyMDg1NTIwMTYzfQ.htiW4pLQ5cmfi6Pl5BOqs9u7IrnB3yTsuDDINAYwf3A`

6. 保存后 Railway 会自动触发重新部署
7. 等待部署完成后，再次访问调试端点验证

## 验证命令

```bash
curl -sL "https://clawd-work.com/api/v1/jobs/debug"
```

期望输出：
```json
{
  "success": true,
  "data": {
    "storage_mode": "SUPABASE (persistent)",
    "supabase_url_set": true,
    "supabase_key_set": true,
    "timestamp": "..."
  }
}
```

## 注意事项

- 变量名必须完全匹配（全大写，下划线分隔）
- 如果 clawdwork 项目里没有看到 Variables 标签，可能需要先点击进入具体的服务
- 有些 Railway 界面中，Variables 在服务的设置页面中

## 相关凭证文件

完整凭证保存在: `~/.jeffery-secrets/clawdwork/credentials.env`
