/*
 * Badge.jsx — A small pill-shaped label used to display status tags
 * such as "Active", "Pending", or "Critical" next to items in tables
 * and cards throughout the app.
 *
 * It accepts a `variant` prop for colour (success, warning, danger, etc.)
 * and a `size` prop (sm, md, lg). Any text or element passed as `children`
 * is shown inside the pill.
 */

/*
 * Badge renders a `<span>` styled as a rounded pill. `variant` controls
 * the colour scheme and `size` controls padding/font-size.
 */
export default function Badge({ children, variant = 'primary', size = 'md' }) {
  // Each variant maps to a background and text colour pair.
  const variantClasses = {
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    secondary: 'bg-secondary-100 text-secondary-800',
  };

  // Each size maps to padding and font-size classes.
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-semibold
        ${variantClasses[variant]}
        ${sizeClasses[size]}
      `}
    >
      {children}
    </span>
  );
}
