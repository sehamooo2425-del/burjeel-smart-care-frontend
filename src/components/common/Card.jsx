/*
 * Card.jsx — A generic content container used to group related information
 * into a visually distinct box (e.g. a patient summary, a stat widget, or
 * a form section) throughout the dashboard and detail pages.
 *
 * It supports four visual styles and an optional hover effect for
 * clickable cards. Any content passed as `children` is rendered inside.
 */

/*
 * Card props:
 *  - children: the content to display inside the card
 *  - variant: visual style — 'default' | 'elevated' | 'outlined' | 'ghost'
 *  - hoverable: adds a shadow and pointer cursor so the card feels clickable
 *  - onClick: optional click handler (typically used with hoverable)
 *  - className: extra Tailwind classes to merge in from the parent
 */
export default function Card({
  children,
  className = '',
  variant = 'default',
  hoverable = false,
  onClick,
  ...props
}) {
  // Each variant has its own background, border, or shadow style.
  const variantClasses = {
    default: 'bg-white border border-secondary-200',
    elevated: 'bg-white shadow-lg',
    outlined: 'bg-white border-2 border-primary-600',
    ghost: 'bg-secondary-50',
  };

  // Only apply hover styles when the card is meant to be interactive.
  const hoverClass = hoverable ? 'hover:shadow-lg cursor-pointer transition-shadow' : '';

  return (
    <div
      className={`rounded-lg p-6 ${variantClasses[variant]} ${hoverClass} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}
