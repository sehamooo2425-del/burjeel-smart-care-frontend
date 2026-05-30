/*
 * useAuth.js — Custom hook for accessing authentication state and actions.
 *
 * Instead of importing AuthContext directly in every component, components call
 * `useAuth()` to get the current user, login/logout functions, and auth status.
 * This keeps auth logic centralised and makes components easier to read.
 */

import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/*
 * useAuth — Returns the authentication context value (user, token, login, logout, etc.).
 * Throws an error if called outside of an <AuthProvider> wrapper, which helps catch
 * setup mistakes early during development.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  // Ensure this hook is only used inside a component tree wrapped by AuthProvider.
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
