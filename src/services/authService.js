/*
 * authService.js — Functions for all authentication-related API calls.
 *
 * This file is the single place for login, registration, password management,
 * and user-listing requests. Keeping these calls here (rather than scattered across
 * components) makes it easy to update endpoints or error messages in one spot.
 */

import api from './api';

/*
 * login — Sends credentials to the server and returns the response (which typically
 * includes a JWT token and user object on success).
 * @param {string} username
 * @param {string} password
 * @returns {Promise<object>} Server response with token and user data.
 */
/*
 * login — Sends credentials to the server.
 * totpCode is optional; pass it only when the user has 2FA enabled and has entered their code.
 * The raw error is re-thrown (not wrapped) so callers can inspect the `detail` field and
 * detect when the backend is asking for a TOTP code before reporting a failure.
 */
export const login = async (username, password, totpCode = null) => {
  const body = { username, password };
  if (totpCode) body.totp_code = totpCode;
  // Let the error propagate as-is — do NOT wrap it in `new Error()` here.
  // Wrapping strips the `detail` field that callers need to detect the 2FA prompt.
  const response = await api.post('/auth/login', body);
  return response;
};

/*
 * register — Creates a new user account with the provided data object.
 * @param {object} userData - Fields required by the server (e.g. name, email, role).
 * @returns {Promise<object>} The newly created user record.
 */
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response;
  } catch (error) {
    console.error('[Auth] Registration failed:', error?.message || error);
    // Prefer the server's detailed error message (detail) over a generic fallback.
    throw new Error(error?.response?.data?.detail || error?.message || 'Registration failed');
  }
};

/*
 * logout — Clears the stored token and user data from localStorage.
 * This is a local-only operation; no server call is needed because JWTs are stateless.
 */
export const logout = async () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

/*
 * getCurrentUser — Fetches the profile of the currently authenticated user from the server.
 * @returns {Promise<object>} The logged-in user's profile data.
 */
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response;
};

/*
 * changePassword — Updates the authenticated user's password.
 * @param {string} currentPassword - The user's existing password for verification.
 * @param {string} newPassword     - The new password to set.
 * @returns {Promise<object>} Server confirmation of the change.
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response;
  } catch (error) {
    throw new Error('Password change failed');
  }
};

/*
 * resetPassword — Triggers a password-reset email to be sent to the given address.
 * @param {string} email - The email address associated with the account.
 * @returns {Promise<object>} Server confirmation that the reset email was dispatched.
 */
export const resetPassword = async (email) => {
  try {
    const response = await api.post('/auth/reset-password', { email });
    return response;
  } catch (error) {
    throw new Error('Password reset failed');
  }
};

/*
 * verifyResetToken — Checks whether a password-reset token (from an email link) is still valid.
 * @param {string} token - The reset token parsed from the URL.
 * @returns {Promise<object>} Server confirmation of token validity.
 */
export const verifyResetToken = async (token) => {
  try {
    const response = await api.get(`/auth/verify-reset-token/${token}`);
    return response;
  } catch (error) {
    throw new Error('Invalid reset token');
  }
};

/*
 * confirmPasswordReset — Finalises a password reset by submitting the token and new password.
 * @param {string} token       - The reset token received via email.
 * @param {string} newPassword - The new password chosen by the user.
 * @returns {Promise<object>} Server confirmation of the completed reset.
 */
export const confirmPasswordReset = async (token, newPassword) => {
  try {
    const response = await api.post('/auth/confirm-password-reset', {
      token,
      newPassword,
    });
    return response;
  } catch (error) {
    throw new Error('Password reset confirmation failed');
  }
};

/*
 * getUsers — Fetches all users, optionally filtered by role (e.g. 'doctor', 'admin').
 * @param {string} role - Optional role string to filter results; omit to get all users.
 * @returns {Promise<Array>} List of user objects.
 */
export const getUsers = async (role = '') => {
  try {
    // Only append the role query param when a role is actually provided.
    const url = role ? `/auth/users?role=${role}` : '/auth/users';
    const response = await api.get(url);
    return response;
  } catch (error) {
    throw new Error('Failed to fetch users');
  }
};
