/*
 * AttendancePage.jsx
 * This page is used by admins and doctors to record and review patient attendance.
 * Staff can mark a patient as present, absent, or late for a given date via a modal form.
 * Summary stat cards at the top show the overall attendance rate.
 */

import { useState, useEffect, useContext } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Table from '../components/common/Table';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';
import { FiSearch, FiDownload, FiPlus } from 'react-icons/fi';
import { AlertContext } from '../contexts/AlertContext';
import * as attendanceService from '../services/attendanceService';
import * as patientService from '../services/patientService';

export default function AttendancePage() {
  // searchTerm filters the attendance log table by patient ID.
  const [searchTerm, setSearchTerm] = useState('');
  // attendanceData is the full attendance log returned from the backend.
  const [attendanceData, setAttendanceData] = useState([]);
  // patients is needed to populate the "Select Patient" dropdown in the form.
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  // isModalOpen controls whether the "Mark Attendance" form dialog is visible.
  const [isModalOpen, setIsModalOpen] = useState(false);
  // submitting is true while the form is being saved, preventing double submissions.
  const [submitting, setSubmitting] = useState(false);
  const { error: showError, success: showSuccess } = useContext(AlertContext);

  // formData holds the values in the Mark Attendance modal form.
  const [formData, setFormData] = useState({
    patient_id: '',
    status: 'present', // Default status when opening the form.
    appointment_date: new Date().toISOString().split('T')[0], // Default to today's date.
  });

  // Column definitions for the attendance log table.
  const columns = [
    { key: 'patient_id', label: 'Patient ID' },
    {
      key: 'status',
      label: 'Status',
      // Render a colour-coded pill: green for present/came, yellow for late, red for absent.
      render: (status) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            status === 'present' || status === 'came'
              ? 'bg-green-100 text-green-800'
              : status === 'late'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {/* Capitalise the first letter of the status for display (e.g. "present" → "Present"). */}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      ),
    },
    { key: 'appointment_date', label: 'Date' },
    { key: 'timestamp', label: 'Time', render: (t) => t ? new Date(t).toLocaleTimeString() : '-' },
  ];

  // Loads the attendance log and patient list from the backend in parallel.
  const fetchData = async () => {
    setLoading(true);
    try {
      const [attendances, patientsData] = await Promise.all([
        attendanceService.getAttendances(),
        patientService.getPatients(),
      ]);
      setAttendanceData(attendances);
      setPatients(patientsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      showError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance records when the page first loads.
  useEffect(() => {
    fetchData();
  }, []);

  // Keeps formData in sync as the user changes any dropdown or date field.
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Saves the new attendance record. Validates that a patient has been selected first.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient_id) {
      showError('Please select a patient');
      return;
    }
    setSubmitting(true);
    try {
      await attendanceService.createAttendance({
        ...formData,
        // patient_id comes from a <select> as a string; parseInt converts it to a number.
        patient_id: parseInt(formData.patient_id)
      });
      showSuccess('Attendance marked successfully');
      setIsModalOpen(false);
      // Reset form to defaults so the modal is clean next time it opens.
      setFormData({
        patient_id: '',
        status: 'present',
        appointment_date: new Date().toISOString().split('T')[0],
      });
      fetchData();
    } catch (err) {
      showError(err.message || 'Failed to mark attendance');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter the attendance log by patient ID based on the search box input.
  const filteredData = attendanceData.filter((item) =>
    item.patient_id.toString().includes(searchTerm)
  );

  // Calculate summary statistics from the filtered data for the stat cards.
  // Both "present" and "came" mean the patient showed up (backend may use either value).
  const presentCount = filteredData.filter(a => a.status === 'present' || a.status === 'came').length;
  const absentCount = filteredData.filter(a => a.status === 'absent' || a.status === 'not came').length;
  const lateCount = filteredData.filter(a => a.status === 'late').length;
  const totalCount = filteredData.length;
  // Attendance rate = present / total, shown as a percentage with one decimal place.
  const attendanceRate = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : 0;

  if (loading && attendanceData.length === 0) return <div className="flex items-center justify-center h-full">Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-secondary-900 mb-2">Attendance Tracking</h1>
          <p className="text-secondary-600">Monitor patient attendance and check-in times</p>
        </div>
        <Button variant="primary" icon={FiPlus} onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
          Mark Attendance
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Present', value: presentCount, color: 'bg-green-100 text-green-800' },
          { label: 'Absent', value: absentCount, color: 'bg-red-100 text-red-800' },
          { label: 'Late', value: lateCount, color: 'bg-yellow-100 text-yellow-800' },
          { label: 'Attendance Rate', value: `${attendanceRate}%`, color: 'bg-blue-100 text-blue-800' },
        ].map((stat, idx) => (
          <Card key={idx}>
            <p className="text-secondary-500 text-sm font-medium mb-1">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color.split(' ')[0]} px-4 py-2 rounded inline-block`}>
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-4 flex-wrap items-stretch sm:items-end">
          <Input
            placeholder="Search patient ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={FiSearch}
            className="flex-1 w-full sm:min-w-64"
          />
          <div className="flex gap-4 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none">Filter</Button>
            <Button variant="secondary" icon={FiDownload} className="flex-1 sm:flex-none">
              Export
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold text-secondary-900 mb-6">Attendance Log</h2>
        <Table columns={columns} data={filteredData} hover striped />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Mark Patient Attendance"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Select Patient"
            name="patient_id"
            value={formData.patient_id}
            onChange={handleInputChange}
            options={[
              { value: '', label: 'Choose a patient...' },
              ...patients.map(p => ({ value: p.patient_id, label: `${p.full_name} (ID: ${p.patient_id})` }))
            ]}
            required
          />
          <Select
            label="Attendance Status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            options={[
              { value: 'present', label: 'Present' },
              { value: 'absent', label: 'Absent' },
              { value: 'late', label: 'Late' },
            ]}
            required
          />
          <Input
            label="Appointment Date"
            type="date"
            name="appointment_date"
            value={formData.appointment_date}
            onChange={handleInputChange}
            required
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Save Attendance
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
