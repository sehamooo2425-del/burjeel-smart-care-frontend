/*
 * patientService.js — CRUD functions for managing patient records via the API.
 *
 * "CRUD" stands for Create, Read, Update, Delete — the four basic operations any
 * data resource needs. This file provides one function per operation so components
 * never have to build URLs or call `api` directly for patient data.
 */

import api from './api';

/*
 * getPatients — Fetches a list of patients, optionally filtered by name.
 * @param {string} name - Optional name string to search for; omit to fetch all patients.
 * @returns {Promise<Array>} List of patient objects from the server.
 */
export const getPatients = async (name) => {
  const params = {};
  // Only add the name filter when one is provided; otherwise the server returns all patients.
  if (name) params.name = name;
  const response = await api.get('/patients/', { params });
  return response;
};

/*
 * getPatientById — Retrieves a single patient's full record by their unique ID.
 * @param {string|number} patientId - The patient's ID in the database.
 * @returns {Promise<object>} The patient object.
 */
export const getPatientById = async (patientId) => {
  const response = await api.get(`/patients/${patientId}/`);
  return response;
};

/*
 * createPatient — Submits a new patient record to the server.
 * @param {object} patientData - The patient's details (name, DOB, MRN, etc.).
 * @returns {Promise<object>} The newly created patient record returned by the server.
 */
export const createPatient = async (patientData) => {
  const response = await api.post('/patients/', patientData);
  return response;
};

/*
 * updatePatient — Replaces an existing patient's data with new values (full update via PUT).
 * @param {string|number} patientId   - The ID of the patient to update.
 * @param {object}        patientData - The complete updated patient object.
 * @returns {Promise<object>} The updated patient record.
 */
export const updatePatient = async (patientId, patientData) => {
  const response = await api.put(`/patients/${patientId}`, patientData);
  return response;
};

/*
 * deletePatient — Permanently removes a patient record from the server.
 * @param {string|number} patientId - The ID of the patient to delete.
 * @returns {Promise<object>} Server confirmation of the deletion.
 */
export const deletePatient = async (patientId) => {
  const response = await api.delete(`/patients/${patientId}`);
  return response;
};
