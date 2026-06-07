/*
 * DoctorDashboard.jsx
 * This is the main home screen for users with the "doctor" role.
 * It shows the doctor a personalised overview: total patients, upcoming appointments
 * (doctor_visit reminders from today onwards), and a table of those appointments.
 */

import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiCalendar, FiClock } from 'react-icons/fi';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Table from '../components/common/Table';
import Loader from '../components/common/Loader';
import ExportMenu from '../components/common/ExportMenu';
import { useReportExport } from '../hooks/useReportExport';
import { AlertContext } from '../contexts/AlertContext';
import * as patientService from '../services/patientService';
import * as reminderService from '../services/reminderService';
import { useAuth } from '../hooks/useAuth';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  // user contains the currently logged-in doctor's info (username, role, etc.).
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  // stats holds the three summary numbers shown in the stat cards at the top.
  const [stats, setStats] = useState({
    totalPatients: 0,
    upcomingAppointments: 0,
    myReminders: 0,
  });
  // recentAppointments is the processed list rendered in the table below.
  const [recentAppointments, setRecentAppointments] = useState([]);
  const { error } = useContext(AlertContext);
  const { exportData, isExporting } = useReportExport();

  /*
   * Runs once on mount. Fetches patients and reminders simultaneously,
   * then filters reminders to only those of type 'doctor_visit' scheduled today or later.
   */
  useEffect(() => {
    const fetchData = async (showLoader = true) => {
      if (showLoader) setLoading(true);
      try {
        const [patients, reminders] = await Promise.all([
          patientService.getPatients(),
          reminderService.getReminders(),
        ]);

        const today = new Date().toISOString().split('T')[0];
        // Only doctor_visit reminders assigned to this doctor.
        const myVisits = reminders.filter(r =>
          r.reminder_type === 'doctor_visit' && r.display_name === user?.username
        );
        const myUpcoming = myVisits.filter(r => r.scheduled_date && r.scheduled_date >= today);

        setStats({
          totalPatients: patients.length,
          upcomingAppointments: myUpcoming.length,
          myReminders: myVisits.length,
        });

        setRecentAppointments(
          myUpcoming
            .slice()
            .sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date))
            .slice(0, 10)
            .map(r => {
            const patient = patients.find(p => p.patient_id === r.patient_id);
            return {
              id: r.reminder_id,
              patientName: patient?.full_name || `Patient ${r.patient_id}`,
              status: r.success_sent > 0 ? 'Notified' : 'Pending',
              time: new Date(r.scheduled_date).toLocaleString('en-US', { timeZone: 'Asia/Muscat', hour12: true }),
            };
          })
        );
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        error('Failed to load dashboard data');
      } finally {
        if (showLoader) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(() => fetchData(false), 60000);
    return () => clearInterval(interval);
  }, [error, user?.username]);

  // Column definitions for the appointments table.
  const columns = [
    { key: 'patientName', label: 'Patient Name' },
    { key: 'time', label: 'Time' },
    {
      key: 'status',
      label: 'Status',
      // Render a coloured pill badge: green for Notified, yellow for Pending.
      render: (status) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            status === 'Notified'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {status}
        </span>
      ),
    },
  ];

  // Downloads the appointments table as a file in the chosen format (CSV or PDF).
  const handleExport = (format) => {
    exportData({
      data: recentAppointments,
      columns: [
        { key: 'patientName', label: 'Patient Name' },
        { key: 'status', label: 'Status' },
        { key: 'time', label: 'Time' },
      ],
      filename: `DoctorDashboard_Appointments_${new Date().toISOString().split('T')[0]}`,
      format
    });
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-secondary-900 mb-2">Doctor Dashboard</h1>
        <p className="text-secondary-600">Welcome, Dr. {user?.username}! Here is your overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: FiUsers, label: 'Total Patients', value: stats.totalPatients, color: 'primary' },
          { icon: FiCalendar, label: 'Upcoming Appointments', value: stats.upcomingAppointments, color: 'info' },
          { icon: FiClock, label: 'Active Reminders', value: stats.myReminders, color: 'warning' },
        ].map((stat, idx) => (
          <Card key={idx} className="hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-secondary-500 text-sm font-medium mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-secondary-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                <stat.icon className={`text-${stat.color}-600`} size={24} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-secondary-900">Upcoming Appointments</h2>
            <p className="text-secondary-500 text-sm">Your scheduled patient visits</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto [&>div]:w-full sm:[&>div]:w-auto">
            <ExportMenu onExport={handleExport} isExporting={isExporting} />
            <Button variant="outline" onClick={() => navigate('/admin/reminders')} className="flex-1 sm:flex-none">View All</Button>
          </div>
        </div>
        <Table columns={columns} data={recentAppointments} hover striped />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="text-center">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Patient Management</h3>
          <Button variant="primary" fullWidth onClick={() => navigate('/admin/patients')}>
            View Patients
          </Button>
        </Card>
        <Card className="text-center">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Messages</h3>
          <Button variant="secondary" fullWidth onClick={() => navigate('/admin/chat')}>
            Open Chat
          </Button>
        </Card>
      </div>
    </div>
  );
}
