#!/bin/bash

# =============================================================================
# RPI Kiosk - Update Script
# =============================================================================
# This script updates the application to the latest version
#
# What it does:
#   1. Pulls latest code from git
#   2. Updates npm dependencies
#   3. Rebuilds the application
#
# What it does NOT do:
#   - Stop or restart the service (you need to restart manually)
#   - Update system packages (chromium, Node.js, etc.)
#   - Modify systemd service file
#
# Note: After running this script, restart the service to apply changes:
#   sudo systemctl restart rpi-kiosk
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

# Step 1: Pull latest code
echo "[1/3] Pulling latest code from git..."
cd "$INSTALL_DIR"

if git pull; then
    echo "  - Successfully pulled latest changes"
else
    echo "  - Warning: git pull failed"
    echo "  - Continuing with current code..."
fi

# Step 2: Update npm dependencies
echo "[2/3] Updating npm dependencies..."
npm install --legacy-peer-deps

# Step 3: Rebuild application
echo "[3/3] Rebuilding application..."
npm run build

# -----------------------------------------------------------------------------
# Update Complete
# -----------------------------------------------------------------------------

echo ""
echo "========================================="
echo "Update Complete!"
echo "========================================="
echo ""
echo "IMPORTANT: Restart the service to apply changes:"
echo "  sudo systemctl restart rpi-kiosk"
echo ""
echo "Useful commands:"
echo "  - Restart:       sudo systemctl restart rpi-kiosk"
echo "  - Check status:  sudo systemctl status rpi-kiosk"
echo "  - View logs:     sudo journalctl -u rpi-kiosk -f"
echo ""
