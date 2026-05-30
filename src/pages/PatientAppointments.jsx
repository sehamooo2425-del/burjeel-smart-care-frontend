/*
 * PatientAppointments.jsx
 * This page is visible to patients. It shows a full history of all their reminders
 * (both medication and doctor visits) sorted newest first, and lets them export the list.
 * Unlike the dashboard, this page shows past records too — not just upcoming ones.
 */

import { useState, useEffect, useContext } from 'react';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import ExportMenu from '../components/common/ExportMenu';
import { useReportExport } from '../hooks/useReportExport';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { AlertContext } from '../contexts/AlertContext';

export default function PatientAppointments() {
  const { error: showError } = useContext(AlertContext);
  const { exportData, isExporting } = useReportExport();

  // reminders holds the formatted list of all reminders for this patient.
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  /*
   * Runs once when the page loads. Fetches the patient's full reminder history,
   * formats each record for display, and sorts them newest-first.
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // The backend automatically returns only this logged-in patient's reminders.
        const remindersRes = await api.get('/reminders/');

        const formattedReminders = remindersRes
          .map(r => {
            const isDoctor = r.reminder_type === 'doctor_visit';
            return {
              id: r.reminder_id,
              // Doctor-visit reminders show the doctor's name prefixed with "Dr.".
              title: isDoctor ? `Dr. ${r.display_name}` : r.display_name,
              type: isDoctor ? 'Doctor Visit' : 'Medication',
              date: new Date(r.scheduled_date).toLocaleDateString(),
              time: new Date(r.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: r.status,
              // rawDate is stored as a Date object so we can sort numerically.
              rawDate: new Date(r.scheduled_date),
            };
          })
          .sort((a, b) => b.rawDate - a.rawDate); // Newest reminder at the top.

        setReminders(formattedReminders);
      } catch (err) {
        showError('Failed to load appointments data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showError]);

  // Exports the full reminder history to a downloadable file in the chosen format.
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
      filename: `My_Appointments_${new Date().toISOString().split('T')[0]}`,
      format
    });
  };

  // Column definitions for the appointments table.
  const columns = [
    { key: 'title', label: 'Item / Doctor' },
    {
      key: 'type',
      label: 'Type',
      // Show a coloured badge to distinguish doctor visits from medication reminders.
      render: (val) => (
        <Badge variant={val === 'Doctor Visit' ? 'info' : 'primary'}>
          {val}
        </Badge>
      )
    },
    { key: 'date', label: 'Date' },
    { key: 'time', label: 'Time' },
    {
      key: 'status',
      label: 'Status',
      // Completed reminders appear grey; all other statuses appear green (active/upcoming).
      render: (val) => (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${val === 'completed' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}`}>
          {val}
        </span>
      )
    }
  ];

  if (loading) {
    return <div className="flex h-full items-center justify-center">Loading appointments...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-secondary-900 mb-2">My Appointments</h1>
        <p className="text-secondary-600">View all your past and upcoming appointments and medication reminders</p>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <h2 className="text-xl font-bold text-secondary-900">All Records</h2>
          <div className="w-full sm:w-auto [&>div]:w-full [&_button]:w-full">
            <ExportMenu onExport={handleExport} isExporting={isExporting} />
          </div>
        </div>
        
        {reminders.length > 0 ? (
          <Table columns={columns} data={reminders} hover striped />
        ) : (
          <p className="text-secondary-500 text-center py-8">No appointments or reminders found.</p>
        )}
      </Card>
    </div>
  );
}
