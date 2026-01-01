#!/bin/bash

# =============================================================================
# RPI Kiosk - Configuration Management Script
# =============================================================================
# This script manages the config.json file
#
# Commands:
#   init          Create config.json from example template
#   get <key>     Get configuration value
#   set <key>     Set configuration value
#   list          List all configuration
#
# Examples:
#   ./scripts/config.sh init
#   ./scripts/config.sh set timezone "Asia/Seoul"
#   ./scripts/config.sh set weatherLocation.lat 37.5665
#   ./scripts/config.sh get timezone
#   ./scripts/config.sh list
#
# Requirements:
#   jq (install: sudo apt-get install jq)
# =============================================================================

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

CONFIG_FILE="config.json"
EXAMPLE_FILE="config.json.example"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory and paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_PATH="$PROJECT_DIR/$CONFIG_FILE"
EXAMPLE_PATH="$PROJECT_DIR/$EXAMPLE_FILE"

# -----------------------------------------------------------------------------
# Functions
# -----------------------------------------------------------------------------

# Initialize config from example template
init_config() {
    if [ -f "$CONFIG_PATH" ]; then
        echo -e "${YELLOW}Config file already exists: $CONFIG_PATH${NC}"
        return
    fi

    if [ ! -f "$EXAMPLE_PATH" ]; then
        echo -e "${RED}Error: Example config not found: $EXAMPLE_PATH${NC}"
        exit 1
    fi

    cp "$EXAMPLE_PATH" "$CONFIG_PATH"
    echo -e "${GREEN}Created config file: $CONFIG_PATH${NC}"
}

# Get a value from config
get_value() {
    local key=$1

    if [ ! -f "$CONFIG_PATH" ]; then
        echo -e "${RED}Error: Config file not found. Run: $0 init${NC}"
        exit 1
    fi

    # Use jq if available, otherwise use grep
    if command -v jq &> /dev/null; then
        jq -r ".$key // empty" "$CONFIG_PATH"
    else
        grep "\"$key\"" "$CONFIG_PATH" | sed 's/.*: "\(.*\)".*/\1/'
    fi
}

# Set a value in config
set_value() {
    local key=$1
    local value=$2

    if [ ! -f "$CONFIG_PATH" ]; then
        echo -e "${YELLOW}Config file not found. Creating from example...${NC}"
        init_config
    fi

    # Check if jq is available
    if ! command -v jq &> /dev/null; then
        echo -e "${YELLOW}Warning: jq not installed. Manual edit required.${NC}"
        echo "Please install jq: sudo apt-get install jq"
        exit 1
    fi

    # Create temporary file
    local tmp_file=$(mktemp)

    # Handle nested keys (e.g., weatherLocation.lat)
    if [[ $key == *.* ]]; then
        # Nested key
        jq ".$key = $value" "$CONFIG_PATH" > "$tmp_file"
    else
        # Simple key - check if value is number or string
        if [[ $value =~ ^[0-9]+(\.[0-9]+)?$ ]]; then
            # Number
            jq ".$key = $value" "$CONFIG_PATH" > "$tmp_file"
        else
            # String
            jq ".$key = \"$value\"" "$CONFIG_PATH" > "$tmp_file"
        fi
    fi

    mv "$tmp_file" "$CONFIG_PATH"
    echo -e "${GREEN}Updated $key = $value${NC}"
}

# List all configuration
list_config() {
    if [ ! -f "$CONFIG_PATH" ]; then
        echo -e "${RED}Error: Config file not found. Run: $0 init${NC}"
        exit 1
    fi

    if command -v jq &> /dev/null; then
        jq '.' "$CONFIG_PATH"
    else
        cat "$CONFIG_PATH"
    fi
}

# Show usage information
usage() {
    cat << EOF
Usage: $0 <command> [arguments]

Commands:
  init                          Create config.json from example
  get <key>                     Get configuration value
  set <key> <value>             Set configuration value
  list                          List all configuration

Examples:
  $0 init
  $0 get timezone
  $0 set timezone "America/New_York"
  $0 set weatherLocation.lat 40.7128
  $0 set weatherLocation.lon -74.0060
  $0 set weatherLocation.city "New York"
  $0 set displayLimits.rssItems 10
  $0 list

Available Configuration Keys:
  timezone
  weatherLocation.lat
  weatherLocation.lon
  weatherLocation.city
  calendarUrl
  refreshIntervals.weather
  refreshIntervals.calendar
  refreshIntervals.rss
  displayLimits.calendarEvents
  displayLimits.rssItems

Requirements:
  jq - Install with: sudo apt-get install jq
EOF
}

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------

case "$1" in
    init)
        init_config
        ;;
    get)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Missing key${NC}"
            usage
            exit 1
        fi
        get_value "$2"
        ;;
    set)
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo -e "${RED}Error: Missing key or value${NC}"
            usage
            exit 1
        fi
        set_value "$2" "$3"
        ;;
    list)
        list_config
        ;;
    *)
        usage
        ;;
esac
