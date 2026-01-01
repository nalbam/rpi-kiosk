/**
 * Application-wide constants
 * Centralized location for all magic numbers and configuration values
 */

/**
 * API timeout and size limits
 */
export const API = {
  /** Default timeout for external API requests (milliseconds) */
  TIMEOUT_MS: 10000,

  /** Maximum response size for weather API (bytes) */
  MAX_WEATHER_SIZE: 1024 * 1024, // 1MB

  /** Maximum response size for calendar API (bytes) */
  MAX_CALENDAR_SIZE: 5 * 1024 * 1024, // 5MB

  /** Maximum response size for RSS API (bytes) */
  MAX_RSS_SIZE: 5 * 1024 * 1024, // 5MB

  /** Default maximum response size for fetchWithTimeout (bytes) */
  MAX_RESPONSE_SIZE: 10 * 1024 * 1024, // 10MB

  /** Maximum number of redirects to follow */
  MAX_REDIRECTS: 5,
} as const;

/**
 * Data display limits
 */
export const DISPLAY = {
  /** Maximum number of calendar events to show */
  MAX_CALENDAR_EVENTS: 10,

  /** Maximum number of RSS items per feed */
  MAX_RSS_ITEMS_PER_FEED: 10,

  /** Maximum total number of RSS items */
  MAX_RSS_ITEMS_TOTAL: 20,

  /** Number of RSS items to display in carousel */
  RSS_CAROUSEL_SIZE: 5,

  /** RSS carousel auto-scroll interval (milliseconds) */
  RSS_CAROUSEL_INTERVAL: 10000, // 10 seconds
} as const;

/**
 * Coordinate validation ranges
 */
export const COORDINATES = {
  /** Minimum latitude value */
  MIN_LATITUDE: -90,

  /** Maximum latitude value */
  MAX_LATITUDE: 90,

  /** Minimum longitude value */
  MIN_LONGITUDE: -180,

  /** Maximum longitude value */
  MAX_LONGITUDE: 180,
} as const;

/**
 * Refresh intervals (minutes)
 */
export const REFRESH_INTERVALS = {
  /** Minimum allowed refresh interval */
  MIN_INTERVAL: 1,
} as const;
