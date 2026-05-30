/*
 * PatientsPage.jsx
 * This page is visible to admins and doctors. It shows the full patient directory
 * as a grid of cards. Staff can add new patients, edit existing ones, delete them,
 * and reset their login passwords. A search box filters the list in real time.
 */

import { useState, useEffect, useContext } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Table from '../components/common/Table';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';
import { FiSearch, FiPlus, FiUser, FiMail, FiLock, FiPhone, FiFileText, FiCalendar, FiEdit2, FiTrash2 } from 'react-icons/fi';
import ExportMenu from '../components/common/ExportMenu';
import { useReportExport } from '../hooks/useReportExport';
import { AlertContext } from '../contexts/AlertContext';
import * as patientService from '../services/patientService';
import * as userService from '../services/userService';

export default function PatientsPage() {
  // searchTerm is what the user has typed in the search box.
  const [searchTerm, setSearchTerm] = useState('');
  // patients is the full unfiltered list fetched from the API.
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  // isModalOpen controls whether the Add/Edit patient form modal is visible.
  const [isModalOpen, setIsModalOpen] = useState(false);
  // isEditModalOpen tells us whether the open modal is in edit mode (vs. create mode).
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // editingId / editingUserId remember which record is being edited.
  const [editingId, setEditingId] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  // submitting is true while the save request is in progress, preventing double-clicks.
  const [submitting, setSubmitting] = useState(false);

  // showPasswordModal and related state control the separate password-reset modal.
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordResetId, setPasswordResetId] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');

  const { error: showError, success: showSuccess } = useContext(AlertContext);
  const { exportData, isExporting } = useReportExport();

  // formData holds all field values for the Add/Edit patient form.
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone_number: '',
    medical_record_ref: '',
    registered_date: new Date().toISOString().split('T')[0],
    gender: ''
  });

  // Column definitions used when exporting data to a file.
  const columns = [
    { key: 'patient_id', label: 'ID' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'phone_number', label: 'Phone' },
    { key: 'medical_record_ref', label: 'MRN' },
    { key: 'registered_date', label: 'Registered' },
  ];

  // Loads the latest patient list from the backend and stores it in state.
  // Called on mount and after any create/edit/delete operation.
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await patientService.getPatients();
      setPatients(data);
    } catch (err) {
      console.error('Error fetching patients:', err);
      showError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  // Fetch patients once when the page first loads.
  useEffect(() => {
    fetchData();
  }, []);

  // Keeps formData in sync as the user types into any field in the modal form.
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handles saving the form — either creates a new patient or updates an existing one
  // depending on whether isEditModalOpen is true.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditModalOpen) {
        // When editing, we update via userService (which targets the auth user record).
        await userService.updateUser(editingUserId, {
          username: formData.username,
          email: formData.email,
          gender: formData.gender,
          full_name: formData.full_name,
          phone_number: formData.phone_number,
          medical_record_ref: formData.medical_record_ref,
          registered_date: formData.registered_date
        });
        showSuccess('Patient updated successfully');
      } else {
        // When creating, patientService handles both the user account and patient profile.
        await patientService.createPatient(formData);
        showSuccess('Patient added successfully');
      }
      setIsModalOpen(false);
      setIsEditModalOpen(false);
      // Reset the form back to empty defaults after a successful save.
      setFormData({
        username: '',
        email: '',
        password: '',
        full_name: '',
        phone_number: '',
        medical_record_ref: '',
        registered_date: new Date().toISOString().split('T')[0],
        gender: ''
      });
      fetchData();
    } catch (err) {
      showError(err.message || 'Failed to save patient');
    } finally {
      setSubmitting(false);
    }
  };

  // Submits the new password for the selected patient's login account.
  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    try {
      await userService.resetPassword(passwordResetId, resetPasswordValue);
      showSuccess('Password reset successfully!');
      setShowPasswordModal(false);
      setResetPasswordValue('');
    } catch (err) {
      showError(`Failed to reset password: ${err.response?.data?.detail || err.message}`);
    }
  };

  // Pre-fills the modal form with the clicked patient's current data and opens the edit modal.
  const handleEditClick = (patient) => {
    setFormData({
      username: patient.username || '',
      email: patient.email || '',
      password: '', // Never populate password — the admin must set a new one explicitly.
      gender: patient.gender || '',
      full_name: patient.full_name || '',
      phone_number: patient.phone_number || '',
      medical_record_ref: patient.medical_record_ref || '',
      // Strip the time portion (T...) from the ISO timestamp to get just the date string.
      registered_date: patient.registered_date ? patient.registered_date.split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setEditingId(patient.patient_id);
    setEditingUserId(patient.user_id);
    setIsEditModalOpen(true);
    setIsModalOpen(true);
  };

  // Asks the user to confirm, then deletes the patient record permanently.
  const handleDeleteClick = async (id) => {
    // window.confirm shows a browser confirmation dialog before proceeding.
    if (window.confirm("Are you sure you want to delete this patient?")) {
      try {
        await patientService.deletePatient(id);
        showSuccess('Patient deleted successfully');
        fetchData();
      } catch (err) {
        showError('Failed to delete patient');
      }
    }
  };

  // Filters the patient list in real time based on the search box contents.
  // Matches against patient name, numeric ID, or medical record number (MRN).
  const filteredPatients = patients.filter((p) =>
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patient_id.toString().includes(searchTerm) ||
    p.medical_record_ref?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Exports the currently filtered list (not the full list) to a downloadable file.
  const handleExport = (format) => {
    exportData({
      data: filteredPatients,
      columns,
      filename: `Patients_Directory_${new Date().toISOString().split('T')[0]}`,
      format
    });
  };

  if (loading && patients.length === 0) return <div className="flex items-center justify-center h-full">Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-secondary-900 mb-2">Patient Management</h1>
          <p className="text-secondary-600">View and manage hospital patients</p>
        </div>
        <Button variant="primary" icon={FiPlus} onClick={() => {
          setEditingId(null);
          setEditingUserId(null);
          setIsEditModalOpen(false);
          setFormData({
            username: '', email: '', password: '', full_name: '', phone_number: '', medical_record_ref: '', registered_date: new Date().toISOString().split('T')[0], gender: ''
          });
          setIsModalOpen(true);
        }} className="w-full sm:w-auto">
          Add Patient
        </Button>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search by name, ID or MRN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={FiSearch}
            className="flex-1 w-full"
          />
          <div className="self-end pb-1 w-full sm:w-auto [&>div]:w-full [&_button]:w-full">
            <ExportMenu onExport={handleExport} isExporting={isExporting} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map((patient) => {
          // If the patient has no uploaded photo, generate an avatar using the ui-avatars service.
          // Pink colours are used for female patients and blue for everyone else.
          let avatarUrl = patient.profile_picture_url;
          if (!avatarUrl) {
            if (patient.gender === 'female') {
              avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(patient.full_name) + '&background=f9a8d4&color=831843';
            } else {
              avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(patient.full_name) + '&background=bfdbfe&color=1e3a8a';
            }
          }

          return (
            <Card key={patient.patient_id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                {/* Profile picture — generated from the patient's name if no photo is uploaded. */}
                <img
                  src={avatarUrl}
                  alt={patient.full_name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-secondary-200"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-secondary-900 truncate">{patient.full_name}</h3>
                  <p className="text-sm text-secondary-500 font-medium mb-2">MRN: {patient.medical_record_ref || 'N/A'}</p>
                  
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-secondary-600">
                      <FiPhone className="w-4 h-4 mr-2" />
                      {patient.phone_number}
                    </div>
                    <div className="flex items-center text-sm text-secondary-600">
                      <FiCalendar className="w-4 h-4 mr-2" />
                      {patient.registered_date ? new Date(patient.registered_date).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-2">
                <Button variant="outline" size="sm" icon={FiEdit2} onClick={() => handleEditClick(patient)}>Edit</Button>
                <Button variant="outline" size="sm" onClick={() => { setPasswordResetId(patient.user_id); setShowPasswordModal(true); setResetPasswordValue(''); }}>Password</Button>
                <Button variant="danger" size="sm" icon={FiTrash2} onClick={() => handleDeleteClick(patient.patient_id)}>Delete</Button>
              </div>
            </Card>
          );
        })}
        {filteredPatients.length === 0 && (
          <div className="col-span-full py-12 text-center text-secondary-500">
            No patients found matching your search.
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditModalOpen ? "Edit Patient" : "Add New Patient"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              icon={FiUser}
              required
            />
            <Input
              label="Phone Number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              icon={FiPhone}
              required
            />
            
            <Input
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              icon={FiUser}
              required
            />
            <Input
              label="Email (optional)"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              icon={FiMail}
            />
            {/* Password field is only shown when creating a new patient, not when editing. */}
            {!isEditModalOpen && (
              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                icon={FiLock}
                required
              />
            )}

            <Input
              label="Medical Record Ref (MRN)"
              name="medical_record_ref"
              value={formData.medical_record_ref}
              onChange={handleInputChange}
              icon={FiFileText}
            />
            <Input
              label="Registration Date"
              type="date"
              name="registered_date"
              value={formData.registered_date}
              onChange={handleInputChange}
              icon={FiCalendar}
              required
            />
            <Select
              label="Gender"
              name="gender"
              value={formData.gender || ''}
              onChange={handleInputChange}
              options={[
                { value: '', label: 'Select Gender' },
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setIsEditModalOpen(false); }}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {isEditModalOpen ? "Update Patient" : "Create Patient"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Reset Password" size="md">
        <form onSubmit={handlePasswordResetSubmit}>
          <div className="space-y-4">
            <Input 
              label="New Password" 
              type="password" 
              value={resetPasswordValue} 
              onChange={(e) => setResetPasswordValue(e.target.value)} 
              required 
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setShowPasswordModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Reset Password</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
