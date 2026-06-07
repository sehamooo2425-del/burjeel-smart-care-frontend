/*
 * PatientDashboard.jsx
 * This is the main home screen for users with the "patient" role.
 * It shows the patient their upcoming medication and doctor-visit reminders,
 * two pie charts summarising reminder types and completion status, and quick action buttons.
 */

import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import ExportMenu from '../components/common/ExportMenu';
import { useReportExport } from '../hooks/useReportExport';
import { FiCalendar, FiClock, FiUser, FiPhone, FiActivity, FiPieChart } from 'react-icons/fi';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { AlertContext } from '../contexts/AlertContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function PatientDashboard() {
  const { user } = useContext(AuthContext);
  const { error: showError } = useContext(AlertContext);
  const { exportData, isExporting } = useReportExport();
  const navigate = useNavigate();

  // patientData holds the patient's profile returned from /patients/me.
  const [patientData, setPatientData] = useState(null);
  // reminders is the full list of this patient's reminders (sorted chronologically).
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  // typeData and statusData feed the two pie charts on this page.
  const [typeData, setTypeData] = useState([]);
  const [statusData, setStatusData] = useState([]);

  // A fixed palette of colours used to colour pie chart slices.
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  /*
   * Runs once when the component first appears on screen.
   * Fetches the patient's own profile and their reminder list from the backend,
   * then pre-processes the data for the cards and charts.
   */
  useEffect(() => {
    const fetchDashboardData = async (showLoader = true) => {
      try {
        if (showLoader) setLoading(true);
        const profileRes = await api.get('/patients/me');
        setPatientData(profileRes);

        const remindersRes = await api.get('/reminders/');

        const formattedReminders = remindersRes
          .map(r => {
            const isDoctor = r.reminder_type === 'doctor_visit';
            return {
              id: r.reminder_id,
              title: isDoctor ? `Dr. ${r.display_name}` : r.display_name,
              type: isDoctor ? 'Doctor Visit' : 'Medication',
              date: new Date(r.scheduled_date).toLocaleDateString(),
              time: new Date(r.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: r.status,
              rawDate: new Date(r.scheduled_date),
              isDoctor
            };
          })
          .sort((a, b) => a.rawDate - b.rawDate);

        setReminders(formattedReminders);

        const medCount = formattedReminders.filter(r => !r.isDoctor).length;
        const docCount = formattedReminders.filter(r => r.isDoctor).length;
        setTypeData([
          { name: 'Medications', value: medCount },
          { name: 'Doctor Visits', value: docCount },
        ]);

        const completedCount = formattedReminders.filter(r => r.status === 'completed').length;
        const pendingCount = formattedReminders.filter(r => r.status !== 'completed').length;
        setStatusData([
          { name: 'Pending', value: pendingCount },
          { name: 'Completed', value: completedCount },
        ]);

      } catch (err) {
        showError('Failed to load dashboard data');
      } finally {
        if (showLoader) setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(false), 60000);
    return () => clearInterval(interval);
  }, [showError]);

  // Exports the patient's full reminder list to a downloadable file.
  const handleExport = (format) => {
    exportData({
      data: reminders,
      columns: [
        { key: 'title', label: 'Item/Doctor' },
        { key: 'type', label: 'Type' },
        { key: 'date', label: 'Date' },
        { key: 'time', label: 'Time' },
        { key: 'status', label: 'Status' }
      ],
      filename: `Patient_Reminders_${new Date().toISOString().split('T')[0]}`,
      format
    });
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center">Loading dashboard...</div>;
  }

  // Only show reminders whose scheduled date is today or in the future.
  const upcomingReminders = reminders.filter(a => a.rawDate >= new Date());
  const upcomingCount = upcomingReminders.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-secondary-900 mb-2">My Health Portal</h1>
        <p className="text-secondary-600">Manage your health and upcoming schedule</p>
      </div>

      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {patientData?.full_name || user?.username}!</h2>
        <p>You have {upcomingCount} upcoming reminder{upcomingCount !== 1 ? 's' : ''}. Stay healthy!</p>
      </Card>

      {/* Analytics Charts */}
      {reminders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-xl font-bold text-secondary-900 mb-6 flex items-center gap-2">
              <FiPieChart className="text-primary-600" /> Reminder Distribution
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label>
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
          
          <Card>
            <h2 className="text-xl font-bold text-secondary-900 mb-6 flex items-center gap-2">
              <FiPieChart className="text-primary-600" /> Completion Status
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#f59e0b', '#10b981'][index % 2]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* Upcoming Reminders */}
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-bold text-secondary-900">Your Reminders & Appointments</h2>
          <Button variant="primary" className="w-full sm:w-auto" onClick={() => navigate('/patient/doctors')}>
            Book Appointment
          </Button>
        </div>

        {upcomingReminders.length > 0 ? (
          <div className="space-y-4">
            {upcomingReminders.map((apt) => (
              <Card key={apt.id} hoverable>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${apt.isDoctor ? 'bg-primary-100' : 'bg-blue-100'}`}>
                    {apt.isDoctor ? (
                      <FiUser className="text-primary-600" size={24} />
                    ) : (
                      <FiActivity className="text-blue-600" size={24} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-secondary-900 truncate">{apt.title}</h3>
                      <p className="text-sm text-secondary-500 mb-1">{apt.type}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <p className="flex items-center gap-1 text-secondary-700">
                          <FiCalendar className="shrink-0" size={14} /> <span className="truncate">{apt.date}</span>
                        </p>
                        <p className="flex items-center gap-1 text-secondary-700">
                          <FiClock className="shrink-0" size={14} /> <span className="truncate">{apt.time}</span>
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 self-start sm:self-auto ${apt.status === 'completed' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}`}>
                      {apt.status}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-secondary-500 text-center py-8">No upcoming reminders or appointments found.</p>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <h2 className="text-xl font-bold text-secondary-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" fullWidth onClick={() => navigate('/patient/appointments')}>
            View Medical History
          </Button>
          <div className="w-full [&>div]:w-full [&_button]:w-full">
            <ExportMenu onExport={handleExport} isExporting={isExporting} />
          </div>
          <Button variant="outline" fullWidth onClick={() => navigate('/patient/doctors')}>
            Contact Doctor
          </Button>
        </div>
      </Card>
    </div>
  );
}
