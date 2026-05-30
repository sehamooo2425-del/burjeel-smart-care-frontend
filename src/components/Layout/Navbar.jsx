/*
 * Navbar.jsx — The horizontal top bar shown on every authenticated page.
 *
 * It displays the app name, a sidebar toggle button (mobile only), a
 * notifications bell, the logged-in user's name/avatar, and a logout
 * button. It is rendered by Layout.jsx and receives sidebar state and
 * callback functions as props.
 */

import { useAuth } from '../../hooks/useAuth';
import { FiMenu, FiLogOut, FiBell, FiUser, FiX } from 'react-icons/fi';
import { APP_CONFIG } from '../../utils/constants';

/*
 * Navbar receives:
 *  - sidebarOpen: whether the sidebar is currently visible (used to swap
 *    the hamburger icon between FiMenu and FiX)
 *  - onToggleSidebar: callback that opens or closes the sidebar
 *  - onLogout: callback that logs the user out and redirects to login
 */
export default function Navbar({ sidebarOpen, onToggleSidebar, onLogout }) {
  const { user } = useAuth();

  return (
    <nav className="bg-white border-b border-secondary-200 shadow-soft">
      <div className="px-4 md:px-8 py-4 flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          {/* Hamburger / close button — only shown on small screens (md:hidden) */}
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors md:hidden"
            aria-label="Toggle sidebar"
          >
            {/* Swap icon based on whether the sidebar is currently open */}
            {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
          <div className="hidden md:block">
            <h1 className="text-xl font-bold text-primary-600">{APP_CONFIG.NAME}</h1>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-6">
          {/* Notifications bell — the small red dot indicates unread alerts */}
          <button className="relative p-2 hover:bg-secondary-100 rounded-lg transition-colors">
            <FiBell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
          </button>

          {/* User info and avatar */}
          <div className="flex items-center gap-3">
            {/* Name and role text — hidden on very small screens (sm:block) */}
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-secondary-900">{user?.username || user?.name}</p>
              <p className="text-xs text-secondary-500 capitalize">{user?.role}</p>
            </div>
            {/* Avatar: shows the profile photo if one exists, otherwise falls
                back to the first letter of the username in a coloured circle */}
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
              {user?.profile_picture_url ? (
                <img src={user.profile_picture_url} alt={user.username || user.name} className="w-full h-full object-cover" />
              ) : (
                (user?.username || user?.name || 'U').charAt(0).toUpperCase()
              )}
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors text-secondary-600 hover:text-danger"
            aria-label="Logout"
            title="Logout"
          >
            <FiLogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
}
