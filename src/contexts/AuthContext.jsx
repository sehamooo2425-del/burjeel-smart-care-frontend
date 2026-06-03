/**
 * AuthContext.jsx — Global authentication state for the entire application.
 * This file creates a React Context that stores the logged-in user, their token,
 * and helper functions (login, logout, register, updateUser). Any component can
 * read or update auth state by consuming this context via the useAuth hook.
 */
import { createContext, useReducer, useCallback, useEffect } from 'react';
import * as authService from '../services/authService';

// Create the context object. Components import this and pass it to useContext()
// to access the auth data. AuthProvider (below) fills it with real values.
export const AuthContext = createContext();

/**
 * initialState defines the shape of auth data before anything is loaded.
 * loading starts as true so the app shows a spinner while checking for a
 * saved session in localStorage.
 */
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

/**
 * authReducer is a pure function that takes the current state and an action,
 * then returns a new state. This is the "reducer" pattern — instead of mutating
 * state directly, you dispatch an action with a type and optional payload.
 * useReducer (below) calls this function automatically on every dispatch().
 */
function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_START':
      // Show a loading indicator and clear any previous error while the request is in flight.
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      // Store the returned user object and JWT token; mark the user as authenticated.
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case 'LOGIN_ERROR':
      // Store the error message so the UI can display it to the user.
      return { ...state, loading: false, error: action.payload };
    case 'LOGOUT':
      // Reset to initialState but keep loading:false so the login page shows immediately.
      return { ...initialState, loading: false };
    case 'RESTORE_TOKEN':
      // !! converts the token value to a boolean (true if token exists, false if null/undefined).
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
        isAuthenticated: !!action.payload.token,
        loading: false,
      };
    case 'RESTORE_TOKEN_ERROR':
      // No saved session was found; stop loading so the login page can be shown.
      return { ...state, loading: false };
    case 'UPDATE_USER':
      // Merge only the changed fields into the existing user object.
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
}

/**
 * AuthProvider wraps the app (in main.jsx) and makes auth state available to
 * every component inside it. "children" refers to all nested components.
 */
export function AuthProvider({ children }) {
  // useReducer is like useState but for complex state objects.
  // state holds all auth data; dispatch() is used to trigger state changes.
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * On first render, check localStorage for a previously saved token and user.
   * If found, restore the session so the user does not need to log in again
   * after a page refresh. The empty dependency array [] means this runs once.
   */
  useEffect(() => {
    const bootstrapAsync = async () => {
      // localStorage persists data across browser sessions (survives page refresh).
      const token = localStorage.getItem('authToken');
      const user = localStorage.getItem('user');

      if (token && user) {
        try {
          dispatch({
            type: 'RESTORE_TOKEN',
            // localStorage stores strings, so JSON.parse converts the user string back to an object.
            payload: { token, user: JSON.parse(user) },
          });
        } catch (e) {
          // JSON.parse failed (corrupted data) — treat it as no session.
          dispatch({ type: 'RESTORE_TOKEN_ERROR' });
        }
      } else {
        // No saved session found; stop loading so the login page can render.
        dispatch({ type: 'RESTORE_TOKEN_ERROR' });
      }
    };

    bootstrapAsync();
  }, []);

  /**
   * login sends the email and password to the API, then stores the returned
   * token and user in localStorage so they survive a page refresh.
   * useCallback ensures this function is not recreated on every render,
   * which prevents unnecessary re-renders in child components.
   */
  // totpCode is only passed on the second login attempt when the user has 2FA enabled.
  const login = useCallback(async (username, password, totpCode = null) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authService.login(username, password, totpCode);
      const { user, access_token } = response;

      localStorage.setItem('authToken', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token: access_token } });
      return { success: true };
    } catch (error) {
      // The backend signals "2FA code required" with a 401 and a detail that mentions totp_code.
      // In that case we tell the login page to show the TOTP step instead of a generic error.
      const detail = error?.detail || '';
      if (detail.toLowerCase().includes('totp_code') || detail.toLowerCase().includes('2fa')) {
        dispatch({ type: 'LOGIN_ERROR', payload: null });
        return { success: false, requires2FA: true };
      }
      const msg = detail || error?.message || 'Login failed';
      dispatch({ type: 'LOGIN_ERROR', payload: msg });
      return { success: false, error: msg };
    }
  }, []);

  /**
   * logout calls the API to invalidate the server-side session, then always
   * removes local data regardless of whether the API call succeeds (via finally).
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      // Remove saved credentials so the user cannot restore their session after logout.
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  /**
   * register sends new account details to the API. On success it clears any
   * error state; on failure it surfaces the error so the signup form can show it.
   * Note: registration does NOT automatically log the user in.
   */
  const register = useCallback(async (userData) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      await authService.register(userData);
      // Clear the error field — reusing LOGIN_ERROR with null payload acts as a reset.
      dispatch({ type: 'LOGIN_ERROR', payload: null });
      return { success: true };
    } catch (error) {
      dispatch({
        type: 'LOGIN_ERROR',
        payload: error.message || 'Registration failed',
      });
      return { success: false, error: error.message || 'Registration failed' };
    }
  }, []);

  /**
   * updateUser merges partial profile changes (e.g. a new name) into the existing
   * user object and keeps localStorage in sync so the data survives a refresh.
   * state.user is listed as a dependency so the callback always sees the latest user.
   */
  const updateUser = useCallback((userData) => {
    const updatedUser = { ...state.user, ...userData };
    // Overwrite the user entry in localStorage with the merged data.
    localStorage.setItem('user', JSON.stringify(updatedUser));
    dispatch({ type: 'UPDATE_USER', payload: userData });
  }, [state.user]);

  return (
    /*
     * AuthContext.Provider makes everything in "value" available to any
     * component that calls useContext(AuthContext) or the useAuth() hook.
     * ...state spreads all state fields (user, token, isAuthenticated, etc.)
     * alongside the action functions so consumers get one unified object.
     */
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        register,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
