/*
 * validators.js — Pure functions that return true/false (or an error object) to check inputs.
 *
 * Keeping validation logic here rather than inside form components means the same rules
 * can be reused across multiple forms, tested in isolation, and updated in one place.
 * None of these functions modify state or call the API — they only inspect a value and report.
 */

/*
 * validateEmail — Checks whether a string looks like a valid email address.
 * Uses a regex that ensures there is text before and after a single "@" and a dot.
 * @param {string} email - The email address string to validate.
 * @returns {boolean} true if the format is valid, false otherwise.
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/*
 * validatePassword — Checks the bare minimum requirement: password must exist and be 8+ chars.
 * @param {string} password - The password to check.
 * @returns {boolean} true if the password meets the minimum length, false otherwise.
 */
export const validatePassword = (password) => {
  return password && password.length >= 8;
};

/*
 * validatePasswordStrength — Scores a password across six criteria and assigns a level.
 * Each passing criterion adds 1 point; the final level is 'weak', 'medium', or 'strong'.
 * @param {string} password - The password to score.
 * @returns {{ score: number, level: string }} Score (0-6) and a text level label.
 */
export const validatePasswordStrength = (password) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password)) strength++;  // Contains at least one uppercase letter.
  if (/[a-z]/.test(password)) strength++;  // Contains at least one lowercase letter.
  if (/\d/.test(password)) strength++;     // Contains at least one digit.
  if (/[^A-Za-z0-9]/.test(password)) strength++; // Contains at least one special character.

  return {
    score: strength,
    // Ternary chaining: if score is 0-2 -> 'weak', 3-4 -> 'medium', 5-6 -> 'strong'.
    level: strength <= 2 ? 'weak' : strength <= 4 ? 'medium' : 'strong',
  };
};

/*
 * validatePhoneNumber — Checks that a phone number contains at least 10 digits.
 * Allows common formatting characters (spaces, dashes, parentheses, "+") in the input.
 * @param {string} phone - The phone number string to validate.
 * @returns {boolean} true if the number is long enough and uses valid characters.
 */
