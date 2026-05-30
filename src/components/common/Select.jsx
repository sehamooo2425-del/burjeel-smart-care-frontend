/*
 * Select.jsx — A styled dropdown (single or multi-select) used in forms
 * throughout the app — for example when choosing a doctor speciality, an
 * appointment time slot, or a report filter.
 *
 * It wraps the native HTML `<select>` element with the same label, error,
 * and hint pattern as Input.jsx, and uses `forwardRef` for the same reason
 * (so form libraries and parent components can access the DOM node directly).
 */

import { forwardRef } from 'react';

/*
 * Select props:
 *  - label: text shown above the dropdown
 *  - error: validation error string shown in red below the field
 *  - hint: helper text shown below the field when there is no error
 *  - options: array of { value, label } objects that populate the list
 *  - placeholder: the first disabled option shown before a choice is made
 *  - required: adds a red asterisk after the label
 *  - multiple: when true, allows selecting more than one option at once
 *  - className: extra Tailwind classes merged onto the `<select>` element
 */
const Select = forwardRef(
  (
    {
      label,
      error,
      hint,
      options = [],
      placeholder = 'Select an option',
      disabled = false,
      required = false,
      value,
      onChange,
      multiple = false,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {/* Only render the label when a label string was provided */}
        {label && (
          <label className="block text-sm font-semibold text-secondary-700 mb-2">
            {label}
            {/* Red asterisk to signal a required field */}
            {required && <span className="text-danger ml-1">*</span>}
          </label>
        )}

        <select
          ref={ref}
          disabled={disabled}
          value={value}
          onChange={onChange}
          multiple={multiple}
          className={`
            w-full px-4 py-3 border border-secondary-200 rounded-lg
            text-secondary-900 bg-white
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            hover:border-secondary-300
            disabled:bg-secondary-50 disabled:cursor-not-allowed
            ${error ? 'border-danger ring-1 ring-danger' : ''}
            ${className}
          `}
          {...props}
        >
          {/* The placeholder option has value="" and is disabled so the user
              cannot re-select it after making a real choice */}
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {/* Render one <option> for each item in the options array */}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Error message takes priority over hint text */}
        {error && <p className="text-sm text-danger mt-1">{error}</p>}
        {hint && !error && <p className="text-sm text-secondary-500 mt-1">{hint}</p>}
      </div>
    );
  }
);

// Setting displayName makes this show as "Select" in React DevTools.
Select.displayName = 'Select';

export default Select;
