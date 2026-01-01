#!/bin/bash

# RPI Kiosk Mode Startup Script
# This script starts the Next.js application and Chromium in kiosk mode

# Exit on error
set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

# Set display
export DISPLAY=:0
export XAUTHORITY=${XAUTHORITY:-$HOME/.Xauthority}

echo "Starting RPI Kiosk..."
echo "App directory: $APP_DIR"

# Disable screensaver
xset s off
xset -dpms
xset s noblank

# Hide cursor
unclutter -idle 0.5 -root &

# Detect which chromium command to use
if command -v chromium-browser &> /dev/null; then
    CHROMIUM_CMD="chromium-browser"
    CHROMIUM_CONFIG_DIR="$HOME/.config/chromium"
elif command -v chromium &> /dev/null; then
    CHROMIUM_CMD="chromium"
    CHROMIUM_CONFIG_DIR="$HOME/.config/chromium"
else
    echo "Error: Neither chromium nor chromium-browser found"
    exit 1
fi

echo "Using browser: $CHROMIUM_CMD"

# Remove previous session (fix crash warnings)
if [ -f "$CHROMIUM_CONFIG_DIR/Default/Preferences" ]; then
    sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' "$CHROMIUM_CONFIG_DIR/Default/Preferences"
    sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' "$CHROMIUM_CONFIG_DIR/Default/Preferences"
fi

# Start Next.js application in background
cd "$APP_DIR"
echo "Starting Next.js server..."
NODE_ENV=production npm start &
SERVER_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "Stopping server (PID: $SERVER_PID)..."
    kill $SERVER_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGTERM SIGINT

# Wait for the server to be ready
echo "Waiting for server to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "Server is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "Error: Server failed to start within 30 seconds"
        cleanup
        exit 1
    fi
    sleep 1
done

# Start Chromium in kiosk mode (foreground)
echo "Starting Chromium in kiosk mode..."
$CHROMIUM_CMD \
  --noerrdialogs \
  --disable-infobars \
  --kiosk \
  --check-for-update-interval=31536000 \
  --disable-session-crashed-bubble \
  --disable-features=TranslateUI \
  http://localhost:3000

# Cleanup when Chromium exits
cleanup
