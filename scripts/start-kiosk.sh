#!/bin/bash

# RPI Kiosk Mode Startup Script
# This script starts the Next.js application in kiosk mode

# Set display
export DISPLAY=:0

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

# Remove previous session (fix crash warnings)
if [ -f "$CHROMIUM_CONFIG_DIR/Default/Preferences" ]; then
    sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' "$CHROMIUM_CONFIG_DIR/Default/Preferences"
    sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' "$CHROMIUM_CONFIG_DIR/Default/Preferences"
fi

# Start Next.js application in development mode (change to production as needed)
cd /home/pi/rpi-kiosk
npm run build
npm start &

# Wait for the server to start
sleep 10

# Start Chromium in kiosk mode
$CHROMIUM_CMD \
  --noerrdialogs \
  --disable-infobars \
  --kiosk \
  --check-for-update-interval=31536000 \
  --disable-session-crashed-bubble \
  --disable-features=TranslateUI \
  http://localhost:3000
