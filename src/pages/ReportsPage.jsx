/*
 * ReportsPage.jsx
 * Analytics page visible to admins and doctors.
 * Displays four stat cards with real period-over-period % changes, a bar chart of
 * attendance broken into time buckets, and a pie chart of reminder delivery outcomes.
 *
 * All metrics and both charts respond to the date filters. The date range preset
 * (week / month / year) applies immediately on change; the custom start/end date
 * inputs apply when the user clicks "Apply Filters". All filtering is done
 * client-side from data fetched once on mount so there are no extra API calls.
 */

import { useState, useEffect, useContext } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { FiFilter } from 'react-icons/fi';
import ExportMenu from '../components/common/ExportMenu';
import { useReportExport } from '../hooks/useReportExport';
import { AlertContext } from '../contexts/AlertContext';
import * as patientService from '../services/patientService';
import * as reminderService from '../services/reminderService';
import * as attendanceService from '../services/attendanceService';

// ─── Pure utility functions ───────────────────────────────────────────────────
// Defined outside the component so they are never recreated on re-render.

/*
 * computePeriodBounds — Converts the active filter state into four Date objects:
 * the start/end of the selected (current) period and the start/end of an equally-long
 * period immediately before it. The previous period is used for % change calculations.
 *
 * @param {string} range     - 'week' | 'month' | 'year'
 * @param {string} startDate - ISO date string (YYYY-MM-DD), or '' if not set
 * @param {string} endDate   - ISO date string (YYYY-MM-DD), or '' if not set
 * @returns {{ currentStart, currentEnd, prevStart, prevEnd }}
 */
