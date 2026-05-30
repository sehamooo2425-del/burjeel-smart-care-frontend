/*
 * SignupPage.jsx
 * This is the account registration page for Burjeel Smart Care.
 * New users (patients only — doctors and admins are created by admins) fill in this form
 * to create their account and are then redirected to the login page.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useContext } from 'react';
import { AlertContext } from '../contexts/AlertContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import { validateEmail, validatePassword, validateRequired } from '../utils/validators';
import { FiMail, FiLock, FiUser, FiUserPlus } from 'react-icons/fi';
import { APP_CONFIG } from '../utils/constants';

export default function SignupPage() {
  // formData collects all the fields needed to create a new account.
  // The role is pre-set to 'patient' because only patients self-register.
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
  });
  // errors stores field-level validation messages shown beneath each input.
  const [errors, setErrors] = useState({});
  // loading is true while the registration API call is running.
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { error: showError, success: showSuccess } = useContext(AlertContext);

  // Validates all form fields before submitting. Returns true if everything is valid.
  const validateForm = () => {
    const newErrors = {};

    if (!validateRequired(formData.username)) {
      newErrors.username = 'Username is required';
    }

    if (!validateRequired(formData.email)) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!validateRequired(formData.password)) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Extra check: both password fields must match before we allow submission.
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handles the form submission: prevents page reload, validates, then calls the register API.
  // On success the user is sent to /login to sign in with their new credentials.
  const handleSubmit = async (e) => {
    // Prevents the default browser form-submit behaviour (page refresh).
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      if (result.success) {
        showSuccess('Account created successfully! Please login.');
        navigate('/login');
      } else {
        showError(result.error || 'Signup failed');
      }
    } catch (err) {
      showError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Keeps formData in sync as the user types into any input field.
  // Also clears the error for that specific field while the user is editing it.
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
              B
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">{APP_CONFIG.NAME}</h1>
          <p className="text-primary-100">Create your account</p>
        </div>

        <Card className="shadow-2xl animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="text-2xl font-bold text-secondary-900 mb-6">Sign Up</h2>

            <Input
              label="Username"
              type="text"
              name="username"
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleInputChange}
              error={errors.username}
              icon={FiUser}
              required
            />

            <Input
              label="Email Address"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              icon={FiMail}
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              error={errors.password}
              icon={FiLock}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={errors.confirmPassword}
              icon={FiLock}
              required
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-secondary-700">Account Type</label>
              <div className="grid grid-cols-1 gap-3">
                <label className="flex items-center p-3 border border-secondary-200 rounded-lg cursor-pointer hover:border-primary-400 transition-colors">
                  <input
                    type="radio"
                    name="role"
                    value="patient"
                    checked={formData.role === 'patient'}
                    onChange={handleInputChange}
                    className="mr-3 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-secondary-700">Patient</span>
                </label>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              icon={FiUserPlus}
            >
              Create Account
            </Button>

            <div className="text-center">
              <p className="text-secondary-600 text-sm">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </Card>

        <p className="text-center text-primary-100 text-sm mt-8">
          © 2024 {APP_CONFIG.NAME}. All rights reserved.
        </p>
      </div>
    </div>
  );
}
