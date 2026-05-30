/**
 * main.jsx — Entry point of the Burjeel Smart Care application.
 * This is the very first file React runs. It mounts the entire app onto the
 * HTML page and wraps it with all the global "providers" that share data
 * across every component in the project.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AlertProvider } from './contexts/AlertContext';
import App from './App';
import './index.css';

// Find the <div id="root"> element in index.html — React will render everything inside it.
const root = document.getElementById('root');

/*
 * ReactDOM.createRoot starts React on the page.
 * The nested providers below follow the "Context" pattern — each provider
 * makes its data (auth state, alerts) available to every child component
 * without passing props manually through every level of the tree.
 *
 * The order matters: outer providers are available to inner ones.
 * React.StrictMode activates extra development warnings to catch bugs early.
 * Router enables URL-based navigation (e.g. /login, /admin/dashboard).
 */
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <Router>
      {/* AuthProvider shares login/logout state with the whole app */}
      <AuthProvider>
        {/* AlertProvider shares toast/banner notifications with the whole app */}
        <AlertProvider>
          <App />
        </AlertProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
