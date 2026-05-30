/*
 * userService.js — Admin-facing API functions for managing system user accounts.
 *
 * While authService.js handles the logged-in user's own auth (login, password change),
 * this service is for admin operations on other users — creating staff accounts,
 * updating profiles, or resetting someone else's password from the admin panel.
 */

import api from './api';

/*
 * getUsersByRole — Fetches all users that belong to a specific role (e.g. 'doctor', 'admin').
 * @param {string} role - The role to filter by.
 * @returns {Promise<Array>} List of user objects with that role.
 */
export const getUsersByRole = async (role) => {
  const response = await api.get(`/auth/users?role=${role}`);
  return response;
};

/*
 * createUser — Creates a new system user (typically used by admins to add staff accounts).
 * @param {object} userData - User details including name, email, role, and initial password.
 * @returns {Promise<object>} The newly created user record.
 */
export const createUser = async (userData) => {
  const response = await api.post('/auth/create-user', userData);
  return response;
};

/*
 * deleteUser — Permanently removes a user account from the system.
 * @param {string|number} userId - The ID of the user to delete.
 * @returns {Promise<object>} Server confirmation of the deletion.
 */
export const deleteUser = async (userId) => {
  const response = await api.delete(`/users/${userId}`);
  return response;
};

/*
 * updateUser — Updates a user's profile information (name, email, role, etc.).
 * @param {string|number} userId   - The ID of the user to update.
 * @param {object}        userData - The updated user fields.
 * @returns {Promise<object>} The updated user record.
 */
export const updateUser = async (userId, userData) => {
  const response = await api.put(`/users/${userId}`, userData);
  return response;
};

/*
 * resetPassword — Allows an admin to set a new password for any user by their ID.
 * Note the server expects the field name `new_password` (snake_case) as per the API contract.
 * @param {string|number} userId      - The ID of the user whose password should be reset.
 * @param {string}        newPassword - The new password to assign.
 * @returns {Promise<object>} Server confirmation of the password reset.
 */
export const resetPassword = async (userId, newPassword) => {
  const response = await api.post(`/users/${userId}/reset-password`, { new_password: newPassword });
  return response;
};
