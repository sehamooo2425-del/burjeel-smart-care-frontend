/*
 * Layout.jsx — The main page shell for Burjeel Smart Care.
 *
 * This component wraps every protected page in the app. It renders the
 * Sidebar on the left, the Navbar at the top, the page content in the
 * middle, and the Footer at the bottom. Any page that needs this shell
 * passes its content as `children` so Layout can slot it in.
 */

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiLogOut } from 'react-icons/fi';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

/*
 * Layout receives `children` — whatever page content the router places
 * inside it — and manages whether the sidebar is open or closed.
 */
export default function Layout({ children }) {
  // `sidebarOpen` tracks whether the sidebar is currently visible.
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  /*
   * handleLogout calls the auth hook's logout function, then sends the
   * user back to the login page using React Router's `navigate`.
   */
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-secondary-50">
      {/* Sidebar — slides in/out on mobile; always visible on desktop (md+) */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-secondary-900 text-white transform transition-transform duration-300
          md:sticky md:top-0 md:h-screen md:translate-x-0 overflow-hidden
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar onLogout={handleLogout} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <Navbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
        />

        {/* Page Content — `children` is whatever page the router rendered */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">{children}</div>
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Semi-transparent overlay shown on mobile when the sidebar is open;
          clicking it closes the sidebar. Hidden on desktop (md:hidden). */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
