/*
 * Sidebar.jsx — The vertical navigation panel shown on the left side of
 * every authenticated page.
 *
 * It reads the current user's role from the auth context and renders only
 * the navigation links that are relevant to that role (admin, patient,
 * or doctor). It is rendered by Layout.jsx.
 */

import { useAuth } from '../../hooks/useAuth';
import { NavLink } from 'react-router-dom';
import {
  FiHome,
  FiUsers,
  FiBell,
  FiCheck,
  FiBarChart2,
  FiMessageSquare,
  FiCalendar,
  FiUserPlus,
  FiSettings,
} from 'react-icons/fi';

/*
 * navItems maps each user role to the list of navigation links that role
 * is allowed to see. Each entry has a label, a route path, and an icon
 * component from react-icons.
 */
const navItems = {
  admin: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: FiHome },
    { label: 'Patients', path: '/admin/patients', icon: FiUsers },
    { label: 'Doctors', path: '/admin/doctors', icon: FiUserPlus },
    { label: 'Reminders', path: '/admin/reminders', icon: FiBell },
    { label: 'Attendance', path: '/admin/attendance', icon: FiCheck },
    { label: 'Reports', path: '/admin/reports', icon: FiBarChart2 },
    { label: 'Chat', path: '/admin/chat', icon: FiMessageSquare },
    { label: 'Settings', path: '/settings', icon: FiSettings },
  ],
  patient: [
    { label: 'Dashboard', path: '/patient/dashboard', icon: FiHome },
    { label: 'Doctors', path: '/patient/doctors', icon: FiUserPlus },
    { label: 'Appointments', path: '/patient/appointments', icon: FiCalendar },
    { label: 'Messages', path: '/patient/chat', icon: FiMessageSquare },
    { label: 'Settings', path: '/settings', icon: FiSettings },
  ],
  doctor: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: FiHome },
    { label: 'Patients', path: '/admin/patients', icon: FiUsers },
    { label: 'Reminders', path: '/admin/reminders', icon: FiBell },
    { label: 'Attendance', path: '/admin/attendance', icon: FiCheck },
    { label: 'Reports', path: '/admin/reports', icon: FiBarChart2 },
    { label: 'Chat', path: '/admin/chat', icon: FiMessageSquare },
    { label: 'Settings', path: '/settings', icon: FiSettings },
  ],
};

/*
 * Sidebar renders the app logo, the role-specific nav links, and a logout
 * button at the bottom. `onLogout` is a callback passed down from Layout.
 */
export default function Sidebar({ onLogout }) {
  const { user } = useAuth();

  // Pick the correct nav links for this user's role; default to an empty
  // array if the role isn't recognised so the sidebar renders without crashing.
  const userNavItems = navItems[user?.role] || [];

  return (
    <div className="flex flex-col h-screen">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-secondary-800">
        <h2 className="text-2xl font-bold text-white">Smart Care</h2>
        <p className="text-xs text-secondary-400 mt-1">Patient Management</p>
      </div>

      {/* Navigation links — one NavLink per allowed route */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="space-y-2">
          {userNavItems.map((item) => {
            // Store the icon component in a capitalised variable so JSX
            // treats it as a component rather than an HTML element.
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                // React Router calls this function with `isActive` so we can
                // apply a highlighted style to the link for the current page.
                className={({ isActive }) =>
                  `
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-secondary-300 hover:bg-secondary-800 hover:text-white'
                  }
                `
                }
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Bottom section — shows the app version and the logout button */}
      <div className="px-4 py-4 border-t border-secondary-800">
        <div className="bg-secondary-800 rounded-lg p-4 text-center">
          {/* VITE_APP_VERSION comes from the build environment; falls back to 1.0.0 */}
          <p className="text-xs text-secondary-400 mb-3">Version {import.meta.env.VITE_APP_VERSION || '1.0.0'}</p>
          <button
            onClick={onLogout}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
