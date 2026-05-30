/*
 * Modal.jsx — A dialog overlay used whenever the app needs to capture user
 * input or display detailed information without navigating away from the
 * current page (e.g. "Add Patient", "Confirm Delete", "View Appointment").
 *
 * It renders a semi-transparent backdrop and a centred white panel. The
 * panel has optional header, scrollable body, and footer slots. Clicking
 * the backdrop can optionally close the modal via `closeOnBackdrop`.
 */

/*
 * Modal props:
 *  - isOpen: controls whether the modal is rendered at all
 *  - onClose: callback invoked when the X button or backdrop is clicked
 *  - title: optional heading shown in the header bar
 *  - children: the main body content of the modal
 *  - footer: optional element (e.g. action buttons) shown at the bottom
 *  - size: width constraint — 'sm' | 'md' | 'lg' | 'xl'
 *  - closeOnBackdrop: if true, clicking the dark overlay calls onClose
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}) {
  // When the modal is closed, render nothing so the DOM stays clean.
  if (!isOpen) return null;

  // Map size names to Tailwind max-width classes.
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    // The outer div is the dark semi-transparent backdrop.
    // The onClick handler checks that the click landed directly on the
    // backdrop (e.target === e.currentTarget) and not on the panel inside it,
    // then calls onClose only if `closeOnBackdrop` is enabled.
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => closeOnBackdrop && e.target === e.currentTarget && onClose()}
    >
      <div className={`${sizeClasses[size]} w-full bg-white rounded-lg shadow-xl animate-fade-in`}>
        {/* Header — only rendered when a title string was provided */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-200">
            <h2 className="text-xl font-bold text-secondary-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-secondary-400 hover:text-secondary-600 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Scrollable body — max-height keeps the modal from growing taller
            than the viewport on screens with lots of form fields */}
        <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">{children}</div>

        {/* Footer — only rendered when a footer element was passed as a prop */}
        {footer && <div className="px-6 py-4 border-t border-secondary-200 bg-secondary-50 rounded-b-lg">{footer}</div>}
      </div>
    </div>
  );
}
