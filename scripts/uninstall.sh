#!/bin/bash

# Uninstall script for RPI Kiosk
# This script removes the systemd service and optionally the application

set -e  # Exit on error

echo "========================================="
echo "RPI Kiosk Uninstallation"
echo "========================================="
echo ""

# Stop service
echo "[1/4] Stopping service..."
if systemctl is-active --quiet rpi-kiosk.service; then
    sudo systemctl stop rpi-kiosk.service
    echo "  - Stopped rpi-kiosk.service"
else
    echo "  - Service is not running"
fi

# Disable service
echo "[2/4] Disabling service..."
if systemctl is-enabled --quiet rpi-kiosk.service 2>/dev/null; then
    sudo systemctl disable rpi-kiosk.service
    echo "  - Disabled rpi-kiosk.service"
else
    echo "  - Service is not enabled"
fi

# Remove service file
echo "[3/4] Removing service file..."
if [ -f /etc/systemd/system/rpi-kiosk.service ]; then
    sudo rm /etc/systemd/system/rpi-kiosk.service
    echo "  - Removed rpi-kiosk.service"
else
    echo "  - Service file not found"
fi

# Reload systemd
sudo systemctl daemon-reload
sudo systemctl reset-failed

echo "[4/4] Cleanup complete"
echo ""
echo "========================================="
echo "Uninstallation complete!"
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
