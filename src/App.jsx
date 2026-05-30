/**
 * App.jsx — Root component of the application.
 * This component decides which page to show based on whether the user is logged
 * in and what their role is (admin, doctor, patient, or IT staff). It acts as
 * the central "traffic controller" for all navigation routes.
 */
import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AdminDashboard from './pages/AdminDashboard';
import PatientDashboard from './pages/PatientDashboard';
import PatientAppointments from './pages/PatientAppointments';
import PatientDoctorsPage from './pages/PatientDoctorsPage';
import AttendancePage from './pages/AttendancePage';
import ReminderPage from './pages/ReminderPage';
import ChatPage from './pages/ChatPage';
import ReportsPage from './pages/ReportsPage';
import PatientsPage from './pages/PatientsPage';
import DoctorManagementPage from './pages/DoctorManagementPage';
import DoctorDashboard from './pages/DoctorDashboard';
import SettingsPage from './pages/SettingsPage';
import AlertContainer from './components/common/AlertContainer';
import './App.css';

/**
 * App is the top-level component rendered by main.jsx.
 * It reads auth state and renders either the public (login/signup) routes or the
 * protected (dashboard) routes depending on whether the user is signed in.
 */
export default function App() {
  // Pull the current user object, authentication flag, and loading flag from AuthContext.
  const { user, isAuthenticated, loading } = useAuth();

  /**
   * Once the user is authenticated, hint to the browser to prefetch font files
   * in the background so they load faster when first needed.
   * The dependency array [isAuthenticated] means this effect re-runs whenever
   * the login status changes.
   */
  useEffect(() => {
    // Preload critical assets
    if (isAuthenticated) {
      // Create a <link rel="prefetch"> tag and inject it into <head> at runtime.
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = '/fonts/';
      document.head.appendChild(link);
    }
  }, [isAuthenticated]);

  /**
   * While AuthContext is checking localStorage for a saved session, show a
   * full-screen spinner so the user does not see a blank page or a flash of the
   * login screen before being redirected to their dashboard.
   */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin">
          <div className="h-16 w-16 border-4 border-primary-500 border-opacity-30 rounded-full border-t-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <AlertContainer />
      
      {/* If not logged in, only the public login and signup routes are accessible.
          Any other URL is redirected to /login to protect private pages. */}
      {!isAuthenticated ? (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          {/* The wildcard "*" catches every unmatched URL and sends it to /login. */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        // When logged in, wrap all pages in the shared Layout (sidebar, header, etc.).
        <Layout>
          <Routes>
            {/* Admin Routes */}
            {user?.role === 'admin' && (
              <>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/patients" element={<PatientsPage />} />
                <Route path="/admin/doctors" element={<DoctorManagementPage />} />
                <Route path="/admin/attendance" element={<AttendancePage />} />
                <Route path="/admin/reminders" element={<ReminderPage />} />
                <Route path="/admin/reports" element={<ReportsPage />} />
                <Route path="/admin/chat" element={<ChatPage />} />
              </>
            )}

            {/* Patient Routes */}
            {user?.role === 'patient' && (
              <>
                <Route path="/patient/dashboard" element={<PatientDashboard />} />
                <Route path="/patient/doctors" element={<PatientDoctorsPage />} />
                <Route path="/patient/appointments" element={<PatientAppointments />} />
                <Route path="/patient/chat" element={<ChatPage />} />
              </>
            )}

            {/* Doctor Routes */}
            {user?.role === 'doctor' && (
              <>
                <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
                <Route path="/admin/patients" element={<PatientsPage />} />
                <Route path="/admin/reminders" element={<ReminderPage />} />
                <Route path="/admin/attendance" element={<AttendancePage />} />
                <Route path="/admin/reports" element={<ReportsPage />} />
                <Route path="/admin/chat" element={<ChatPage />} />
              </>
            )}

            {/* Default Route — redirect "/" to the correct dashboard based on role.
                The ?. (optional chaining) safely accesses user.role even if user is null. */}
            <Route
              path="/"
              element={
                user?.role === 'admin' ? (
                  <Navigate to="/admin/dashboard" replace />
                ) : user?.role === 'doctor' ? (
                  <Navigate to="/doctor/dashboard" replace />
                ) : (
                  // For patients and IT staff, build the path dynamically from their role string.
                  <Navigate to={`/${user?.role}/dashboard`} replace />
                )
              }
            />
            
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      )}
    </div>
  );
}
