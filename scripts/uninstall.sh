#!/bin/bash

# =============================================================================
# RPI Kiosk - Uninstallation Script
# =============================================================================
# This script removes the systemd service
#
# What it does:
#   1. Stops the rpi-kiosk service
#   2. Disables the service
#   3. Removes the service file
#   4. Reloads systemd daemon
#
# What it does NOT do:
#   - Remove application files
#   - Remove system packages (chromium, Node.js, etc.)
#
# Usage:
#   ./scripts/uninstall.sh
# =============================================================================

# Note: Do not use 'set -e' here - we want to continue even if some steps fail

# -----------------------------------------------------------------------------
# Main Uninstallation
# -----------------------------------------------------------------------------

echo "========================================="
echo "RPI Kiosk Uninstallation"
echo "========================================="
echo ""

# Step 1: Stop service
echo "[1/4] Stopping service..."
if systemctl is-active --quiet rpi-kiosk.service; then
    sudo systemctl stop rpi-kiosk.service
    echo "  - Stopped rpi-kiosk.service"
else
    echo "  - Service is not running"
fi

# Step 2: Disable service
echo "[2/4] Disabling service..."
if systemctl is-enabled --quiet rpi-kiosk.service 2>/dev/null; then
    sudo systemctl disable rpi-kiosk.service
    echo "  - Disabled rpi-kiosk.service"
else
    echo "  - Service is not enabled"
fi

# Step 3: Remove service file
echo "[3/4] Removing service file..."
if [ -f /etc/systemd/system/rpi-kiosk.service ]; then
    sudo rm /etc/systemd/system/rpi-kiosk.service
    echo "  - Removed rpi-kiosk.service"
else
    echo "  - Service file not found"
fi

# Step 4: Reload systemd daemon
echo "[4/4] Reloading systemd daemon..."
sudo systemctl daemon-reload
sudo systemctl reset-failed

# -----------------------------------------------------------------------------
# Uninstallation Complete
# -----------------------------------------------------------------------------

echo ""
echo "========================================="
echo "Uninstallation Complete!"
echo "========================================="
echo ""
echo "Service removed: rpi-kiosk.service"
echo ""
echo "Note: The following are NOT removed:"
echo "  - Application files in ~/rpi-kiosk"
echo "  - System packages (chromium, Node.js, etc.)"
echo ""
echo "To completely remove application files:"
echo "  cd ~ && rm -rf rpi-kiosk"
echo ""
