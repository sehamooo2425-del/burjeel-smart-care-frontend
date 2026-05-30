/*
 * Alert.jsx — A dismissible notification banner used to give feedback to
 * the user (e.g. "Appointment saved successfully" or "Something went wrong").
 *
 * It supports four types — success, error, warning, and info — each with its
 * own colour scheme and icon. Alerts can close themselves automatically after
 * a set time, or wait for the user to click the X button. AlertContainer.jsx
 * renders multiple Alerts stacked on the screen.
 */

import { useEffect, useState } from 'react';
import { FiCheck, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

/*
 * Alert props:
 *  - type: visual style — 'success' | 'error' | 'warning' | 'info'
 *  - message: the text to display
 *  - title: optional bold heading shown above the message
 *  - autoClose: if true, the alert hides itself after `duration` ms
 *  - duration: how long (in ms) before auto-close fires (default 5 s)
 *  - onClose: callback invoked when the alert is dismissed
 */
export default function Alert({
  type = 'info',
  message,
  onClose,
  autoClose = true,
  duration = 5000,
  title,
}) {
  // `isVisible` controls whether the alert is in the DOM at all.
  const [isVisible, setIsVisible] = useState(true);

  // When `autoClose` is true, start a timer that hides the alert after
  // `duration` milliseconds. The cleanup function cancels the timer if
  // the component unmounts before the timer fires (prevents memory leaks).
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  // Return nothing once the alert has been dismissed so it disappears.
  if (!isVisible) return null;

  /*
   * typeConfig maps each alert type to its Tailwind colour classes and icon.
   * This lookup approach avoids a long if/else chain.
   */
  const typeConfig = {
    success: {
      bgColor: 'bg-green-50',
      borderColor: 'border-l-4 border-green-500',
      textColor: 'text-green-800',
      icon: FiCheck,
      iconColor: 'text-green-500',
    },
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-l-4 border-red-500',
      textColor: 'text-red-800',
      icon: FiAlertCircle,
      iconColor: 'text-red-500',
    },
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-l-4 border-yellow-500',
      textColor: 'text-yellow-800',
      icon: FiAlertCircle,
      iconColor: 'text-yellow-500',
    },
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-l-4 border-blue-500',
      textColor: 'text-blue-800',
      icon: FiInfo,
      iconColor: 'text-blue-500',
    },
  };

  // Look up the config for the given type; fall back to 'info' if unknown.
  const config = typeConfig[type] || typeConfig.info;
  // Capitalised so JSX treats it as a component, not an HTML tag.
  const Icon = config.icon;

  return (
    <div
      // Spread all colour/border classes that come from the config object.
      className={`
        ${config.bgColor}
        ${config.borderColor}
        ${config.textColor}
        p-4 rounded-lg shadow-md animate-slide-down
        flex items-start gap-3
      `}
      role="alert"
    >
      <Icon className={`flex-shrink-0 ${config.iconColor}`} size={20} />
      <div className="flex-1">
        {/* Only render the heading element when a title was provided */}
        {title && <h4 className="font-semibold mb-1">{title}</h4>}
        <p className="text-sm">{message}</p>
      </div>
      {/* Manual close button — `onClose?.()` safely calls onClose only if
          it was passed as a prop (the ?. is optional-chaining) */}
      <button
        onClick={() => {
          setIsVisible(false);
          onClose?.();
        }}
        className={`flex-shrink-0 hover:opacity-70 transition-opacity`}
        aria-label="Close alert"
      >
        <FiX size={20} />
      </button>
    </div>
  );
}
