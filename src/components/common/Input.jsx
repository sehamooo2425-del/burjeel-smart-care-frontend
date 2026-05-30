/*
 * Input.jsx — The reusable text input field used in every form across
 * the app (login, patient registration, appointment booking, settings, etc.).
 *
 * It wraps a standard HTML `<input>` with a label, optional leading icon,
 * optional clear button, validation error display, and a hint text area.
 * `forwardRef` is used so parent components (and form libraries) can access
 * the underlying DOM element directly if needed.
 */

import { forwardRef } from 'react';

/*
 * Input props:
 *  - label: text shown above the field
 *  - error: validation error string shown in red below the field
 *  - hint: helper text shown below the field when there is no error
 *  - type: HTML input type (text, email, password, number…)
 *  - icon: optional react-icons component shown inside the left edge
 *  - clearable: shows an X button on the right when the field has a value
 *  - onClear: callback invoked when the X button is clicked
 *  - required: adds a red asterisk after the label
 *  - className: extra Tailwind classes merged onto the `<input>` element
 */
const Input = forwardRef(
  (
    {
      label,
      error,
      hint,
      type = 'text',
      placeholder,
      disabled = false,
      required = false,
      icon: Icon,
      clearable = false,
      onClear,
      value,
      onChange,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {/* Only render the label element when a label string was provided */}
        {label && (
          <label className="block text-sm font-semibold text-secondary-700 mb-2">
            {label}
            {/* Red asterisk to signal a required field */}
            {required && <span className="text-danger ml-1">*</span>}
          </label>
        )}

        {/* `relative` wrapper lets the icon and clear button be positioned
            inside the input using absolute positioning */}
        <div className="relative">
          {/* Leading icon — only rendered when an icon component is passed */}
          {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" size={20} />}

          <input
            ref={ref}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            value={value}
            onChange={onChange}
            className={`
              w-full px-4 py-3 ${Icon ? 'pl-10' : ''} border border-secondary-200 rounded-lg
              text-secondary-900 placeholder-secondary-400
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              hover:border-secondary-300
              disabled:bg-secondary-50 disabled:cursor-not-allowed
              ${error ? 'border-danger ring-1 ring-danger' : ''}
              ${className}
            `}
            {...props}
          />

          {/* Clear button — only shown when `clearable` is true AND the field
              has a value; clicking it calls `onClear` to reset the value */}
          {clearable && value && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600 transition-colors"
              aria-label="Clear input"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Error message takes priority over the hint text */}
        {error && <p className="text-sm text-danger mt-1">{error}</p>}
        {hint && !error && <p className="text-sm text-secondary-500 mt-1">{hint}</p>}
      </div>
    );
  }
);

// Setting displayName makes this component show as "Input" in React DevTools
// instead of the generic "ForwardRef" label.
Input.displayName = 'Input';

export default Input;
