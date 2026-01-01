#!/bin/bash

# =============================================================================
# RPI Kiosk - Update Script
# =============================================================================
# This script updates the application to the latest version
#
# What it does:
#   1. Stops the service
#   2. Pulls latest code from git
#   3. Updates npm dependencies
#   4. Rebuilds the application
#   5. Restarts the service
#
# What it does NOT do:
#   - Update system packages (chromium, Node.js, etc.)
#   - Modify systemd service file
#
# Usage:
#   ./scripts/update.sh
# =============================================================================

set -e  # Exit on any error

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

INSTALL_USER=${SUDO_USER:-$USER}
INSTALL_HOME=$(eval echo ~$INSTALL_USER)
INSTALL_DIR="$INSTALL_HOME/rpi-kiosk"

# -----------------------------------------------------------------------------
# Main Update
# -----------------------------------------------------------------------------

echo "========================================="
echo "RPI Kiosk Update"
echo "========================================="
echo ""
echo "Update settings:"
echo "  User: $INSTALL_USER"
echo "  Directory: $INSTALL_DIR"
echo ""

# Step 1: Stop service
echo "[1/5] Stopping service..."
if systemctl is-active --quiet rpi-kiosk.service; then
    sudo systemctl stop rpi-kiosk.service
    echo "  - Stopped rpi-kiosk.service"
else
    echo "  - Service is not running"
fi

# Step 2: Pull latest code
echo "[2/5] Pulling latest code from git..."
cd "$INSTALL_DIR"

if git pull; then
    echo "  - Successfully pulled latest changes"
else
    echo "  - Warning: git pull failed"
    echo "  - Continuing with current code..."
fi

# Step 3: Update npm dependencies
echo "[3/5] Updating npm dependencies..."
npm install --legacy-peer-deps

# Step 4: Rebuild application
echo "[4/5] Rebuilding application..."
npm run build

# Step 5: Restart service
echo "[5/5] Restarting service..."
sudo systemctl start rpi-kiosk.service
echo "  - Started rpi-kiosk.service"

# Wait a moment for service to start
sleep 2

# Check service status
if systemctl is-active --quiet rpi-kiosk.service; then
    echo "  - Service is running"
else
    echo "  - Warning: Service may have failed to start"
    echo "  - Check logs with: sudo journalctl -u rpi-kiosk -f"
fi

# -----------------------------------------------------------------------------
# Update Complete
# -----------------------------------------------------------------------------

echo ""
echo "========================================="
echo "Update Complete!"
echo "========================================="
echo ""
echo "Service status:"
sudo systemctl status rpi-kiosk.service --no-pager -l
echo ""
echo "Useful commands:"
echo "  - View logs:     sudo journalctl -u rpi-kiosk -f"
echo "  - Check status:  sudo systemctl status rpi-kiosk"
echo "  - Restart:       sudo systemctl restart rpi-kiosk"
echo ""
