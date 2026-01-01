#!/bin/bash

# Install script for RPI Kiosk
# Run this script on your Raspberry Pi to set up the kiosk

set -e  # Exit on error

echo "========================================="
echo "RPI Kiosk Installation"
echo "========================================="
echo ""

# Get the current user and home directory
INSTALL_USER=${SUDO_USER:-$USER}
INSTALL_HOME=$(eval echo ~$INSTALL_USER)
INSTALL_DIR="$INSTALL_HOME/rpi-kiosk"

echo "Installation settings:"
echo "  User: $INSTALL_USER"
echo "  Home: $INSTALL_HOME"
echo "  Install directory: $INSTALL_DIR"
echo ""

# Update system
echo "[1/6] Updating system packages..."
sudo apt-get update

# Install required packages
echo "[2/6] Installing system dependencies..."
# Try chromium first (newer Debian/Raspberry Pi OS), fall back to chromium-browser
if apt-cache show chromium &> /dev/null; then
    echo "  - Installing chromium (newer package name)..."
    sudo apt-get install -y chromium unclutter xdotool curl
elif apt-cache show chromium-browser &> /dev/null; then
    echo "  - Installing chromium-browser (legacy package name)..."
    sudo apt-get install -y chromium-browser unclutter xdotool curl
else
    echo "Error: Neither chromium nor chromium-browser package found"
    exit 1
fi

# Install Node.js (if not already installed)
echo "[3/6] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "  - Installing Node.js 22 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    NODE_VERSION=$(node -v)
    echo "  - Node.js already installed: $NODE_VERSION"
fi

# Install application dependencies
echo "[4/6] Installing npm dependencies..."
cd "$INSTALL_DIR"

# Pull latest changes
echo "  - Pulling latest code from git..."
git pull || echo "  - Warning: git pull failed (may not be a git repository)"

npm install --legacy-peer-deps

# Build the application
echo "[5/6] Building application..."
npm run build

# Install systemd service
echo "[6/6] Installing systemd service..."

# Make scripts executable
chmod +x scripts/start-kiosk.sh

# Create service file with correct paths
echo "  - Creating rpi-kiosk.service..."
sudo tee /etc/systemd/system/rpi-kiosk.service > /dev/null <<EOF
[Unit]
Description=RPI Kiosk (Next.js + Chromium Kiosk Mode)
After=graphical.target network.target
Wants=graphical.target

[Service]
Type=simple
User=$INSTALL_USER
Environment=DISPLAY=:0
Environment=XAUTHORITY=$INSTALL_HOME/.Xauthority
Environment=NODE_ENV=production
ExecStart=$INSTALL_DIR/scripts/start-kiosk.sh
Restart=on-failure
RestartSec=10
KillMode=mixed
TimeoutStopSec=30

[Install]
WantedBy=graphical.target
EOF

# Reload systemd
echo "  - Reloading systemd daemon..."
sudo systemctl daemon-reload

# Enable service
echo "  - Enabling service..."
sudo systemctl enable rpi-kiosk.service

# Start service
echo "  - Starting service..."
sudo systemctl start rpi-kiosk.service

echo ""
echo "========================================="
echo "Installation complete!"
echo "========================================="
echo ""
echo "Service installed and started:"
echo "  - rpi-kiosk.service (Next.js server + Chromium kiosk)"
echo ""
echo "Useful commands:"
echo "  - Check status:  sudo systemctl status rpi-kiosk"
echo "  - View logs:     sudo journalctl -u rpi-kiosk -f"
echo "  - Restart:       sudo systemctl restart rpi-kiosk"
echo "  - Stop:          sudo systemctl stop rpi-kiosk"
echo "  - Disable:       sudo systemctl disable rpi-kiosk"
echo ""
echo "To uninstall, run: ./scripts/uninstall.sh"
echo ""
