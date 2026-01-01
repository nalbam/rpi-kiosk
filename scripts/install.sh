#!/bin/bash

# =============================================================================
# RPI Hub - Installation Script
# =============================================================================
# This script installs and configures the RPI Hub on Raspberry Pi
#
# What it does:
#   1. Updates system packages
#   2. Installs required dependencies (Chromium, Node.js, etc.)
#   3. Pulls latest code from git
#   4. Installs npm dependencies and builds the application
#   5. Creates and starts systemd service
#
# Usage:
#   ./scripts/install.sh
# =============================================================================

set -e  # Exit on any error

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

INSTALL_USER=${SUDO_USER:-$USER}
INSTALL_HOME=$(eval echo ~$INSTALL_USER)

# Get script directory and project directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="$(dirname "$SCRIPT_DIR")"

# -----------------------------------------------------------------------------
# Main Installation
# -----------------------------------------------------------------------------

echo "========================================="
echo "RPI Hub Installation"
echo "========================================="
echo ""
echo "Installation settings:"
echo "  User: $INSTALL_USER"
echo "  Home: $INSTALL_HOME"
echo "  Directory: $INSTALL_DIR"
echo ""

# Step 1: Update system packages
echo "[1/6] Updating system packages..."
sudo apt-get update

# Step 2: Install system dependencies
echo "[2/6] Installing system dependencies..."

# Detect Chromium package name (chromium vs chromium-browser)
if apt-cache show chromium &> /dev/null; then
    echo "  - Installing chromium (newer package name)"
    sudo apt-get install -y chromium unclutter xdotool curl pcmanfm
elif apt-cache show chromium-browser &> /dev/null; then
    echo "  - Installing chromium-browser (legacy package name)"
    sudo apt-get install -y chromium-browser unclutter xdotool curl pcmanfm
else
    echo "  - Error: Neither chromium nor chromium-browser package found"
    exit 1
fi

# Step 3: Install Node.js
echo "[3/6] Checking Node.js installation..."

if ! command -v node &> /dev/null; then
    echo "  - Installing Node.js 22 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    NODE_VERSION=$(node -v)
    echo "  - Node.js already installed: $NODE_VERSION"
fi

# Step 4: Install application dependencies
echo "[4/6] Installing application dependencies..."
cd "$INSTALL_DIR"

# Pull latest code from git
echo "  - Pulling latest code from git..."
git pull || echo "  - Warning: git pull failed (may not be a git repository)"

# Install npm packages
echo "  - Installing npm packages..."
npm install --legacy-peer-deps

# Step 5: Build application
echo "[5/6] Building application..."
npm run build

# Step 6: Set desktop wallpaper
echo "[6/7] Setting desktop wallpaper..."

# Create config directory for backup
CONFIG_DIR="$INSTALL_HOME/.config/rpi-hub"
mkdir -p "$CONFIG_DIR"

# Check if running in graphical environment
if [ -n "$DISPLAY" ] || [ -f "$INSTALL_HOME/.config/pcmanfm/LXDE-pi/desktop-items-0.conf" ]; then
    # Backup current wallpaper path
    CURRENT_WALLPAPER=""
    if [ -f "$INSTALL_HOME/.config/pcmanfm/LXDE-pi/desktop-items-0.conf" ]; then
        CURRENT_WALLPAPER=$(grep "^wallpaper=" "$INSTALL_HOME/.config/pcmanfm/LXDE-pi/desktop-items-0.conf" | cut -d'=' -f2)
        echo "  - Current wallpaper: $CURRENT_WALLPAPER"
        echo "$CURRENT_WALLPAPER" > "$CONFIG_DIR/wallpaper.backup"
    fi

    # Copy background image to home directory
    WALLPAPER_PATH="$INSTALL_HOME/.config/rpi-hub/background.png"
    if [ -f "$INSTALL_DIR/public/background.png" ]; then
        cp "$INSTALL_DIR/public/background.png" "$WALLPAPER_PATH"
        echo "  - Copied background.png to $WALLPAPER_PATH"

        # Set wallpaper using pcmanfm
        if command -v pcmanfm &> /dev/null; then
            DISPLAY=:0 pcmanfm --set-wallpaper "$WALLPAPER_PATH" 2>/dev/null || true
            echo "  - Set desktop wallpaper to background.png"
        else
            echo "  - Warning: pcmanfm not found, skipping wallpaper setup"
        fi
    else
        echo "  - Warning: public/background.png not found, skipping wallpaper setup"
    fi
else
    echo "  - Skipping wallpaper setup (no graphical environment detected)"
fi

# Step 7: Install systemd service
echo "[7/7] Installing systemd service..."

# Make start script executable
chmod +x scripts/start-kiosk.sh

# Create systemd service file
echo "  - Creating rpi-hub.service..."
sudo tee /etc/systemd/system/rpi-hub.service > /dev/null <<EOF
[Unit]
Description=RPI Hub (Next.js + Chromium Kiosk Mode)
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

# Reload and start service
echo "  - Reloading systemd daemon..."
sudo systemctl daemon-reload

echo "  - Enabling service..."
sudo systemctl enable rpi-hub.service

echo "  - Starting service..."
sudo systemctl start rpi-hub.service

# -----------------------------------------------------------------------------
# Installation Complete
# -----------------------------------------------------------------------------

echo ""
echo "========================================="
echo "Installation Complete!"
echo "========================================="
echo ""
echo "Service installed and started:"
echo "  - rpi-hub.service"
echo ""
echo "Useful commands:"
echo "  - Check status:  sudo systemctl status rpi-hub"
echo "  - View logs:     sudo journalctl -u rpi-hub -f"
echo "  - Restart:       sudo systemctl restart rpi-hub"
echo "  - Stop:          sudo systemctl stop rpi-hub"
echo ""
echo "To uninstall:"
echo "  ./scripts/uninstall.sh"
echo ""
