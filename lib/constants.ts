/**
 * Application-wide constants
 * System constraints and immutable configuration values
 *
 * Note: User-configurable values are in config.ts, not here.
 */

/**
 * API timeout and size limits
 * These are system constraints to prevent abuse and protect resources
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
 * Server-side data processing limits
 * These limits apply to API routes to prevent memory/performance issues
 */
export const PROCESSING_LIMITS = {
  /** Maximum number of RSS items to fetch per feed (server-side) */
  MAX_RSS_ITEMS_PER_FEED: 10,

  /** Maximum total number of RSS items after aggregation (server-side) */
  MAX_RSS_ITEMS_TOTAL: 20,

  /** Calendar events filter: show events within this many days from now */
  CALENDAR_DAYS_AHEAD: 30,

  /** RSS carousel auto-scroll interval (milliseconds) */
  RSS_CAROUSEL_INTERVAL_MS: 10000, // 10 seconds
} as const;

/**
 * Coordinate validation ranges
 * Physical constraints based on Earth's coordinate system
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
 * Validation ranges for user configuration
 */
export const VALIDATION = {
  /** Minimum allowed refresh interval (minutes) */
  MIN_REFRESH_INTERVAL: 1,

  /** Maximum allowed refresh interval (minutes) */
  MAX_REFRESH_INTERVAL: 1440, // 24 hours

  /** Minimum number of items to display */
  MIN_DISPLAY_ITEMS: 1,

  /** Maximum number of calendar events to display */
  MAX_CALENDAR_EVENTS_DISPLAY: 10,

  /** Maximum number of RSS items to display */
  MAX_RSS_ITEMS_DISPLAY: 10,
} as const;
