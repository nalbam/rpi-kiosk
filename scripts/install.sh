#!/bin/bash

# Install script for RPI Kiosk
# Run this script on your Raspberry Pi to set up the kiosk

set -e  # Exit on error

echo "Installing RPI Kiosk dependencies..."

# Update system
sudo apt-get update

# Install required packages
# Try chromium first (newer Debian/Raspberry Pi OS), fall back to chromium-browser
if apt-cache show chromium &> /dev/null; then
    echo "Installing chromium (newer package name)..."
    sudo apt-get install -y chromium unclutter xdotool
elif apt-cache show chromium-browser &> /dev/null; then
    echo "Installing chromium-browser (legacy package name)..."
    sudo apt-get install -y chromium-browser unclutter xdotool
else
    echo "Error: Neither chromium nor chromium-browser package found"
    exit 1
fi

# Install Node.js (if not already installed)
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install application dependencies
echo "Installing npm dependencies..."
npm install --legacy-peer-deps

# Build the application
echo "Building application..."
npm run build

# Make the startup script executable
chmod +x scripts/start-kiosk.sh

echo ""
echo "Installation complete!"
echo ""
echo "To set up auto-start on boot:"
echo "1. Edit the autostart file:"
echo "   sudo nano /etc/xdg/lxsession/LXDE-pi/autostart"
echo ""
echo "2. Add this line:"
echo "   @/home/pi/rpi-kiosk/scripts/start-kiosk.sh"
echo ""
echo "3. Reboot your Raspberry Pi"
echo ""
