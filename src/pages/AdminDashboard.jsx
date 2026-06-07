/*
 * AdminDashboard.jsx
 * This is the main home screen for users with the "admin" role.
 * It shows a high-level summary of the hospital: total patients, reminders sent today,
 * the attendance rate, and a table of the most recent SMS reminders.
 */

import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiBell, FiCheckCircle, FiTrendingUp } from 'react-icons/fi';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Table from '../components/common/Table';
import Loader from '../components/common/Loader';
import ExportMenu from '../components/common/ExportMenu';
import { useReportExport } from '../hooks/useReportExport';
import { AlertContext } from '../contexts/AlertContext';
import * as patientService from '../services/patientService';
import * as reminderService from '../services/reminderService';
import * as reportsService from '../services/reportsService';

export default function AdminDashboard() {
  const navigate = useNavigate();
  // loading controls whether the spinner is shown while data is being fetched.
  const [loading, setLoading] = useState(true);
  // stats holds the four summary numbers shown in the top stat cards.
  const [stats, setStats] = useState({
    totalPatients: 0,
    remindersToday: 0,
    attendanceRate: 0,
    appointments: 0,
  });
  // recentReminders holds the processed list shown in the reminder table.
  const [recentReminders, setRecentReminders] = useState([]);
  const { error } = useContext(AlertContext);
  const { exportData, isExporting } = useReportExport();

  /*
   * This effect runs once when the component first mounts (the empty-ish [error] dependency
   * means it re-runs only if the error function reference changes, which is practically never).
   * It fetches patients, reminders, and the attendance report in parallel using Promise.all
   * (all three requests start at the same time to avoid waiting for each one in sequence).
   */
  useEffect(() => {
    const fetchData = async (showLoader = true) => {
      if (showLoader) setLoading(true);
      try {
        const [patients, reminders, attendanceReport] = await Promise.all([
          patientService.getPatients(),
          reminderService.getReminders(),
          reportsService.getAttendanceReport(),
        ]);

        setStats({
          totalPatients: patients.length,
          remindersToday: reminders.filter(r => {
            const today = new Date().toISOString().split('T')[0];
            return r.scheduled_date && r.scheduled_date.startsWith(today);
          }).length,
          attendanceRate: attendanceReport?.attendance_rate || 0,
          appointments: attendanceReport?.total_attendances || 0,
        });

        setRecentReminders(
          reminders
            .slice()
            .sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date))
            .slice(0, 10)
            .map(r => {
            const patient = patients.find(p => p.patient_id === r.patient_id);
            return {
              id: r.reminder_id,
              patientName: patient?.full_name || `Patient ${r.patient_id}`,
              phone: patient?.phone_number || 'N/A',
              success: r.success_sent || 0,
              failed: r.failed_sent || 0,
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
  }, [error]);

  // Column definitions for the reminders table — each object maps a data key to a column header.
  const columns = [
    { key: 'patientName', label: 'Patient Name' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'status',
      label: 'Status',
      // Custom render function: shows green "S" (success) and red "F" (failed) badges.
      render: (val, row) => (
        <span className="text-xs font-semibold">
          <span className="text-green-600 bg-green-100 px-2 py-1 rounded mr-1">S: {row.success}</span>
          <span className="text-red-600 bg-red-100 px-2 py-1 rounded">F: {row.failed}</span>
        </span>
      ),
    },
    { key: 'time', label: 'Time' },
  ];

  // Triggers a file download (CSV or PDF) of the current reminder table data.
  const handleExport = (format) => {
    exportData({
      data: recentReminders,
      columns: [
        { key: 'patientName', label: 'Patient Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'success', label: 'Success Sent' },
        { key: 'failed', label: 'Failed Sent' },
        { key: 'time', label: 'Time' },
      ],
      filename: `AdminDashboard_Reminders_${new Date().toISOString().split('T')[0]}`,
      format
    });
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-secondary-900 mb-2">Dashboard</h1>
        <p className="text-secondary-600">Welcome back! Here's what's happening with your hospital.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: FiUsers, label: 'Total Patients', value: stats.totalPatients, color: 'primary' },
          { icon: FiBell, label: 'Reminders Today', value: stats.remindersToday, color: 'warning' },
          { icon: FiCheckCircle, label: 'Attendance Rate', value: `${stats.attendanceRate}%`, color: 'success' },
          { icon: FiTrendingUp, label: 'Appointments', value: stats.appointments, color: 'info' },
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
            <h2 className="text-2xl font-bold text-secondary-900">Recent Reminders</h2>
            <p className="text-secondary-500 text-sm">Latest SMS reminders sent to patients</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto [&>div]:w-full sm:[&>div]:w-auto">
            <ExportMenu onExport={handleExport} isExporting={isExporting} />
            <Button variant="outline" onClick={() => navigate('/admin/reminders')} className="flex-1 sm:flex-none">View All</Button>
          </div>
        </div>
        <Table columns={columns} data={recentReminders} hover striped />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Send Reminder</h3>
          <Button variant="primary" fullWidth onClick={() => navigate('/admin/reminders')}>
            Create Reminder
          </Button>
        </Card>
        <Card className="text-center">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">View Reports</h3>
          <Button variant="secondary" fullWidth onClick={() => navigate('/admin/reports')}>
            Generate Report
          </Button>
        </Card>
        <Card className="text-center">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Patient Management</h3>
          <Button variant="outline" fullWidth onClick={() => navigate('/admin/patients')}>
            Manage Patients
          </Button>
        </Card>
      </div>
    </div>
  );
}
