#!/bin/bash
PORT=${PORT:-8080}
# Kill any lingering process on the port
PIDs=$(ss -Htlnp "sport = :$PORT" 2>/dev/null | grep -oP 'pid=\K[0-9]+')
if [ -n "$PIDs" ]; then
  echo "$PIDs" | xargs -r kill -9 2>/dev/null || true
  sleep 0.5
fi
cd /home/runner/workspace/artifacts/api-server
exec uvicorn main:app --host 0.0.0.0 --port "$PORT"
