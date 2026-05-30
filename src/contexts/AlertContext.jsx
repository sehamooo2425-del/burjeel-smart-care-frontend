/**
 * AlertContext.jsx — Global notification/toast system for the application.
 * This context manages a list of temporary alert messages (success, error,
 * warning, info) that any component can trigger. The AlertContainer component
 * reads from this context and renders the visible banners on screen.
 */
import { createContext, useReducer, useCallback } from 'react';

// Create the context that AlertProvider will fill and components will consume.
export const AlertContext = createContext();

// The only piece of state is an array of currently visible alert objects.
const initialState = {
  alerts: [],
};

/**
 * alertReducer handles all state transitions for the alerts list.
 * Each action type corresponds to one user-visible event (adding, removing,
 * or clearing alerts).
 */
function alertReducer(state, action) {
  switch (action.type) {
    case 'ADD_ALERT':
      return {
        ...state,
        // Spread the existing alerts and append the new one.
        // Date.now() gives a unique numeric timestamp used as the alert's ID.
        alerts: [...state.alerts, { id: Date.now(), ...action.payload }],
      };
    case 'REMOVE_ALERT':
      // filter() returns a new array that excludes the alert matching the given id.
      return {
        ...state,
        alerts: state.alerts.filter((alert) => alert.id !== action.payload),
      };
    case 'CLEAR_ALERTS':
      // Reset to an empty array, dismissing all visible alerts at once.
      return { ...state, alerts: [] };
    default:
      return state;
  }
}

/**
 * AlertProvider wraps the app and makes the alerts array and helper functions
 * available to every component through AlertContext.
 */
export function AlertProvider({ children }) {
  const [state, dispatch] = useReducer(alertReducer, initialState);

  /**
   * addAlert is the core function that all other alert helpers (success, error,
   * etc.) delegate to. It adds the alert immediately and then schedules its
   * automatic removal after "duration" milliseconds.
   * Default values: type = 'info', duration = 5000 ms (5 seconds).
   */
  const addAlert = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now();
    dispatch({
      type: 'ADD_ALERT',
      payload: { message, type, id },
    });

    if (duration > 0) {
      // setTimeout fires once after the given delay and removes this specific alert by id.
      setTimeout(() => {
        dispatch({ type: 'REMOVE_ALERT', payload: id });
      }, duration);
    }

    // Return the id so callers can manually dismiss the alert before it auto-expires.
    return id;
  }, []);

  // removeAlert lets a component or the timer dismiss a specific alert by its id.
  const removeAlert = useCallback((id) => {
    dispatch({ type: 'REMOVE_ALERT', payload: id });
  }, []);

  /**
   * The four convenience helpers below (success, error, warning, info) simply
   * pre-fill the "type" argument so callers write less code.
   * e.g. success("Saved!") instead of addAlert("Saved!", "success").
   */
  const success = useCallback((message, duration) => {
    return addAlert(message, 'success', duration);
  }, [addAlert]);

  const error = useCallback((message, duration) => {
    return addAlert(message, 'error', duration);
  }, [addAlert]);

  const warning = useCallback((message, duration) => {
    return addAlert(message, 'warning', duration);
  }, [addAlert]);

  const info = useCallback((message, duration) => {
    return addAlert(message, 'info', duration);
  }, [addAlert]);

  // clearAlerts removes all visible alerts at once (e.g. when navigating to a new page).
  const clearAlerts = useCallback(() => {
    dispatch({ type: 'CLEAR_ALERTS' });
  }, []);

  return (
    /*
     * Expose the alerts array and all helper functions through the context value.
     * Any component can call e.g. const { success } = useContext(AlertContext)
     * and then success("Profile saved!") to display a green banner.
     */
    <AlertContext.Provider
      value={{
        alerts: state.alerts,
        addAlert,
        removeAlert,
        success,
        error,
        warning,
        info,
        clearAlerts,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
}
