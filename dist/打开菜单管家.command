#!/bin/bash
cd "$(dirname "$0")"

# 查找可用端口
PORT=8080

# 启动本地服务器
python3 -m http.server $PORT &
SERVER_PID=$!

# 等待服务器启动
sleep 1

# 打开浏览器
open "http://localhost:$PORT"

echo ""
echo "================================================"
echo "  🍽️  家庭智能菜单管家 已启动"
echo "  📍  浏览器地址: http://localhost:$PORT"
echo ""
echo "  ⚠️  使用完毕后，关闭此窗口即可"
echo "================================================"
echo ""

# 等待用户关闭窗口时自动停止服务器
trap "kill $SERVER_PID 2>/dev/null; exit" INT TERM EXIT
wait $SERVER_PID
