/*
 * formatters.js — Pure utility functions that convert raw data into human-readable strings.
 *
 * "Pure" means these functions have no side effects — they receive a value, transform it,
 * and return a string. They never call the API or update state. Components import
 * individual formatters to display dates, currencies, file sizes, and more consistently.
 */

import { format, formatDistanceToNow, parseISO } from 'date-fns';

/*
 * formatDate — Converts a date value into a formatted date string (no time portion).
 * @param {string|Date} date      - ISO date string or a JS Date object.
 * @param {string}      formatStr - date-fns format pattern; defaults to 'PPP' (e.g. "Jan 1st, 2025").
 * @returns {string} Formatted date string, or 'Invalid date' if parsing fails.
 */
export const formatDate = (date, formatStr = 'PPP') => {
  try {
    // parseISO converts an ISO 8601 string (e.g. "2025-01-15T10:30:00Z") into a JS Date object.
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  } catch (error) {
    return 'Invalid date';
  }
};

/*
 * formatTime — Converts a date value into a formatted time-only string.
 * @param {string|Date} date      - ISO date string or a JS Date object.
 * @param {string}      formatStr - date-fns format pattern; defaults to 'p' (e.g. "10:30 AM").
 * @returns {string} Formatted time string, or 'Invalid time' if parsing fails.
 */
export const formatTime = (date, formatStr = 'p') => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  } catch (error) {
    return 'Invalid time';
  }
};

/*
 * formatDateTime — Converts a date value into a combined date-and-time string.
 * @param {string|Date} date      - ISO date string or a JS Date object.
 * @param {string}      formatStr - date-fns format pattern; defaults to 'PPpp' (e.g. "Jan 1st, 2025, 10:30 AM").
 * @returns {string} Formatted date-time string, or 'Invalid date/time' if parsing fails.
 */
export const formatDateTime = (date, formatStr = 'PPpp') => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  } catch (error) {
    return 'Invalid date/time';
  }
};

/*
 * formatRelativeTime — Returns a human-friendly relative time string (e.g. "3 minutes ago").
 * Useful for chat timestamps and activity feeds where exact times matter less than recency.
 * @param {string|Date} date - The date to describe relative to right now.
 * @returns {string} Relative time string, or 'Unknown time' if parsing fails.
 */
export const formatRelativeTime = (date) => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    // { addSuffix: true } adds "ago" or "in" to the result (e.g. "3 minutes ago" vs "3 minutes").
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    return 'Unknown time';
  }
};

/*
 * formatCurrency — Formats a number as a localised currency string.
 * Uses the browser's built-in Intl API so the format respects the user's locale.
 * @param {number} value    - The numeric amount to format.
 * @param {string} currency - ISO 4217 currency code (e.g. 'USD', 'AED'); defaults to 'USD'.
 * @returns {string} Formatted string like "$1,234.56".
 */
export const formatCurrency = (value, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
};

/*
 * formatNumber — Rounds a numeric value to a fixed number of decimal places.
 * @param {number} value    - The number to format.
 * @param {number} decimals - How many decimal places to keep; defaults to 2.
 * @returns {string} Fixed-point string (e.g. "3.14").
 */
export const formatNumber = (value, decimals = 2) => {
  return parseFloat(value).toFixed(decimals);
};

/*
 * formatPercentage — Formats a number as a percentage string with a "%" suffix.
 * @param {number} value    - The percentage value (e.g. 87.5).
 * @param {number} decimals - Decimal places to show; defaults to 1.
 * @returns {string} Percentage string like "87.5%".
 */
export const formatPercentage = (value, decimals = 1) => {
  return `${parseFloat(value).toFixed(decimals)}%`;
};

/*
 * formatPhoneNumber — Reformats a raw digit string into (###) ###-#### format.
 * If the number does not match the expected 10-digit pattern, it is returned as-is.
 * @param {string} phone - The raw phone number string (may contain spaces or dashes).
 * @returns {string} Formatted phone number or the original string if it cannot be parsed.
 */
export const formatPhoneNumber = (phone) => {
  // Strip everything that is not a digit (\D = non-digit) before matching.
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};

/*
 * capitalizeFirstLetter — Uppercases the first character and lowercases the rest.
 * @param {string} str - The input string.
 * @returns {string} String with only the first letter capitalised (e.g. "hello" -> "Hello").
 */
export const capitalizeFirstLetter = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/*
 * capitalizeWords — Capitalises the first letter of every word in a string.
 * Useful for displaying names and titles in title case.
 * @param {string} str - The input string (e.g. "john doe").
 * @returns {string} Title-cased string (e.g. "John Doe").
 */
export const capitalizeWords = (str) => {
  return str
    .split(' ')
    .map((word) => capitalizeFirstLetter(word))
    .join(' ');
};

/*
 * truncate — Shortens a string to a maximum length and appends a suffix if it was cut.
 * Useful for preview text in cards or table cells where space is limited.
 * @param {string} str    - The string to potentially shorten.
 * @param {number} length - Maximum allowed length before truncating; defaults to 50.
 * @param {string} suffix - Characters appended after the cut; defaults to "...".
 * @returns {string} Original string if short enough, or the truncated version with suffix.
 */
export const truncate = (str, length = 50, suffix = '...') => {
  if (str.length <= length) return str;
  return str.substring(0, length).trim() + suffix;
};

/*
 * slugify — Converts a string into a URL-safe slug (lowercase, hyphens, no special chars).
 * For example, "Hello World!" becomes "hello-world". Used for generating clean URL paths.
 * @param {string} str - The input string to slugify.
 * @returns {string} URL-safe slug.
 */
export const slugify = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')  // Remove any character that is not a word char, space, or dash.
    .replace(/[\s_-]+/g, '-')  // Collapse spaces, underscores, or dashes into a single dash.
    .replace(/^-+|-+$/g, '');  // Strip any leading or trailing dashes.
};

/*
 * getInitials — Extracts the first character of a first and last name to form initials.
 * Used for avatar placeholders when no profile picture is available.
 * @param {string} firstName - The user's first name.
 * @param {string} lastName  - The user's last name; defaults to an empty string.
 * @returns {string} Two-character uppercase initials (e.g. "JD" for "John Doe").
 */
export const getInitials = (firstName, lastName = '') => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

/*
 * formatFileSize — Converts a raw byte count into a human-readable size string.
 * @param {number} bytes - File size in bytes.
 * @returns {string} Readable string like "2.5 MB" or "512 KB".
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  // Math.log finds which power of 1024 best represents the byte count.
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/*
 * formatAttendanceStatus — Maps a raw status string to a display-friendly label.
 * Falls back to the original status if no mapping exists (handles unexpected values).
 * @param {string} status - Raw status key (e.g. 'present', 'absent').
 * @returns {string} Capitalised display label (e.g. 'Present', 'Absent').
 */
export const formatAttendanceStatus = (status) => {
  const statusMap = {
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    excused: 'Excused',
  };
  return statusMap[status] || status;
};

/*
 * getAttendanceColor — Returns a colour theme name for a given attendance status.
 * The returned strings ('success', 'danger', etc.) map to CSS classes or design-system
 * colour variants used by badge and tag components in the UI.
 * @param {string} status - Raw attendance status key.
 * @returns {string} Colour variant name, or 'secondary' as a neutral fallback.
 */
export const getAttendanceColor = (status) => {
  const colorMap = {
    present: 'success',
    absent: 'danger',
    late: 'warning',
    excused: 'info',
  };
  return colorMap[status] || 'secondary';
};
