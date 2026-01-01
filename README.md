# RPI Hub

Kiosk display application for Raspberry Pi. Built with Next.js and TypeScript.

## Features

- 🕐 Clock (with timezone and date format customization)
- 🌤️ Weather (temperature, humidity, wind speed)
- 📅 Calendar (Google Calendar integration)
- 📰 News (RSS feeds)
- ⚙️ Web-based settings page with auto-detection
  - Browser timezone detection
  - Geolocation-based coordinates
  - Google Maps integration

## Requirements

- Raspberry Pi 3 or higher
- Raspberry Pi OS
- Node.js 22 LTS

## Installation

```bash
git clone https://github.com/nalbam/rpi-hub.git
cd rpi-hub
./scripts/install.sh
```

The installation script automatically handles:
- System package installation (chromium, unclutter, xdotool, curl, pcmanfm)
- Node.js 22 installation
- npm dependency installation and build
- Desktop wallpaper setup (background.png)
- systemd service registration and startup

## Update

```bash
./scripts/update.sh
```

Automatically fetches the latest code and builds without interrupting the service:
- git pull (latest code)
- npm install (update dependencies)
- npm run build (rebuild)

**Important**: After running update.sh, restart the service to apply changes:
```bash
sudo systemctl restart rpi-hub
```

## Uninstall

```bash
./scripts/uninstall.sh
```

Only removes the systemd service. App files and system packages are retained.

## Configuration

### Auto-Detection (First Time)

On first visit, the application automatically detects:
- **Timezone**: From browser settings (e.g., America/New_York)
- **City**: Extracted from timezone (e.g., New York)
- **Coordinates**: Via browser geolocation (with permission)

### Method 1: Web UI (Recommended)

Click the `Settings` button in the browser to make changes.

Features:
- Timezone dropdown with all IANA timezones (grouped by region)
- "Use Browser Default" buttons for timezone and city
- "Detect Location" button for coordinates
- "View on Google Maps" to verify location
- Date format selector (7 formats available)

### Method 2: Configuration File (config.json)

Manage settings with shell script:

```bash
# Create configuration file
./scripts/config.sh init

# Set values
./scripts/config.sh set timezone "America/New_York"
./scripts/config.sh set weatherLocation.lat 40.7128
./scripts/config.sh set weatherLocation.lon -74.0060
./scripts/config.sh set displayLimits.rssItems 10

# Get value
./scripts/config.sh get timezone

# View all settings
./scripts/config.sh list
```

**Priority**: config.json > browser-detected > defaults

**Smart Merge**: On first visit, browser settings (timezone, city, coordinates, language-based RSS) are auto-detected and saved to config.json. If config.json values match defaults, browser-detected values take precedence. Only explicitly different values override auto-detection.

### Configuration Options

**Time**
- Timezone (dropdown with all IANA timezones)
- Date format (7 predefined formats)
- Time server (optional)

**Weather**
- City name (with browser default button)
- Latitude/longitude (with geolocation detection)
- Refresh interval (minutes)

**Calendar**
- Google Calendar iCal URL
- Refresh interval (minutes)
- Number of events to display (1-10)

**RSS**
- Add/remove feed URLs
- Refresh interval (minutes)
- Number of news items to display (1-10)

### Getting Google Calendar URL

1. Google Calendar → Settings and sharing
2. Integrate calendar → Secret address
3. Copy iCal format URL

## Service Management

```bash
# Check status
sudo systemctl status rpi-hub

# Restart
sudo systemctl restart rpi-hub

# View logs
sudo journalctl -u rpi-hub -f

# Stop
sudo systemctl stop rpi-hub

# Start
sudo systemctl start rpi-hub
```

## Development

```bash
npm run dev
```

http://localhost:3000

## Technology Stack

- Node.js 22, Next.js 16, React 19, TypeScript 5
- Tailwind CSS, date-fns, ical.js, rss-parser
- Weather API: Open-Meteo (free)

## Project Structure

```
app/
├── api/              # API Routes
│   ├── calendar/
│   ├── rss/
│   └── weather/
├── settings/         # Settings page
└── page.tsx          # Main page

components/           # Widgets
├── Calendar/
├── Clock/
├── RSS/
└── Weather/

lib/
├── config.ts         # Configuration types and defaults
├── constants.ts      # System constants
├── storage.ts        # localStorage management
└── urlValidation.ts  # SSRF protection

scripts/
├── install.sh        # Installation and service registration
├── uninstall.sh      # Service removal
├── update.sh         # Update code and rebuild (no restart)
├── start-kiosk.sh    # Kiosk launcher
└── config.sh         # Configuration file management
```

## Troubleshooting

**Weather not displaying**
- Check internet connection
- Enter correct latitude/longitude in settings

**Calendar not displaying**
- Verify iCal URL format
- Check calendar sharing settings

**RSS not displaying**
- Verify valid RSS URL
- Check browser console for errors

## License

MIT License
