/*
 * ExportMenu.jsx — A dropdown button that lets users download report data
 * in CSV, Excel, or PDF format.
 *
 * Clicking "Export Report" opens the dropdown. Selecting a format calls
 * `onExport` with that format string, then closes the dropdown. While an
 * export is in progress (`isExporting` is true) the button is disabled and
 * shows a spinner. Used on report and data-table pages.
 */

import { useState, useRef, useEffect } from 'react';
import { FiDownload, FiChevronDown, FiFileText, FiGrid, FiFile } from 'react-icons/fi';
import Button from './Button';

/*
 * ExportMenu props:
 *  - onExport(format): called with 'csv', 'excel', or 'pdf' when the user
 *    picks a format from the dropdown
 *  - isExporting: true while the parent is processing the download; disables
 *    the button and shows a spinner
 */
export default function ExportMenu({ onExport, isExporting }) {
  // Tracks whether the format dropdown is open.
  const [isOpen, setIsOpen] = useState(false);

  // `dropdownRef` points to the container div so we can detect outside clicks.
  const dropdownRef = useRef(null);

  // Close the dropdown whenever the user clicks anywhere outside of it.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    // Clean up the listener when the component is removed from the page.
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /*
   * handleExport closes the dropdown first, then calls the parent's
   * `onExport` callback with the chosen format string.
   */
  const handleExport = (format) => {
    setIsOpen(false);
    onExport(format);
  };

  return (
    // `relative` on the container lets the dropdown position itself below the button.
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <Button
        variant="outline"
        // Hide the download icon while exporting so only the spinner is shown.
        icon={isExporting ? undefined : FiDownload}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
      >
        {/* Switch button label between a spinner+text and the normal label */}
        {isExporting ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></span>
            Exporting...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Export Report <FiChevronDown />
          </span>
        )}
      </Button>

      {/* Dropdown panel — only shown when open and not currently exporting */}
      {isOpen && !isExporting && (
        <div className="absolute right-0 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <button
              onClick={() => handleExport('csv')}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100"
            >
              <FiFileText /> CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100"
            >
              <FiGrid /> Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100"
            >
              <FiFile /> PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
