/*
 * api.js — Central Axios instance used by every service in this app.
 *
 * All HTTP requests (GET, POST, PUT, DELETE) go through this single object so that
 * shared concerns — the base URL, auth token injection, and global error handling —
 * are configured in one place instead of repeated in every service file.
 */

import axios from 'axios';

// Read the API base URL from environment variables; fall back to localhost for local development.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/*
 * api — Pre-configured Axios instance with a base URL, a 10-second timeout,
 * and a default Content-Type header so every request sends JSON by default.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // Abort requests that take longer than 10 seconds to avoid hanging UIs.
  headers: {
    'Content-Type': 'application/json',
  },
});

/*
 * Request interceptor — Runs automatically before every outgoing request.
 * It reads the JWT token from localStorage and attaches it to the Authorization
 * header so the server knows which user is making the request.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // The "Bearer" prefix is a standard HTTP convention for JWT tokens.
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // Always return the (possibly modified) config to continue the request.
  },
  (error) => Promise.reject(error) // Pass request-setup errors through unchanged.
);

/*
 * Response interceptor — Runs automatically after every response arrives.
 * The success path unwraps `response.data` so callers receive the payload directly.
 * The error path logs the problem and handles the special case where an expired
 * token causes a 401, forcing a logout and redirect to the login page.
 */
api.interceptors.response.use(
  // On success, return only the data payload — not the full Axios response object.
  (response) => response.data,
  (error) => {
    // Log errors to console instead of blocking UI
    // Use optional chaining (?.) to safely access nested properties that may not exist.
    const errorMessage = error.response?.data?.message || error.message || 'Network error';
    const errorCode = error.response?.status;

    console.error(`[API Error ${errorCode}]:`, errorMessage);

    // Only redirect on 401 if user has a token (authenticated session expired)
    // A 401 without a stored token means the user was never logged in — no redirect needed.
    if (error.response?.status === 401 && localStorage.getItem('authToken')) {
      console.warn('Token expired, logging out...');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      // Hard-navigate to the login page; a React router push won't work here because
      // interceptors run outside of the component tree.
      window.location.href = '/login';
    }

    // Return error but don't block the UI
    // Reject the promise so the calling service's catch block can handle the error.
    return Promise.reject(error.response?.data || { message: errorMessage });
  }
);

export default api;
