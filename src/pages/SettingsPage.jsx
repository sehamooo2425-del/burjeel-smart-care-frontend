/*
 * SettingsPage.jsx
 * This page is accessible to all logged-in users (admin, doctor, patient).
 * It lets users update their profile photo, gender, and notification preferences,
 * change their password, and optionally enable Two-Factor Authentication (2FA).
 */

import { useState, useContext, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { AuthContext } from '../contexts/AuthContext';
import { AlertContext } from '../contexts/AlertContext';
import api from '../services/api';

export default function SettingsPage() {
  // user is the currently logged-in account; login is used to update the context after avatar upload.
  const { user, login } = useContext(AuthContext);
  const { success, error: showError } = useContext(AlertContext);

  // loading is shared across all three forms to disable buttons while a request is in progress.
  const [loading, setLoading] = useState(false);

  // profileData holds the values for the "Profile Information" form section.
  // The ?? operator means "use true if the value is null or undefined".
  const [profileData, setProfileData] = useState({
    gender: user?.gender || '',
    notification_email: user?.notification_preferences?.email ?? true,
    notification_sms: user?.notification_preferences?.sms ?? true
  });

  // passwordData holds the three password fields in the "Change Password" section.
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

  // 2FA state: twoFactorUri is the TOTP provisioning URI shown to the user after setup is started.
  const [twoFactorUri, setTwoFactorUri] = useState('');
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  // twoFactorCode is the 6-digit code the user types from their authenticator app.
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // Saves gender and notification preferences to the backend profile endpoint.
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.put('/profile', {
        gender: profileData.gender,
        notification_preferences: {
          email: profileData.notification_email,
          sms: profileData.notification_sms
        }
      });
      success('Profile updated successfully!');
    } catch (err) {
      showError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Validates that the two new-password fields match, then sends the password change request.
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    // Check that the user typed the same new password in both fields before sending.
    if (passwordData.new_password !== passwordData.confirm_password) {
      showError('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.put('/profile/password', {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password
      });
      success('Password updated successfully!');
      // Clear all password fields after a successful change for security.
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      showError(err.response?.data?.detail || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  // Starts the 2FA setup process by requesting a TOTP URI from the backend.
  // The URI is then displayed for the user to scan with an authenticator app.
  const setup2FA = async () => {
    setLoading(true);
    try {
      const response = await api.post('/auth/2fa/setup');
      // Store the provisioning URI and secret returned by the backend.
      setTwoFactorUri(response.data.uri);
      setTwoFactorSecret(response.data.secret);
    } catch (err) {
      showError(err.response?.data?.detail || 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  // Verifies the 6-digit TOTP code the user typed from their authenticator app.
  // If the code is correct, 2FA is enabled on the account.
  const verify2FA = async () => {
    setLoading(true);
    try {
      // The code is passed as a query parameter in the URL.
      await api.post(`/auth/2fa/verify?code=${twoFactorCode}`);
      success('2FA enabled successfully!');
      // Clear the setup state so the 2FA form disappears now that setup is complete.
      setTwoFactorUri('');
      setTwoFactorCode('');
    } catch (err) {
      showError(err.response?.data?.detail || 'Failed to verify 2FA code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">Account Settings</h1>
        <p className="text-secondary-600">Manage your profile, security, and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <Card>
          <h2 className="text-xl font-bold text-secondary-900 mb-4">Profile Information</h2>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="flex items-center space-x-6 mb-6">
              <div className="shrink-0">
                <img
                  className="h-24 w-24 object-cover rounded-full border-4 border-primary-100"
                  src={user?.profile_picture_url || (user?.gender === 'female' ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=f9a8d4&color=831843` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=bfdbfe&color=1e3a8a`)}
                  alt="Current profile photo"
                />
              </div>
              <label className="block">
                <span className="sr-only">Choose profile photo</span>
                {/* File input for uploading a new profile photo.
                    The onChange handler immediately uploads the chosen image to the server
                    and updates the global user context so the avatar refreshes everywhere. */}
                <input type="file" accept="image/*" onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  setLoading(true);
                  try {
                    // FormData is used to send binary file data in a multipart HTTP request.
                    const formData = new FormData();
                    formData.append('file', file);
                    const res = await api.post('/profile/avatar', formData, {
                      headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    // Call login() with the updated user data to refresh the auth context
                    // so the new avatar URL is reflected across the whole app immediately.
                    login(res.data);
                    success('Profile picture updated successfully!');
                  } catch (err) {
                    showError('Failed to upload profile picture');
                  } finally {
                    setLoading(false);
                  }
                }} className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary-50 file:text-primary-700
                  hover:file:bg-primary-100 cursor-pointer
                "/>
              </label>
            </div>

            <Select
              label="Gender"
              value={profileData.gender}
              onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
              options={[
                { value: '', label: 'Select Gender' },
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
            />
            
            <div className="pt-4 border-t border-gray-100">
              <h3 className="font-semibold text-secondary-800 mb-3">Notification Preferences</h3>
              <label className="flex items-center space-x-3 mb-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={profileData.notification_email} 
                  onChange={(e) => setProfileData({ ...profileData, notification_email: e.target.checked })}
                  className="form-checkbox h-5 w-5 text-primary-600 rounded"
                />
                <span>Email Notifications</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={profileData.notification_sms} 
                  onChange={(e) => setProfileData({ ...profileData, notification_sms: e.target.checked })}
                  className="form-checkbox h-5 w-5 text-primary-600 rounded"
                />
                <span>SMS Notifications</span>
              </label>
            </div>
            
            <Button type="submit" variant="primary" disabled={loading} className="w-full">
              Save Profile
            </Button>
          </form>
        </Card>

        {/* Security & Password Card */}
        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-bold text-secondary-900 mb-4">Change Password</h2>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                value={passwordData.old_password}
                onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                required
              />
              <Input
                label="New Password"
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                required
              />
              <p className="text-xs text-secondary-500">Must be 8+ chars with uppercase, lowercase, numbers, and symbols.</p>
              <Input
                label="Confirm New Password"
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                required
              />
              <Button type="submit" variant="secondary" disabled={loading} className="w-full">
                Update Password
              </Button>
            </form>
          </Card>

          {/* 2FA Card */}
          <Card>
            <h2 className="text-xl font-bold text-secondary-900 mb-4">Two-Factor Authentication</h2>
            {/* If 2FA is already enabled, show a confirmation message.
                Otherwise show the setup flow (button → QR URI → verification code input). */}
            {user?.two_factor_enabled ? (
              <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
                <p className="font-semibold">✓ 2FA is currently enabled</p>
                <p className="text-sm mt-1">Your account is secured with two-factor authentication.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-secondary-600 text-sm">
                  Add an extra layer of security to your account by enabling Two-Factor Authentication (TOTP).
                </p>
                {/* Before setup starts, show the "Setup 2FA" button.
                    After setup starts (twoFactorUri is set), show the URI and code input. */}
                {!twoFactorUri ? (
                  <Button onClick={setup2FA} variant="primary" disabled={loading}>
                    Setup 2FA
                  </Button>
                ) : (
                  <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
                    <p className="font-medium">1. Scan this URI into your Authenticator App (like Google Authenticator):</p>
                    <code className="block p-2 bg-white border rounded text-xs break-all">{twoFactorUri}</code>
                    
                    <p className="font-medium">2. Enter the generated code below:</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="123456"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={verify2FA} disabled={loading || !twoFactorCode}>
                        Verify
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
