/*
 * attendanceService.js — API functions for recording and querying patient attendance.
 *
 * Attendance tracks whether a patient showed up for a scheduled visit (present, absent,
 * late, or excused). This service lets components fetch, create, and update those records
 * without embedding API logic in the UI layer.
 */

import api from './api';

/*
 * getAttendances — Fetches attendance records with optional filters.
 * All parameters are optional; omitting them returns all attendance records.
 * @param {string|number} patientId - Filter records for a specific patient.
 * @param {string}        fromDate  - ISO date string for the start of the range.
 * @param {string}        toDate    - ISO date string for the end of the range.
 * @returns {Promise<Array>} List of attendance records matching the filters.
 */
export const getAttendances = async (patientId, fromDate, toDate) => {
  const params = {};
  // Build query params dynamically; only include filters that were actually supplied.
  if (patientId) params.patient_id = patientId;
  if (fromDate) params.from_date = fromDate;
  if (toDate) params.to_date = toDate;
  const response = await api.get('/attendance/', { params });
  return response;
};

/*
 * getAttendanceById — Retrieves a single attendance record by its unique ID.
 * @param {string|number} attendanceId - The attendance record's database ID.
 * @returns {Promise<object>} The attendance record object.
 */
export const getAttendanceById = async (attendanceId) => {
  const response = await api.get(`/attendance/${attendanceId}/`);
  return response;
};

/*
 * createAttendance — Logs a new attendance entry for a patient visit.
 * @param {object} attendanceData - Details such as patient ID, date, and status.
 * @returns {Promise<object>} The newly created attendance record.
 */
export const createAttendance = async (attendanceData) => {
  const response = await api.post('/attendance/', attendanceData);
  return response;
};

/*
 * deleteAttendance — Permanently removes an attendance record by its ID.
 * @param {string|number} attendanceId - The ID of the record to delete.
 * @returns {Promise<void>}
 */
export const deleteAttendance = async (attendanceId) => {
  await api.delete(`/attendance/${attendanceId}/`);
};

/*
 * updateAttendance — Modifies an existing attendance record (e.g. correcting a status).
 * @param {string|number} attendanceId   - The ID of the record to update.
 * @param {object}        attendanceData - The updated attendance fields.
 * @returns {Promise<object>} The updated attendance record.
 */
export const updateAttendance = async (attendanceId, attendanceData) => {
  const response = await api.put(`/attendance/${attendanceId}/`, attendanceData);
  return response;
};
