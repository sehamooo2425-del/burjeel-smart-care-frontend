/*
 * AttendancePage.jsx
 * Admins and doctors use this page to record patient appointment attendance.
 *
 * Rules enforced in the UI (mirrored by the backend):
 *  - Only patients with a doctor_visit reminder on the selected date appear in the dropdown.
 *  - Doctors only see appointments where their name is the assigned doctor (display_name).
 *  - If a patient has multiple appointments on the same day, the staff member must pick one.
 *  - Each appointment (reminder) can only be marked once — duplicates are blocked.
 */

import { useState, useEffect, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
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
import * as reminderService from '../services/reminderService';

export default function AttendancePage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [patients, setPatients] = useState([]);
  // eligiblePatients: patients that have a qualifying doctor_visit reminder on the selected date.
  const [eligiblePatients, setEligiblePatients] = useState([]);
  // remindersByPatient: patient_id (string key) → array of reminder objects for the selected date.
  const [remindersByPatient, setRemindersByPatient] = useState({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { error: showError, success: showSuccess } = useContext(AlertContext);

  const [formData, setFormData] = useState({
    patient_id: '',
    reminder_id: '',            // which specific appointment is being marked
    status: 'present',
    appointment_date: new Date().toISOString().split('T')[0],
  });

  // Column definitions for the attendance log table.
  const columns = [
    { key: 'patient_id', label: 'Patient ID' },
    {
      key: 'patient_id',
      label: 'Patient Name',
      render: (id) => {
        const patient = patients.find(p => p.patient_id === id);
        return patient?.full_name || '—';
      }
    },
    {
      key: 'status',
      label: 'Status',
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
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      ),
    },
    { key: 'appointment_date', label: 'Date' },
    { key: 'timestamp', label: 'Time', render: (t) => t ? new Date(t).toLocaleTimeString() : '-' },
    {
      key: 'attendance_id',
      label: 'Action',
      // Only show the "Mark Late" button for absent records — lets staff update when a patient arrives late.
      render: (id, row) => (
        <div className="flex items-center gap-2">
          {(row.status === 'absent' || row.status === 'not came') && (
            <button
              onClick={() => handleMarkLate(id)}
              className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
            >
              Mark Late
            </button>
          )}
          <button
            onClick={() => handleDelete(id)}
            className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  // Loads attendance records and the patient list from the backend in parallel.
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

  useEffect(() => {
    fetchData();
  }, []);

  /*
   * Rebuild eligiblePatients and remindersByPatient whenever the selected date, the
   * patient list, or the logged-in user's identity changes.
   *
   * Doctor filter: doctors can only see and mark appointments where display_name matches
   * their own username. Admins see all doctor_visit reminders.
   */
  useEffect(() => {
    const buildEligible = async () => {
      if (!formData.appointment_date || patients.length === 0) {
        setEligiblePatients([]);
        setRemindersByPatient({});
        return;
      }
      try {
        const allReminders = await reminderService.getReminders();

        const onDate = allReminders.filter(r =>
          r.reminder_type === 'doctor_visit' &&
          r.scheduled_date &&
          // Extract the UTC date portion of the stored datetime to compare with the date input.
          new Date(r.scheduled_date).toISOString().split('T')[0] === formData.appointment_date &&
          // Doctors may only mark their own appointments.
          (user?.role !== 'doctor' || r.display_name === user?.username)
        );

        // Group by patient_id so we know how many appointments each patient has on this day.
        const byPatient = {};
        onDate.forEach(r => {
          if (!byPatient[r.patient_id]) byPatient[r.patient_id] = [];
          byPatient[r.patient_id].push(r);
        });

        const eligible = Object.keys(byPatient)
          .map(pid => patients.find(p => p.patient_id === parseInt(pid)))
          .filter(Boolean);

        setEligiblePatients(eligible);
        setRemindersByPatient(byPatient);
      } catch (err) {
        console.error('Failed to load eligible patients:', err);
        setEligiblePatients([]);
        setRemindersByPatient({});
      }
    };

    // Clear any stale selection from a previous date before fetching the new list.
    setFormData(prev => ({ ...prev, patient_id: '', reminder_id: '' }));
    buildEligible();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.appointment_date, patients, user?.role, user?.username]);

  /*
   * When the patient changes, auto-select the appointment if there is exactly one.
   * When there are multiple appointments for the same patient on the same day, leave
   * reminder_id blank so the user must pick explicitly.
   */
  useEffect(() => {
    if (!formData.patient_id) {
      setFormData(prev => ({ ...prev, reminder_id: '' }));
      return;
    }
    const patientReminders = remindersByPatient[formData.patient_id] || [];
    if (patientReminders.length === 1) {
      setFormData(prev => ({ ...prev, reminder_id: patientReminders[0].reminder_id }));
    } else {
      setFormData(prev => ({ ...prev, reminder_id: '' }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.patient_id, remindersByPatient]);

  // Permanently removes an attendance record after a quick confirmation prompt.
  const handleDelete = async (attendanceId) => {
    if (!window.confirm('Delete this attendance record?')) return;
    try {
      await attendanceService.deleteAttendance(attendanceId);
      showSuccess('Record deleted');
      fetchData();
    } catch (err) {
      showError(err.detail || err.message || 'Failed to delete record');
    }
  };

  // Changes an absent record to "late" when the patient eventually arrives.
  const handleMarkLate = async (attendanceId) => {
    try {
      await attendanceService.updateAttendance(attendanceId, { status: 'late' });
      showSuccess('Status updated to Late');
      fetchData();
    } catch (err) {
      showError(err.detail || err.message || 'Failed to update status');
    }
  };

  // Keeps formData in sync as the user changes any dropdown or date field.
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Saves the attendance record after validating the local rules.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient_id) { showError('Please select a patient'); return; }
    if (!formData.reminder_id) { showError('Please select an appointment'); return; }
    setSubmitting(true);
    try {
      await attendanceService.createAttendance({
        ...formData,
        patient_id:  parseInt(formData.patient_id),
        reminder_id: parseInt(formData.reminder_id),
      });
      showSuccess('Attendance marked successfully');
      setIsModalOpen(false);
      setFormData({
        patient_id: '',
        reminder_id: '',
        status: 'present',
        appointment_date: new Date().toISOString().split('T')[0],
      });
      fetchData();
    } catch (err) {
      // FastAPI errors arrive as { detail: "..." } — surface the actual reason to the user.
      showError(err.detail || err.message || 'Failed to mark attendance');
    } finally {
      setSubmitting(false);
    }
  };

  // Set of reminder_ids that already have an attendance record — used to block double-marking.
  const markedReminderIds = new Set(attendanceData.map(a => a.reminder_id).filter(Boolean));

  // Sort newest (most recently marked timestamp) to the top.
  const filteredData = attendanceData
    .filter(item => item.patient_id.toString().includes(searchTerm))
    .sort((a, b) => new Date(b.timestamp || b.appointment_date) - new Date(a.timestamp || a.appointment_date));

  const presentCount   = filteredData.filter(a => a.status === 'present' || a.status === 'came').length;
  const absentCount    = filteredData.filter(a => a.status === 'absent'  || a.status === 'not came').length;
  const lateCount      = filteredData.filter(a => a.status === 'late').length;
  const totalCount     = filteredData.length;
  const attendanceRate = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : 0;

  // Reminders for the currently selected patient on the selected date.
  const selectedPatientReminders = remindersByPatient[formData.patient_id] || [];
  const selectedReminderAlreadyMarked = !!formData.reminder_id && markedReminderIds.has(parseInt(formData.reminder_id));
  // Save is only enabled when a patient AND a valid (not already marked) appointment is chosen.
  const canSubmit = eligiblePatients.length > 0 && !!formData.reminder_id && !selectedReminderAlreadyMarked;

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
          { label: 'Present',         value: presentCount,        color: 'bg-green-100 text-green-800' },
          { label: 'Absent',          value: absentCount,         color: 'bg-red-100 text-red-800' },
          { label: 'Late',            value: lateCount,           color: 'bg-yellow-100 text-yellow-800' },
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
            <Button variant="secondary" icon={FiDownload} className="flex-1 sm:flex-none">Export</Button>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold text-secondary-900 mb-6">Attendance Log</h2>
        <Table columns={columns} data={filteredData} hover striped />
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Mark Patient Attendance">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Date comes first — selecting it triggers the eligible-patient lookup. */}
          <Input
            label="Appointment Date"
            type="date"
            name="appointment_date"
            value={formData.appointment_date}
            onChange={handleInputChange}
            required
          />

          {/* Only patients with a qualifying doctor_visit reminder on this date appear here. */}
          <Select
            label="Select Patient"
            name="patient_id"
            value={formData.patient_id}
            onChange={handleInputChange}
            options={
              eligiblePatients.length > 0
                ? [
                    { value: '', label: 'Choose a patient...' },
                    ...eligiblePatients.map(p => ({
                      value: p.patient_id,
                      label: `${p.full_name} (ID: ${p.patient_id})`
                    }))
                  ]
                : [{ value: '', label: 'No doctor visits scheduled on this date' }]
            }
            required
          />

          {/*
           * Appointment confirmation / picker — only shown once a patient is selected.
           *
           * One appointment → info card (auto-selected, shows doctor + time).
           * Multiple appointments → dropdown so the staff member picks which one to mark.
           */}
          {formData.patient_id && selectedPatientReminders.length === 1 && (() => {
            const r = selectedPatientReminders[0];
            const already = markedReminderIds.has(r.reminder_id);
            return (
              <div className={`p-3 rounded-lg border text-sm ${already ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                <p>
                  <strong>Appointment:</strong> Dr. {r.display_name} at{' '}
                  {new Date(r.scheduled_date).toLocaleString('en-US', { timeZone: 'Asia/Muscat', hour12: true })}
                </p>
                {already && (
                  <p className="mt-1 text-xs font-semibold">Attendance already marked for this appointment.</p>
                )}
              </div>
            );
          })()}

          {formData.patient_id && selectedPatientReminders.length > 1 && (
            <Select
              label="Select Appointment"
              name="reminder_id"
              value={formData.reminder_id}
              onChange={handleInputChange}
              options={[
                { value: '', label: 'Choose an appointment...' },
                ...selectedPatientReminders.map(r => ({
                  value: r.reminder_id,
                  label: `Dr. ${r.display_name} at ${new Date(r.scheduled_date).toLocaleString('en-US', { timeZone: 'Asia/Muscat', hour12: true })}${markedReminderIds.has(r.reminder_id) ? ' (already marked)' : ''}`
                }))
              ]}
              required
            />
          )}

          {/* Warn immediately if the chosen appointment was already marked. */}
          {selectedReminderAlreadyMarked && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              Attendance has already been marked for this appointment.
            </p>
          )}

          <Select
            label="Attendance Status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            options={[
              { value: 'present', label: 'Present' },
              { value: 'absent',  label: 'Absent' },
              { value: 'late',    label: 'Late' },
            ]}
            required
          />

          {/* Explain why the Save button is disabled when no reminders exist for this date. */}
          {eligiblePatients.length === 0 && formData.appointment_date && (
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              No doctor visit reminder exists for this date. Create a reminder first, then mark attendance.
            </p>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting} disabled={!canSubmit}>
              Save Attendance
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
