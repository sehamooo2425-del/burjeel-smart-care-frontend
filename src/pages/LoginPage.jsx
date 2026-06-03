/*
 * LoginPage.jsx
 * This is the login page for Burjeel Smart Care.
 * It is the first screen all users (admin, doctor, patient) see before accessing the app.
 * It collects a username and password, validates them, then calls the login API.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useContext } from 'react';
import { AlertContext } from '../contexts/AlertContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { validateRequired, validatePassword } from '../utils/validators';
import { FiUser, FiLock, FiMail } from 'react-icons/fi';
import { APP_CONFIG } from '../utils/constants';
import api from '../services/api';

export default function LoginPage() {
  // formData holds the current values typed into the username and password fields.
  const [formData, setFormData] = useState({ username: '', password: '' });
  // errors stores validation messages (e.g. "Password is required") shown under each field.
  const [errors, setErrors] = useState({});
  // loading is true while the login request is in progress, which disables the submit button.
  const [loading, setLoading] = useState(false);
  // Forgot-password modal state.
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { error: showError, success: showSuccess } = useContext(AlertContext);

  // Checks that username is filled in and password meets the minimum length rule.
  // Returns true if everything is valid, false otherwise (and populates `errors`).
  const validateForm = () => {
    const newErrors = {};

    if (!validateRequired(formData.username)) {
      newErrors.username = 'Username is required';
    }

    if (!validateRequired(formData.password)) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    // Object.keys(newErrors).length === 0 means there are no errors — form is valid.
    return Object.keys(newErrors).length === 0;
  };

  // Called when the user clicks "Sign In". Prevents the default browser form submission,
  // validates the fields, then sends the credentials to the backend login API.
  const handleSubmit = async (e) => {
    // Stops the browser from refreshing the page on form submit.
    e.preventDefault();

    // Stop early if validation fails — don't bother calling the API.
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await login(formData.username, formData.password);

      if (result.success) {
        showSuccess('Login successful!');
        // Redirect to the home/dashboard page after a successful login.
        navigate('/');
      } else {
        showError(result.error || 'Login failed');
      }
    } catch (err) {
      showError(err.message || 'An error occurred');
    } finally {
      // Always turn off the loading spinner when the request finishes, success or not.
      setLoading(false);
    }
  };

  // Submits the forgot-password request to the backend.
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { showError('Please enter your email address'); return; }
    setForgotLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail.trim().toLowerCase() });
      setForgotSent(true);
    } catch (err) {
      showError(err.detail || err.message || 'Something went wrong. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Resets the forgot-password modal back to its initial state when closed.
  const handleForgotClose = () => {
    setShowForgot(false);
    setForgotEmail('');
    setForgotSent(false);
  };

  // Updates the matching field inside formData whenever the user types in an input.
  // Also clears the error message for that field so it disappears while the user is fixing it.
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Spread operator (...prev) keeps all existing fields and only overwrites the changed one.
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // If there was an error for this field, clear it now that the user is editing.
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 flex items-center justify-center p-4">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Title */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
              B
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">{APP_CONFIG.NAME}</h1>
          <p className="text-primary-100">Intelligent Patient Management System</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-secondary-900 mb-6">Sign In</h2>

            {/* Username Field */}
            <Input
              label="Username"
              type="text"
              name="username"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleInputChange}
              error={errors.username}
              icon={FiUser}
              required
            />

            {/* Password Field */}
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

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-secondary-700">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              Sign In
            </Button>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-secondary-600 text-sm">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-primary-100 text-sm mt-8">
          © 2024 {APP_CONFIG.NAME}. All rights reserved.
        </p>
      </div>

      {/* Forgot Password Modal */}
      <Modal isOpen={showForgot} onClose={handleForgotClose} title="Reset Password">
        {forgotSent ? (
          <div className="text-center space-y-4 py-2">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <FiMail className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-secondary-900">Check your inbox</h3>
            <p className="text-secondary-600 text-sm">
              If an account is registered with <strong>{forgotEmail}</strong>, a temporary password has been sent.
              Log in with it and change your password immediately from Account Settings.
            </p>
            <Button variant="primary" onClick={handleForgotClose} className="w-full">
              Back to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <p className="text-secondary-600 text-sm">
              Enter the email address linked to your account. We'll send you a temporary password you can use to log in.
            </p>
            <Input
              label="Email Address"
              type="email"
              placeholder="your@email.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              icon={FiMail}
              required
            />
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleForgotClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={forgotLoading} className="flex-1">
                Send Temporary Password
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
