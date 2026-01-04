#!/bin/bash

echo "--- Diagnostic Information ---"
echo "Current User: $(whoami)"
echo "Working Directory: $(pwd)"
echo "Nginx Version: $(nginx -v 2>&1)"
echo "Python Version: $(python --version)"

echo "--- Testing Nginx Config ---"
nginx -t

echo "--- Starting Nginx in Background ---"
# Redirect logs to stdout/stderr for Docker
ln -sf /dev/stdout /var/log/nginx/access.log
ln -sf /dev/stderr /var/log/nginx/error.log
nginx

echo "--- Checking if Nginx is running ---"
ps aux | grep nginx

echo "--- Starting FastAPI Backend ---"
cd /app/server
exec uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