export const validatePhoneNumber = (phone) => {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  // Strip whitespace before testing so spaces between digits don't inflate the length count.
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/*
 * validateRequired — Ensures a field has a non-empty, non-whitespace value.
 * @param {string} value - The form field value to check.
 * @returns {boolean} true if the value is present and not blank.
 */
export const validateRequired = (value) => {
  return value && value.trim() !== '';
};

/*
 * validateMinLength — Checks that a string is at least `minLength` characters long.
 * @param {string} value     - The string to check.
 * @param {number} minLength - The minimum number of characters required.
 * @returns {boolean} true if the string meets the minimum length.
 */
export const validateMinLength = (value, minLength) => {
  return value && value.length >= minLength;
};

/*
 * validateMaxLength — Checks that a string does not exceed `maxLength` characters.
 * @param {string} value     - The string to check.
 * @param {number} maxLength - The maximum number of characters allowed.
 * @returns {boolean} true if the string is within the maximum length.
 */
export const validateMaxLength = (value, maxLength) => {
  return value && value.length <= maxLength;
};

/*
 * validateUrl — Returns true if the string is a syntactically valid URL.
 * Uses the browser's native URL constructor, which throws on invalid input.
 * @param {string} url - The URL string to validate.
 * @returns {boolean} true if the URL can be parsed, false if not.
 */
export const validateUrl = (url) => {
  try {
    // `new URL(url)` throws a TypeError if the string is not a valid URL.
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/*
 * validateDateRange — Ensures that startDate is not after endDate.
 * @param {string|Date} startDate - The beginning of the range.
 * @param {string|Date} endDate   - The end of the range.
 * @returns {boolean} true if the range is valid (start <= end).
 */
export const validateDateRange = (startDate, endDate) => {
  return new Date(startDate) <= new Date(endDate);
};

/*
 * validateFutureDate — Checks that the given date is in the future.
 * Useful for validating appointment or reminder scheduling dates.
 * @param {string|Date} date - The date to check.
 * @returns {boolean} true if the date is strictly after now.
 */
export const validateFutureDate = (date) => {
  return new Date(date) > new Date();
};

/*
 * validatePastDate — Checks that the given date is in the past.
 * Useful for birth-date fields or historical record entries.
 * @param {string|Date} date - The date to check.
 * @returns {boolean} true if the date is strictly before now.
 */
export const validatePastDate = (date) => {
  return new Date(date) < new Date();
};

/*
 * validateNumberRange — Checks that a numeric value falls within [min, max] inclusive.
 * @param {string|number} value - The value to check (parsed as a float).
 * @param {number}        min   - The minimum allowed value.
 * @param {number}        max   - The maximum allowed value.
 * @returns {boolean} true if the parsed number is a valid number within the range.
 */
export const validateNumberRange = (value, min, max) => {
  const num = parseFloat(value);
  // isNaN check guards against non-numeric strings that parseFloat can't interpret.
  return !isNaN(num) && num >= min && num <= max;
};

/*
 * validateFileType — Checks whether a file's MIME type is in the allowed list.
 * @param {File}     file         - The browser File object (from an <input type="file">).
 * @param {string[]} allowedTypes - Array of permitted MIME type strings (e.g. ['image/png']).
 * @returns {boolean} true if the file's type is in the allowed list.
 */
export const validateFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.type);
};

/*
 * validateFileSize — Checks that a file does not exceed a maximum size in megabytes.
 * @param {File}   file        - The browser File object.
 * @param {number} maxSizeInMB - The maximum allowed file size in megabytes.
 * @returns {boolean} true if the file is within the size limit.
 */
export const validateFileSize = (file, maxSizeInMB) => {
  // Convert megabytes to bytes (1 MB = 1024 * 1024 bytes) before comparing.
  return file.size <= maxSizeInMB * 1024 * 1024;
};

/*
 * validateEmiratesId — Validates the format of a UAE Emirates ID number.
 * The required format is ###-####-######-# (e.g. 784-1990-1234567-1).
 * @param {string} id - The Emirates ID string to validate.
 * @returns {boolean} true if the string matches the expected format.
 */
export const validateEmiratesId = (id) => {
  const idRegex = /^\d{3}-\d{4}-\d{6}-\d{1}$/;
  return idRegex.test(id);
};

/*
 * validateNationalId — Basic check that a national ID string has at least 5 characters.
 * The exact format varies by country; adjust the rule here if stricter validation is needed.
 * @param {string} id - The national ID string.
 * @returns {boolean} true if the ID is present and long enough.
 */
export const validateNationalId = (id) => {
  // Generic national ID validation (adjust based on requirements)
  return id && id.length >= 5;
};

/*
 * validateMRN — Checks that a Medical Record Number (MRN) is at least 4 characters.
 * MRNs are hospital-assigned identifiers; the minimum length can be adjusted per system.
 * @param {string} mrn - The Medical Record Number string.
 * @returns {boolean} true if the MRN meets the minimum length.
 */
export const validateMRN = (mrn) => {
  // Medical Record Number validation
  return mrn && mrn.length >= 4;
};

/*
 * validateForm — Runs a set of rules against a values object and collects all errors.
 * This is the "form-level" validator — it calls the individual validators above for each
 * field and returns a plain object mapping field names to error messages.
 * @param {object} values - The current form values keyed by field name.
 * @param {object} rules  - Validation rules keyed by field name (e.g. { email: { required: true, email: true } }).
 * @returns {object} An errors object; empty ({}) means the form is valid.
 */
export const validateForm = (values, rules) => {
  const errors = {};

  Object.keys(rules).forEach((field) => {
    const rule = rules[field];
    const value = values[field];

    if (rule.required && !validateRequired(value)) {
      errors[field] = `${field} is required`;
    }

    if (rule.email && value && !validateEmail(value)) {
      errors[field] = 'Invalid email format';
    }

    if (rule.minLength && value && !validateMinLength(value, rule.minLength)) {
      errors[field] = `${field} must be at least ${rule.minLength} characters`;
    }

    if (rule.maxLength && value && !validateMaxLength(value, rule.maxLength)) {
      errors[field] = `${field} must not exceed ${rule.maxLength} characters`;
    }

    if (rule.pattern && value && !rule.pattern.test(value)) {
      errors[field] = `${field} format is invalid`;
    }

    if (rule.custom && value) {
      // `rule.custom` is a caller-supplied function that returns an error string or null/undefined.
      const customError = rule.custom(value);
      if (customError) {
        errors[field] = customError;
      }
    }
  });

  return errors;
};
