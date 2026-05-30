/*
 * reminderService.js — API functions for managing patient appointment reminders.
 *
 * Reminders are scheduled notifications (SMS, email, push, or in-app) sent to patients
 * before their appointments. This service handles fetching, creating, updating, deleting,
 * and manually triggering those reminders through the backend API.
 */

import api from './api';

/*
 * getReminders — Fetches all reminders, optionally scoped to a specific patient.
 * @param {string|number} patientId - Optional patient ID to filter results.
 * @returns {Promise<Array>} List of reminder objects.
 */
export const getReminders = async (patientId) => {
  const params = {};
  // Only add the patient_id filter when a specific patient is requested.
  if (patientId) params.patient_id = patientId;
  const response = await api.get('/reminders/', { params });
  return response;
};

/*
 * getReminderById — Retrieves a single reminder's details by its ID.
 * @param {string|number} reminderId - The reminder's unique database ID.
 * @returns {Promise<object>} The reminder object.
 */
export const getReminderById = async (reminderId) => {
  const response = await api.get(`/reminders/${reminderId}/`);
  return response;
};

/*
 * createReminder — Creates a new reminder for a patient.
 * @param {object} reminderData - Reminder details (patient ID, channel, schedule, message, etc.).
 * @returns {Promise<object>} The newly created reminder record.
 */
export const createReminder = async (reminderData) => {
  const response = await api.post('/reminders/', reminderData);
  return response;
};

/*
 * updateReminder — Updates an existing reminder's settings or schedule.
 * @param {string|number} reminderId   - The ID of the reminder to update.
 * @param {object}        reminderData - The updated reminder fields.
 * @returns {Promise<object>} The updated reminder record.
 */
export const updateReminder = async (reminderId, reminderData) => {
  const response = await api.put(`/reminders/${reminderId}/`, reminderData);
  return response;
};

/*
 * deleteReminder — Permanently removes a reminder from the system.
 * @param {string|number} reminderId - The ID of the reminder to delete.
 * @returns {Promise<object>} Server confirmation of the deletion.
 */
export const deleteReminder = async (reminderId) => {
  const response = await api.delete(`/reminders/${reminderId}/`);
  return response;
};

/*
 * sendManualReminder — Immediately dispatches a reminder outside of its normal schedule.
 * Useful for staff who want to send an ad-hoc notification to a patient right now.
 * @param {string|number} reminderId - The ID of the reminder to send immediately.
 * @returns {Promise<object>} Server confirmation that the reminder was dispatched.
 */
export const sendManualReminder = async (reminderId) => {
  const response = await api.post(`/reminders/${reminderId}/send/`);
  return response;
};
