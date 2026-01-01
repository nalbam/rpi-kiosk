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

# Remove previous session
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' ~/.config/chromium/Default/Preferences
sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' ~/.config/chromium/Default/Preferences

# Start Next.js application in development mode (change to production as needed)
cd /home/pi/rpi-kiosk
npm run build
npm start &

# Wait for the server to start
sleep 10

# Start Chromium in kiosk mode
chromium-browser \
  --noerrdialogs \
  --disable-infobars \
  --kiosk \
  --check-for-update-interval=31536000 \
  --disable-session-crashed-bubble \
  --disable-features=TranslateUI \
  http://localhost:3000
