/*
 * reportsService.js — API functions for fetching aggregated report data.
 *
 * Unlike the individual service files (attendance, reminders), this service calls
 * dedicated report endpoints that return pre-aggregated summaries intended for
 * display in charts and exportable tables on the Reports page.
 */

import api from './api';

/*
 * getAttendanceReport — Fetches a summarised attendance report for the given date range.
 * Both parameters are optional; omitting them returns the full historical report.
 * @param {string} fromDate - ISO date string for the start of the report period.
 * @param {string} toDate   - ISO date string for the end of the report period.
 * @returns {Promise<object>} Aggregated attendance statistics from the server.
 */
export const getAttendanceReport = async (fromDate, toDate) => {
  const params = {};
  // Only include date bounds that were actually provided by the caller.
  if (fromDate) params.from_date = fromDate;
  if (toDate) params.to_date = toDate;
  const response = await api.get('/reports/attendance/', { params });
  return response;
};

/*
 * getRemindersReport — Fetches a summary report of all reminders and their delivery statuses.
 * @returns {Promise<object>} Aggregated reminder statistics (sent, failed, pending counts, etc.).
 */
export const getRemindersReport = async () => {
  const response = await api.get('/reports/reminders/');
  return response;
};
