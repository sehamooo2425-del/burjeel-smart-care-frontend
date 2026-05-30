/*
 * AlertContainer.jsx — The fixed-position stack that displays all active
 * Alert notifications on screen at once.
 *
 * It reads the global list of alerts from AlertContext (populated by any
 * part of the app that calls the `useAlert` hook) and renders an Alert
 * component for each one. It is typically mounted once near the top of the
 * component tree (e.g. in App.jsx) so it is always visible.
 */

import { useContext } from 'react';
import { AlertContext } from '../../contexts/AlertContext';
import Alert from './Alert';

/*
 * AlertContainer pulls the current alert list and the `removeAlert`
 * function from context — no props are needed.
 */
export default function AlertContainer() {
  const { alerts, removeAlert } = useContext(AlertContext);

  return (
    // `pointer-events-none` on the container lets clicks pass through the
    // empty area; `pointer-events-auto` on each alert restores interactivity
    // so the X button and hover states still work.
    <div className="fixed top-4 right-4 z-50 max-w-md space-y-3 pointer-events-none">
      {alerts.map((alert) => (
        <div key={alert.id} className="pointer-events-auto">
          <Alert
            type={alert.type}
            message={alert.message}
            // When this alert closes, remove it from the global list by id.
            onClose={() => removeAlert(alert.id)}
            autoClose={true}
          />
        </div>
      ))}
    </div>
  );
}
