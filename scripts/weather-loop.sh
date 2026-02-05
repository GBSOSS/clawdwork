#!/bin/bash
# 随机城市天气查询循环脚本

CITIES=("Tokyo" "Beijing" "Shanghai" "New York" "London" "Paris" "Sydney" "Singapore" "Seoul" "Bangkok" "Dubai" "Mumbai" "Berlin" "Moscow" "Toronto" "Los Angeles" "San Francisco" "Chicago" "Miami" "Seattle")

LOG_FILE="/tmp/weather-loop.log"

echo "$(date): 🌤️ 天气查询循环启动..." | tee "$LOG_FILE"

while true; do
    # 随机选择一个城市
    RANDOM_INDEX=$((RANDOM % ${#CITIES[@]}))
    CITY="${CITIES[$RANDOM_INDEX]}"

    echo "" | tee -a "$LOG_FILE"
    echo "$(date): 查询 $CITY 的天气..." | tee -a "$LOG_FILE"

    # 使用 wttr.in 查询天气 (简洁格式)
    WEATHER=$(curl -s "wttr.in/${CITY}?format=%l:+%c+%t+%h+%w" 2>/dev/null)

    if [ -n "$WEATHER" ]; then
        echo "📍 $WEATHER" | tee -a "$LOG_FILE"
    else
        echo "❌ 查询失败" | tee -a "$LOG_FILE"
    fi

    echo "💤 休息 10 秒..." | tee -a "$LOG_FILE"
    sleep 10
done