function computePeriodBounds(range, startDate, endDate) {
  const now = new Date();
  let currentStart, currentEnd, prevStart, prevEnd;

  if (startDate && endDate) {
    // Custom range: the previous period has the same length, ending just before the current one.
    currentStart = new Date(startDate + 'T00:00:00');
    currentEnd   = new Date(endDate   + 'T23:59:59.999');
    const spanMs = currentEnd - currentStart;
    prevEnd   = new Date(currentStart.getTime() - 1);
    prevStart = new Date(prevEnd.getTime() - spanMs);
  } else if (range === 'week') {
    // Last 7 calendar days including today.
    currentEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    prevEnd   = new Date(currentStart.getTime() - 1);
    prevStart = new Date(prevEnd.getFullYear(), prevEnd.getMonth(), prevEnd.getDate() - 6);
  } else if (range === 'month') {
    // Current calendar month vs the calendar month before it.
    currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    currentEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    prevStart    = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    prevEnd      = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else {
    // Current calendar year vs the calendar year before it.
    currentStart = new Date(now.getFullYear(), 0, 1);
    currentEnd   = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    prevStart    = new Date(now.getFullYear() - 1, 0, 1);
    prevEnd      = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
  }

  return { currentStart, currentEnd, prevStart, prevEnd };
}

/*
 * filterByDateRange — Returns only the items from `data` where `item[dateKey]`
 * falls within [start, end] (inclusive on both ends).
 */
function filterByDateRange(data, dateKey, start, end) {
  return data.filter(item => {
    const d = new Date(item[dateKey]);
    return d >= start && d <= end;
  });
}

/*
 * formatChange — Computes the % change from `previous` to `current` and returns
 * a display string like '+25.0%' or '-10.0%'.
 *
 * Returns '—' whenever `previous` is 0, because you cannot calculate a meaningful
 * percentage without a baseline. Going from 0 → n is infinite growth, not +100%.
 *   previous=0, current=0  → '—'   (no data in either period)
 *   previous=0, current>0  → '—'   (first period ever; no baseline to compare)
 *   previous=1, current=2  → '+100.0%'  ✓
 *   previous=2, current=3  → '+50.0%'   ✓
 *   previous=5, current=0  → '-100.0%'  ✓
 */
function formatChange(current, previous) {
  // No baseline → percentage is undefined, not +100%.
  if (previous === 0) return '—';
  const pct = ((current - previous) / previous) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

/*
 * buildAttendanceChart — Groups filtered attendance records into time buckets
 * appropriate for the date span and returns an array ready for Recharts.
 *   ≤ 14 days  → daily buckets   (Sun, Mon, Tue …)
 *   ≤ 90 days  → weekly buckets  (Week 1, Week 2 …)
 *   > 90 days  → monthly buckets (Jan, Feb …)
 */
function buildAttendanceChart(attendances, range, startDate, endDate) {
  // Estimate the span in days to pick the right granularity.
  const spanDays = startDate && endDate
    ? Math.round((new Date(endDate + 'T23:59:59') - new Date(startDate + 'T00:00:00')) / 86400000) + 1
    : range === 'week' ? 7 : range === 'month' ? 30 : 365;

  let buckets;

  if (spanDays <= 14) {
    // Daily: one bucket per day of the week.
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    buckets = dayNames.map(d => ({ date: d, present: 0, absent: 0, late: 0 }));
    attendances.forEach(att => {
      const b = buckets[new Date(att.appointment_date).getDay()];
      if (b) incrementBucket(b, att.status);
    });
  } else if (spanDays <= 90) {
    // Weekly: days 1–7 → Week 1, days 8–14 → Week 2, etc.
    buckets = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'].map(w => ({ date: w, present: 0, absent: 0, late: 0 }));
    attendances.forEach(att => {
      // Cap at index 4 (Week 5) for months with more than 28 days.
      const weekIdx = Math.min(Math.floor((new Date(att.appointment_date).getDate() - 1) / 7), 4);
      incrementBucket(buckets[weekIdx], att.status);
    });
  } else {
    // Monthly: one bucket per calendar month.
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    buckets = monthNames.map(m => ({ date: m, present: 0, absent: 0, late: 0 }));
    attendances.forEach(att => {
      const b = buckets[new Date(att.appointment_date).getMonth()];
      if (b) incrementBucket(b, att.status);
    });
  }

  return buckets;
}

/* Increments the correct counter in a chart bucket based on the attendance status string. */
function incrementBucket(bucket, status) {
  if (status === 'present' || status === 'came') bucket.present++;
  else if (status === 'absent' || status === 'not came') bucket.absent++;
  else if (status === 'late') bucket.late++;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [reportType, setReportType] = useState('attendance');
  const [dateRange, setDateRange] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  // stats: the headline numbers shown in the four summary cards for the current period.
  const [stats, setStats] = useState({ totalPatients: 0, avgAttendance: 0, remindersSent: 0, appointments: 0 });
  // changes: formatted % strings comparing the current period against the preceding one.
  const [changes, setChanges] = useState({ totalPatients: '—', avgAttendance: '—', remindersSent: '—', appointments: '—' });
  const [attendanceData, setAttendanceData] = useState([]);
  const [reminderData, setReminderData] = useState([]);
  // rawData is fetched once on mount; all filtering is applied client-side from this store.
  const [rawData, setRawData] = useState({ patients: [], reminders: [], attendances: [] });

  const { error: showError } = useContext(AlertContext);
  const { exportData, isExporting } = useReportExport();
  // Green = sent/present, red = failed/absent.
  const COLORS = ['#10b981', '#ef4444'];

  /*
   * applyFilters — Core computation function that drives all four cards and both charts.
   * Accepts explicit params so it can be called with the latest values before React
   * has had a chance to commit a state update (e.g. when the dateRange dropdown changes).
   *
   * Steps:
   *   1. Compute current and previous period boundaries.
   *   2. Slice rawData into two windows (current / previous) for each dataset.
   *   3. Calculate stat values and real % changes.
   *   4. Rebuild both charts from the current-period slice.
   */
  const applyFilters = (range = dateRange, start = startDate, end = endDate) => {
    const { patients, reminders, attendances } = rawData;
    // Guard: do nothing if the initial fetch hasn't completed yet.
    if (!patients.length && !reminders.length && !attendances.length) return;

    const { currentStart, currentEnd, prevStart, prevEnd } = computePeriodBounds(range, start, end);

    // Slice each dataset into the two time windows.
    const currAtt = filterByDateRange(attendances, 'appointment_date', currentStart, currentEnd);
    const prevAtt = filterByDateRange(attendances, 'appointment_date', prevStart,    prevEnd);
    const currRem = filterByDateRange(reminders,   'scheduled_date',   currentStart, currentEnd);
    const prevRem = filterByDateRange(reminders,   'scheduled_date',   prevStart,    prevEnd);

    // For Total Patients we compare the patient count that existed BEFORE the current period
    // started against the current total. This correctly shows e.g. "+50%" when there were
    // 2 patients at the start of the month and 3 now (1 new). Adding 'T00:00:00' forces the
    // date string to be parsed in local time so it aligns with currentStart (also local time).
    const patientsAtPeriodStart = patients.filter(p =>
      p.registered_date && new Date(p.registered_date + 'T00:00:00') < currentStart
    ).length;

    // Attendance rate = (present records / total records) × 100 for each period.
    const currPresent = currAtt.filter(a => a.status === 'present' || a.status === 'came').length;
    const currAttRate = currAtt.length > 0 ? (currPresent / currAtt.length) * 100 : 0;
    const prevPresent = prevAtt.filter(a => a.status === 'present' || a.status === 'came').length;
    const prevAttRate = prevAtt.length > 0 ? (prevPresent / prevAtt.length) * 100 : 0;

    const currSent = currRem.reduce((acc, r) => acc + (r.success_sent || 0), 0);
    const prevSent = prevRem.reduce((acc, r) => acc + (r.success_sent || 0), 0);

    // Update stat card values.
    setStats({
      // Total patients always shows the full DB count; the % change reflects new registrations.
      totalPatients: patients.length,
      // Round to one decimal place so "66.6666..." displays as "66.7".
      avgAttendance: Math.round(currAttRate * 10) / 10,
      remindersSent: currSent,
      appointments:  currAtt.length,
    });

    // Update % changes — each compared against the appropriate baseline.
    setChanges({
      // Total patients: current total vs how many existed before this period started.
      // e.g. 2 patients before → 3 now = +50%. If patientsAtPeriodStart=0 (new system) → '—'.
      totalPatients: formatChange(patients.length, patientsAtPeriodStart),
      // Attendance rate, reminders, appointments: current period vs the preceding equal period.
      avgAttendance: formatChange(currAttRate,    prevAttRate),
      remindersSent: formatChange(currSent,       prevSent),
      appointments:  formatChange(currAtt.length, prevAtt.length),
    });

    // Rebuild bar chart — granularity adapts to the selected date span.
    setAttendanceData(buildAttendanceChart(currAtt, range, start, end));

    // Rebuild pie chart from current-period reminders only.
    setReminderData([
      { name: 'Sent',   value: currRem.reduce((acc, r) => acc + (r.success_sent || 0), 0) },
      { name: 'Failed', value: currRem.reduce((acc, r) => acc + (r.failed_sent  || 0), 0) },
    ]);
  };

  /*
   * Fetch all raw data once on mount. No date params — we load all records and let
   * applyFilters() slice them client-side, avoiding extra API calls on every filter change.
   */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [patients, reminders, attendances] = await Promise.all([
          patientService.getPatients(),
          reminderService.getReminders(),
          attendanceService.getAttendances(),
        ]);
        setRawData({ patients, reminders, attendances });
      } catch (err) {
        console.error('Error fetching report data:', err);
        showError('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showError]);

  /*
   * Once rawData is populated after the initial fetch, immediately run applyFilters()
   * with the default range (month) so the cards and charts are populated without
   * requiring the user to click "Apply Filters" first.
   */
  useEffect(() => {
    applyFilters();
    // Intentionally omitting applyFilters from deps — we only want this to fire when
    // rawData changes (i.e. after the initial fetch), not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawData]);

  /*
   * handleExport — Applies the active date filter to the selected dataset and downloads
   * the result as a file in the chosen format (CSV / Excel / PDF).
   */
  const handleExport = (format) => {
    let dataToExport = [];
    let columns = [];
    let dateKey = 'appointment_date';

    if (reportType === 'attendance' || reportType === 'appointments') {
      dataToExport = rawData.attendances;
      columns = [
        { key: 'appointment_date', label: 'Date',   render: (val) => new Date(val).toLocaleDateString() },
        { key: 'status',           label: 'Status' },
        { key: 'notes',            label: 'Notes'  },
      ];
    } else if (reportType === 'reminders') {
      dataToExport = rawData.reminders;
      dateKey = 'scheduled_date';
      columns = [
        { key: 'scheduled_date', label: 'Scheduled Date', render: (val) => new Date(val).toLocaleString() },
        { key: 'reminder_type',  label: 'Type'           },
        { key: 'display_name',   label: 'Detail'         },
        { key: 'success_sent',   label: 'Success Sent'   },
        { key: 'failed_sent',    label: 'Failed Sent'    },
      ];
    }

    // Apply the same date window used by the cards and charts.
    const { currentStart, currentEnd } = computePeriodBounds(dateRange, startDate, endDate);
    dataToExport = filterByDateRange(dataToExport, dateKey, currentStart, currentEnd);

    exportData({
      data: dataToExport,
      columns,
      filename: `${reportType}_report_${new Date().toISOString().split('T')[0]}`,
      format
    });
  };

  if (loading) return <div className="flex items-center justify-center h-full">Loading...</div>;

  // Human-readable label for the comparison period shown beside each % change.
  const periodLabel = (startDate && endDate)
    ? 'vs previous period'
    : dateRange === 'week'  ? 'vs last week'
    : dateRange === 'month' ? 'vs last month'
    : 'vs last year';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-secondary-900 mb-2">Reports & Analytics</h1>
        <p className="text-secondary-600">View comprehensive hospital statistics and reports</p>
      </div>

      {/* Filter bar — Report type, date range preset, and optional custom date inputs. */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Report Type"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            options={[
              { value: 'attendance',   label: 'Attendance'   },
              { value: 'reminders',    label: 'Reminders'    },
              { value: 'appointments', label: 'Appointments' },
            ]}
          />

          <Select
            label="Date Range"
            value={dateRange}
            onChange={(e) => {
              setDateRange(e.target.value);
              // Apply the new preset immediately — pass it explicitly because the
              // state update from setDateRange won't be visible until the next render.
              applyFilters(e.target.value, startDate, endDate);
            }}
            options={[
              { value: 'week',  label: 'This Week'  },
              { value: 'month', label: 'This Month' },
              { value: 'year',  label: 'This Year'  },
            ]}
          />

          <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="End Date"   type="date" value={endDate}   onChange={(e) => setEndDate(e.target.value)}   />
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {/* Clicking Apply Filters recomputes all stats and charts from the current filter values. */}
          <Button
            variant="primary"
            icon={FiFilter}
            className="w-full sm:w-auto"
            onClick={() => applyFilters()}
          >
            Apply Filters
          </Button>
          <div className="w-full sm:w-auto [&>div]:w-full sm:[&>div]:w-auto [&_button]:w-full sm:[&_button]:w-auto">
            <ExportMenu onExport={handleExport} isExporting={isExporting} />
          </div>
        </div>
      </Card>

      {/* Stat cards — each shows the current-period value and a real % change vs the prior period. */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Patients', value: stats.totalPatients,       change: changes.totalPatients, sub: 'since start of period' },
          { label: 'Avg Attendance', value: `${stats.avgAttendance}%`, change: changes.avgAttendance, sub: 'attendance rate'               },
          { label: 'Reminders Sent', value: stats.remindersSent,       change: changes.remindersSent, sub: 'successfully delivered'        },
          { label: 'Appointments',   value: stats.appointments,        change: changes.appointments,  sub: 'this period'                   },
        ].map((metric, idx) => (
          <Card key={idx}>
            <p className="text-secondary-500 text-sm font-medium mb-1">{metric.label}</p>
            <p className="text-3xl font-bold text-secondary-900 mb-1">{metric.value}</p>
            <p className="text-xs text-secondary-400 mb-2">{metric.sub}</p>
            {/* Colour: green for growth, red for decline, grey when no comparison data exists. */}
            <p className={`text-sm font-semibold ${
              metric.change.startsWith('+') ? 'text-green-600' :
              metric.change.startsWith('-') ? 'text-red-600'   :
              'text-secondary-400'
            }`}>
              {metric.change}{metric.change !== '—' ? ` ${periodLabel}` : ''}
            </p>
          </Card>
        ))}
      </div>

      {/* Charts — both are rebuilt by applyFilters() and show only current-period data. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-bold text-secondary-900 mb-6">Attendance Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              {/* allowDecimals={false} keeps the Y-axis showing whole numbers (patient counts). */}
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="present" fill="#10b981" />
              <Bar dataKey="absent"  fill="#ef4444" />
              <Bar dataKey="late"    fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-secondary-900 mb-6">Reminder Delivery — Current Period</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reminderData}
                cx="50%"
                cy="50%"
                labelLine={false}
                // Show the slice name and its percentage directly on the chart.
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                dataKey="value"
              >
                {reminderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
