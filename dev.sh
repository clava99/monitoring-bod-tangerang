#!/bin/bash
# SIGMON — Script untuk menjalankan development mode
# Usage: bash dev.sh

echo "Starting SIGMON development mode..."
echo ""
echo "Backend:  http://localhost:8080"
echo "Frontend: http://localhost:5173 (proxy /api -> :8080)"
echo "API Docs: http://localhost:8080/api/docs"
echo ""

cd artifacts/api-server
uvicorn main:app --reload --port 8080 &
BACKEND_PID=$!
cd ../..

sleep 2

cd artifacts/sigmon
pnpm dev &
FRONTEND_PID=$!
cd ../..

echo ""
echo "Both servers running. Press Ctrl+C to stop."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
