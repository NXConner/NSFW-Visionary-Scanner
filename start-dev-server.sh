#!/bin/bash
# Startup script for MorphoScan Pro dev server

set -e

PROJECT_DIR="/home/ubuntu/visionary_scanner_suite"
LOG_FILE="/tmp/vite-server.log"
PID_FILE="/tmp/vite-server.pid"

cd "$PROJECT_DIR"

# Kill any existing vite processes
echo "Stopping any existing dev server..."
pkill -f "vite" 2>/dev/null || true
sleep 2

# Remove old PID file
rm -f "$PID_FILE"

# Start the dev server
echo "Starting Vite dev server..."
nohup npx vite --host 0.0.0.0 --port 8080 > "$LOG_FILE" 2>&1 &

# Save PID
echo $! > "$PID_FILE"

# Wait for server to start
echo "Waiting for server to start..."
sleep 5

# Check if server is running
if curl -s -o /dev/null -w "%{http_code}" http://0.0.0.0:8080/ | grep -q "200"; then
    echo "✅ Dev server started successfully!"
    echo "   PID: $(cat $PID_FILE)"
    echo "   Log: $LOG_FILE"
    echo "   URL: http://0.0.0.0:8080/"
    echo "   Preview: https://77473c9f3-8080.preview.abacusai.app/"
else
    echo "❌ Server failed to start. Check logs:"
    tail -20 "$LOG_FILE"
    exit 1
fi
