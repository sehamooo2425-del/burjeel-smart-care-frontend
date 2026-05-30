/*
 * Footer.jsx — The site footer rendered at the bottom of every page.
 *
 * It shows the app name and description, a small set of quick links, a
 * support email address, and the current copyright year. It is rendered
 * by Layout.jsx and requires no props.
 */

import { APP_CONFIG } from '../../utils/constants';

/*
 * Footer reads the current year at render time so the copyright notice
 * never needs to be manually updated.
 */
export default function Footer() {
  // `new Date().getFullYear()` returns the four-digit current year (e.g. 2025).
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-secondary-200 px-4 md:px-8 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* About */}
          <div>
            <h3 className="font-bold text-secondary-900 mb-2">{APP_CONFIG.NAME}</h3>
            <p className="text-sm text-secondary-600">
              Intelligent patient management and doctor appointment management system.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-secondary-900 mb-2">Quick Links</h3>
            <ul className="space-y-1 text-sm text-secondary-600">
              <li>
                <a href="#help" className="hover:text-primary-600 transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-primary-600 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-primary-600 transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-secondary-900 mb-2">Support</h3>
            <p className="text-sm text-secondary-600">
              For assistance, contact:{' '}
              <a href="mailto:support@burjeel.com" className="text-primary-600 hover:underline">
                support@burjeel.com
              </a>
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-secondary-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-secondary-600">
          <p>&copy; {currentYear} {APP_CONFIG.NAME}. All rights reserved.</p>
          <p>Version {APP_CONFIG.VERSION}</p>
        </div>
      </div>
    </footer>
  );
}
