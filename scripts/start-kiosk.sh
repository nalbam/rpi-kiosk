#!/bin/bash

# =============================================================================
# RPI Kiosk - Startup Script
# =============================================================================
# This script starts the Next.js server and Chromium in kiosk mode
#
# What it does:
#   1. Configures display and disables screensaver
#   2. Hides mouse cursor
#   3. Starts Next.js server in background
#   4. Waits for server to be ready
#   5. Starts Chromium in kiosk mode
#
# Usage:
#   Called by systemd service (do not run manually)
# =============================================================================

set -e  # Exit on any error

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

# Set display environment
export DISPLAY=:0
export XAUTHORITY=${XAUTHORITY:-$HOME/.Xauthority}

# -----------------------------------------------------------------------------
# Functions
# -----------------------------------------------------------------------------

# Cleanup function - stops server on exit
cleanup() {
    echo "Stopping server (PID: $SERVER_PID)..."
    kill $SERVER_PID 2>/dev/null || true
    exit 0
}

# -----------------------------------------------------------------------------
# Main Startup
# -----------------------------------------------------------------------------

echo "Starting RPI Kiosk..."
echo "App directory: $APP_DIR"

# Step 1: Configure display
echo "Configuring display..."

# Disable screensaver and blanking
xset s off
xset -dpms
xset s noblank

# Hide mouse cursor
unclutter -idle 0.5 -root &

# Step 2: Detect Chromium command
echo "Detecting Chromium installation..."

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

# Step 3: Fix Chromium crash warnings
echo "Fixing previous session state..."

if [ -f "$CHROMIUM_CONFIG_DIR/Default/Preferences" ]; then
    sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' "$CHROMIUM_CONFIG_DIR/Default/Preferences"
    sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' "$CHROMIUM_CONFIG_DIR/Default/Preferences"
fi

# Step 4: Start Next.js server
echo "Starting Next.js server..."

cd "$APP_DIR"
NODE_ENV=production npm start &
SERVER_PID=$!

# Register cleanup handler
trap cleanup SIGTERM SIGINT

# Step 5: Wait for server to be ready
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

# Step 6: Start Chromium in kiosk mode
echo "Starting Chromium in kiosk mode..."

$CHROMIUM_CMD \
  --noerrdialogs \
  --disable-infobars \
  --kiosk \
  --check-for-update-interval=31536000 \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --disable-translate \
  --disable-features=Translate,TranslateUI,PasswordManager \
  --password-store=basic \
  --disable-component-update \
  http://localhost:3000

# Cleanup when Chromium exits
cleanup
