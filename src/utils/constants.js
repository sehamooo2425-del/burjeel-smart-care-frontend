/*
 * constants.js — App-wide constant values shared across components and services.
 *
 * Hardcoding strings like 'admin' or 'pending' directly in components is fragile —
 * a typo anywhere breaks things silently. By defining them once here, every file
 * imports the same value, and a single change here updates the whole app.
 */

// User Roles — the three account types that exist in the system.
export const USER_ROLES = {
  ADMIN: 'admin',
  PATIENT: 'patient',
  DOCTOR: 'doctor',
};

// Attendance Status — the four possible outcomes for a patient's scheduled visit.
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused',
};

// Reminder Status — tracks where a reminder is in its delivery lifecycle.
export const REMINDER_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  DELIVERED: 'delivered',
};

// Reminder Frequency — how often a recurring reminder should fire.
export const REMINDER_FREQUENCY = {
  ONCE: 'once',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
};

// Reminder Channel — the delivery method used to reach the patient.
export const REMINDER_CHANNEL = {
  SMS: 'sms',
  EMAIL: 'email',
  PUSH: 'push',
  IN_APP: 'in_app',
};

// Message Types — the kind of content a chat message can carry.
export const MESSAGE_TYPE = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  SYSTEM: 'system',
};

// Chat Status — whether a conversation or user's chat is usable.
export const CHAT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BLOCKED: 'blocked',
};

// Alert Types — severity levels for toast/notification messages shown to the user.
export const ALERT_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// API Endpoints — base path segments for each resource; combined with API_BASE_URL in api.js.
export const API_ENDPOINTS = {
  AUTH: '/auth',
  PATIENTS: '/patients',
  REMINDERS: '/reminders',
  ATTENDANCE: '/attendance',
  CHAT: '/chat',
  APPOINTMENTS: '/appointments',
  REPORTS: '/reports',
};

// Pagination — default values used when fetching list data from the API.
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// Date Formats — format strings consumed by the date-fns `format()` function in formatters.js.
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy hh:mm a',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  SHORT: 'MM/dd/yyyy',
  LONG: 'EEEE, MMMM dd, yyyy',
};

// Time Formats — format strings for displaying time portions of a date.
export const TIME_FORMATS = {
  SHORT: 'h:mm a',
  LONG: 'h:mm:ss a',
  ISO: 'HH:mm:ss',
};

// Validation Rules — numeric limits used by validators.js to enforce field constraints.
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 255,
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 20,
  MRN_MIN_LENGTH: 4,
  MRN_MAX_LENGTH: 20,
};

// File Upload — restrictions applied when users upload documents or images.
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 10,
  ALLOWED_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/csv',
    'application/vnd.ms-excel',
  ],
  ALLOWED_EXTENSIONS: ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'csv', 'xls', 'xlsx'],
};

// Report Types — identifiers for the different kinds of reports the admin can generate.
export const REPORT_TYPES = {
  ATTENDANCE: 'attendance',
  REMINDERS: 'reminders',
  APPOINTMENTS: 'appointments',
  PATIENT_SUMMARY: 'patient_summary',
};

// Report Formats — the file formats available when exporting a report (used by useReportExport).
export const REPORT_FORMATS = {
  PDF: 'pdf',
  CSV: 'csv',
  EXCEL: 'excel',
  JSON: 'json',
};

// Default Values — miscellaneous timing and size defaults used throughout the app.
export const DEFAULTS = {
  PAGE_SIZE: 20,
  ALERT_DURATION: 5000,
  REQUEST_TIMEOUT: 10000,
  SOCKET_RECONNECT_DELAY: 1000,
};

// Cache Keys — string keys used when reading/writing items in localStorage or a cache layer.
export const CACHE_KEYS = {
  USER: 'user',
  CONVERSATIONS: 'conversations',
  PATIENTS: 'patients',
  REMINDERS: 'reminders',
};

// Feature Flags — boolean switches that enable or disable entire features without code changes.
// Set a flag to `false` to hide a feature in production while it's still being built.
export const FEATURES = {
  LIVE_CHAT: true,
  SMS_REMINDERS: true,
  EMAIL_REMINDERS: true,
  PUSH_NOTIFICATIONS: true,
  BULK_IMPORT: true,
  ANALYTICS: true,
  OFFLINE_MODE: false,
};

// App Configuration — top-level app metadata read from environment variables at build time.
// `import.meta.env` is Vite's way of injecting .env file values into the bundle.
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'Burjeel Smart Care',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:8000',
};

// Navigation Items — the sidebar links rendered for each user role.
// Keeping nav structure here (not inside a component) makes it easy to add or reorder pages.
export const ADMIN_NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard' },
  { label: 'Patients', path: '/admin/patients', icon: 'users' },
  { label: 'Reminders', path: '/admin/reminders', icon: 'bell' },
  { label: 'Attendance', path: '/admin/attendance', icon: 'check' },
  { label: 'Reports', path: '/admin/reports', icon: 'chart' },
  { label: 'Chat', path: '/admin/chat', icon: 'message' },
];

export const PATIENT_NAV_ITEMS = [
  { label: 'Dashboard', path: '/patient/dashboard', icon: 'dashboard' },
  { label: 'Appointments', path: '/patient/appointments', icon: 'calendar' },
  { label: 'Messages', path: '/patient/chat', icon: 'message' },
];
