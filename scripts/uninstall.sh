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
echo "[4/5] Reloading systemd daemon..."
sudo systemctl daemon-reload
sudo systemctl reset-failed

# Step 5: Restore original wallpaper
echo "[5/5] Restoring original wallpaper..."

INSTALL_USER=${SUDO_USER:-$USER}
INSTALL_HOME=$(eval echo ~$INSTALL_USER)
CONFIG_DIR="$INSTALL_HOME/.config/rpi-kiosk"
BACKUP_FILE="$CONFIG_DIR/wallpaper.backup"

if [ -f "$BACKUP_FILE" ]; then
    ORIGINAL_WALLPAPER=$(cat "$BACKUP_FILE")
    if [ -n "$ORIGINAL_WALLPAPER" ] && [ -f "$ORIGINAL_WALLPAPER" ]; then
        echo "  - Restoring wallpaper to: $ORIGINAL_WALLPAPER"
        if command -v pcmanfm &> /dev/null; then
            DISPLAY=:0 pcmanfm --set-wallpaper "$ORIGINAL_WALLPAPER" 2>/dev/null || true
            echo "  - Desktop wallpaper restored"
        fi
    else
        echo "  - Original wallpaper file not found, skipping restore"
    fi

    # Clean up backup and wallpaper files
    rm -f "$BACKUP_FILE"
    rm -f "$CONFIG_DIR/background.png"
    rmdir "$CONFIG_DIR" 2>/dev/null || true
    echo "  - Cleaned up wallpaper backup files"
else
    echo "  - No wallpaper backup found, skipping restore"
fi

# -----------------------------------------------------------------------------
# Uninstallation Complete
# -----------------------------------------------------------------------------

echo ""
echo "========================================="
echo "Uninstallation Complete!"
echo "========================================="
echo ""
echo "Service removed: rpi-kiosk.service"
echo "Wallpaper restored to original"
echo ""
echo "Note: The following are NOT removed:"
echo "  - Application files in ~/rpi-kiosk"
echo "  - System packages (chromium, Node.js, etc.)"
echo ""
echo "To completely remove application files:"
echo "  cd ~ && rm -rf rpi-kiosk"
echo ""
