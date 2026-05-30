/*
 * DoctorManagementPage.jsx
 * This page is accessible only to admins. It displays all registered doctors as cards
 * and lets the admin add new doctors, edit their profile details, reset their password,
 * or remove them from the system entirely.
 */

import { useState, useEffect, useContext } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import { AlertContext } from '../contexts/AlertContext';
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';
import * as userService from '../services/userService';

export default function DoctorManagementPage() {
  // doctors holds the list of all users whose role is "doctor".
  const [doctors, setDoctors] = useState([]);
  // showModal controls whether the Add/Edit doctor form is visible.
  const [showModal, setShowModal] = useState(false);
  // isEditMode is true when the modal is being used to edit an existing doctor.
  const [isEditMode, setIsEditMode] = useState(false);
  // editingId stores the user_id of the doctor currently being edited.
  const [editingId, setEditingId] = useState(null);

  // formData holds all the values for the Add/Edit doctor form fields.
  const [formData, setFormData] = useState({
    username: '', email: '', password: '',
    gender: '', specialty: '', license_number: '', department: ''
  });

  // showPasswordModal and related state control the separate password-reset modal.
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordResetId, setPasswordResetId] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');

  const { error: showError, success } = useContext(AlertContext);

  // Load the doctor list as soon as the page appears on screen.
  useEffect(() => {
    fetchDoctors();
  }, []);

  // Submits a new password for the selected doctor's account.
  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    try {
      await userService.resetPassword(passwordResetId, resetPasswordValue);
      success('Password reset successfully!');
      setShowPasswordModal(false);
      setResetPasswordValue('');
    } catch (err) {
      showError(`Failed to reset password: ${err.response?.data?.detail || err.message}`);
    }
  };

  // Fetches all users with the role of "doctor" from the backend.
  const fetchDoctors = async () => {
    try {
      const data = await userService.getUsersByRole('doctor');
      setDoctors(data || []);
    } catch (err) {
      showError('Failed to fetch doctors');
    }
  };

  // Handles the Add/Edit form submission. Creates a new doctor or updates an existing one
  // based on the isEditMode flag, then refreshes the doctor list.
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        // When editing, the password field is intentionally excluded — use the reset modal instead.
        await userService.updateUser(editingId, {
          username: formData.username,
          email: formData.email,
          gender: formData.gender,
          specialty: formData.specialty,
          license_number: formData.license_number,
          department: formData.department
        });
        success('Doctor updated successfully!');
      } else {
        // Spread operator merges formData with { role: 'doctor' } to create a complete user object.
        await userService.createUser({ ...formData, role: 'doctor' });
        success('Doctor added successfully!');
      }
      setShowModal(false);
      setIsEditMode(false);
      setFormData({ username: '', email: '', password: '', gender: '', specialty: '', license_number: '', department: '' });
      fetchDoctors();
    } catch (err) {
      showError(`Failed to ${isEditMode ? 'update' : 'add'} doctor: ${err.response?.data?.detail || err.message}`);
    }
  };

  // Pre-fills the modal form with the selected doctor's data and switches it to edit mode.
  const handleEdit = (doctor) => {
    setFormData({
      username: doctor.username || '',
      email: doctor.email || '',
      password: '', // Password is never pre-filled — admins must use the reset modal to change it.
      gender: doctor.gender || '',
      specialty: doctor.specialty || '',
      license_number: doctor.license_number || '',
      department: doctor.department || ''
    });
    setEditingId(doctor.user_id);
    setIsEditMode(true);
    setShowModal(true);
  };

  // Asks for confirmation, then permanently deletes the doctor's account.
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this doctor?")) {
      try {
        await userService.deleteUser(id);
        success("Doctor deleted successfully.");
        fetchDoctors();
      } catch (err) {
        showError("Failed to delete doctor.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Doctor Management</h1>
        <Button variant="primary" icon={FiPlus} onClick={() => {
          setIsEditMode(false);
          setEditingId(null);
          setFormData({ username: '', email: '', password: '', gender: '', specialty: '', license_number: '', department: '' });
          setShowModal(true);
        }} className="w-full sm:w-auto">Add Doctor</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doctor) => {
          // Use a gender-coloured generated avatar if the doctor has no profile photo uploaded.
          let avatarUrl = doctor.profile_picture_url;
          if (!avatarUrl) {
            if (doctor.gender === 'female') {
              avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(doctor.username) + '&background=f9a8d4&color=831843';
            } else {
              avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(doctor.username) + '&background=bfdbfe&color=1e3a8a';
            }
          }

          return (
            <Card key={doctor.user_id || doctor.username} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <img 
                  src={avatarUrl} 
                  alt={doctor.username} 
                  className="w-16 h-16 rounded-full object-cover border-2 border-secondary-200"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-secondary-900 truncate">{doctor.username}</h3>
                  <p className="text-sm text-secondary-500 font-medium mb-2">{doctor.email}</p>
                  
                  <div className="space-y-1 mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm text-secondary-700 font-medium truncate">
                      Specialty: <span className="font-normal">{doctor.specialty || 'N/A'}</span>
                    </p>
                    <p className="text-sm text-secondary-700 font-medium truncate">
                      Dept: <span className="font-normal">{doctor.department || 'N/A'}</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-2">
                <Button variant="outline" size="sm" icon={FiEdit2} onClick={() => handleEdit(doctor)}>Edit</Button>
                <Button variant="outline" size="sm" onClick={() => { setPasswordResetId(doctor.user_id); setShowPasswordModal(true); setResetPasswordValue(''); }}>Password</Button>
                <Button variant="danger" size="sm" icon={FiTrash2} onClick={() => handleDelete(doctor.user_id)}>Delete</Button>
              </div>
            </Card>
          );
        })}
        {doctors.length === 0 && (
          <div className="col-span-full py-12 text-center text-secondary-500">
            No doctors found.
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditMode ? "Edit Doctor" : "Add New Doctor"} size="lg">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Username" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} required />
            <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            
            {/* Password input is only shown when creating a new doctor, not while editing. */}
            {!isEditMode && (
              <Input label="Password" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
            )}
            
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-secondary-700 mb-1">Gender</label>
              <select
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            
            <Input label="Specialty" value={formData.specialty} onChange={(e) => setFormData({...formData, specialty: e.target.value})} />
            <Input label="License Number" value={formData.license_number} onChange={(e) => setFormData({...formData, license_number: e.target.value})} />
            <Input label="Department" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary">{isEditMode ? "Update Doctor" : "Save Doctor"}</Button>
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
