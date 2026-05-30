/*
 * Button.jsx — The reusable button component used for every clickable
 * action in the app (saving forms, opening modals, exporting reports, etc.).
 *
 * It supports five visual styles (variants), three sizes, an optional icon,
 * a loading spinner state, and a full-width mode. Extra HTML attributes
 * (like `aria-label`) are forwarded to the underlying `<button>` element
 * via the `...props` spread.
 */

/*
 * Button props:
 *  - children: the label text or elements inside the button
 *  - variant: visual style — 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
 *  - size: 'sm' | 'md' | 'lg'
 *  - disabled: prevents interaction and dims the button
 *  - loading: shows a spinner and disables the button while an async action runs
 *  - fullWidth: makes the button stretch to fill its container
 *  - icon: an optional react-icons component rendered before the label
 *  - onClick: function called when the button is clicked
 *  - type: HTML button type — 'button' (default), 'submit', or 'reset'
 *  - className: extra Tailwind classes to merge in from the parent
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon: Icon,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  // baseClasses are applied to every button regardless of variant or size.
  const baseClasses = 'font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2';

  // Each variant has its own background, text, hover, and active colours.
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
    secondary: 'bg-secondary-100 text-secondary-900 hover:bg-secondary-200 active:bg-secondary-300',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 active:bg-primary-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
    ghost: 'text-secondary-600 hover:bg-secondary-100 active:bg-secondary-200',
  };

  // Each size adjusts padding and font size.
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  // Only add `w-full` when `fullWidth` is true.
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      // Disable the button both when explicitly disabled AND while loading.
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClass}
        ${className}
      `}
      {...props}
    >
      {/* Render the icon only if one was passed; size scales with button size */}
      {Icon && <Icon size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />}
      {/* While loading, replace the label with a spinning ring and "Loading..." text */}
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
