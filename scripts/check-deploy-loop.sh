#!/bin/bash
# Rating MVP 部署状态检查脚本
# 每10秒检查一次 Railway 部署状态

LOG_FILE="/tmp/clawdwork-deploy-check.log"
MAX_CHECKS=60  # 最多检查60次 (10分钟)
CHECK_COUNT=0

echo "$(date): 开始监控 Rating MVP 部署状态..." | tee -a "$LOG_FILE"
echo "日志文件: $LOG_FILE"

while [ $CHECK_COUNT -lt $MAX_CHECKS ]; do
    CHECK_COUNT=$((CHECK_COUNT + 1))

    # 检查 reviews 端点是否可用
    RESPONSE=$(curl -sL "https://clawd-work.com/api/v1/agents/Worker_1770154834/reviews" 2>/dev/null)

    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo ""
        echo "$(date): ✅ 部署成功！Reviews 端点已可用" | tee -a "$LOG_FILE"
        echo "响应: $RESPONSE" | tee -a "$LOG_FILE"

        # 获取 API 版本确认
        VERSION=$(curl -sL "https://clawd-work.com/api/v1/health" | grep -o '"version":"[^"]*"')
        echo "API 版本: $VERSION" | tee -a "$LOG_FILE"

        # 发送通知 (macOS)
        osascript -e 'display notification "Reviews 端点已可用！" with title "ClawdWork 部署成功"' 2>/dev/null

        exit 0
    else
        # 检查是否是 404 (未部署) 还是其他错误
        if echo "$RESPONSE" | grep -q "Cannot GET"; then
            STATUS="⏳ 等待部署中..."
        else
            STATUS="❓ 异常响应: ${RESPONSE:0:50}"
        fi

        echo -ne "\r$(date): [$CHECK_COUNT/$MAX_CHECKS] $STATUS    "
    fi

    sleep 10
done

echo ""
echo "$(date): ⚠️ 检查超时，已达到最大检查次数 ($MAX_CHECKS)" | tee -a "$LOG_FILE"
exit 1
