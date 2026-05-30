# Burjeel Smart Care — Frontend

A React web application for managing patients, reminders, attendance, and communication at Burjeel Hospital. Three user roles (admin, doctor, patient) each see a tailored dashboard with only the tools relevant to their role.

---

## Tech Stack

| What | Tool |
|---|---|
| UI Framework | React 18 |
| Build Tool | Vite 5 |
| Routing | React Router v6 |
| Styling | Tailwind CSS |
| HTTP Requests | Axios |
| Charts | Recharts |
| Icons | React Icons |
| Export (CSV/Excel/PDF) | SheetJS, jsPDF, file-saver |

---

## Project Structure

```
src/
├── main.jsx              # App entry point — mounts React, wraps everything in providers
├── App.jsx               # Root component — handles routing and role-based page access
├── App.css               # Global styles
│
├── contexts/             # Shared state accessible anywhere in the app
│   ├── AuthContext.jsx   # Who is logged in, login/logout logic
│   └── AlertContext.jsx  # Toast notification system (success, error, warning)
│
├── hooks/                # Reusable logic extracted into functions
│   ├── useAuth.js        # Easy access to the auth context
│   └── useReportExport.js# CSV / Excel / PDF export logic
│
├── services/             # All API calls to the backend — one file per topic
│   ├── api.js            # Axios instance with auth token injection
│   ├── authService.js    # Login, register, get current user
│   ├── patientService.js # Create, read, update, delete patients
│   ├── attendanceService.js # Mark and fetch attendance records
│   ├── reminderService.js   # Schedule and send reminders
│   ├── reportsService.js    # Attendance analytics (used by admin dashboard)
│   ├── userService.js    # Admin user management
│   └── chatService.js    # Conversations, messages, mark-as-read
│
├── components/
│   ├── Layout/           # The shell around every page
│   │   ├── Layout.jsx    # Sidebar + navbar + content area wrapper
│   │   ├── Sidebar.jsx   # Left navigation — links change per role
│   │   ├── Navbar.jsx    # Top bar with hamburger menu
│   │   └── Footer.jsx    # Bottom bar
│   └── common/           # Reusable UI building blocks
│       ├── Alert.jsx         # Single toast notification
│       ├── AlertContainer.jsx# Renders all active toasts
│       ├── Badge.jsx         # Coloured status label
│       ├── Button.jsx        # Styled button with variants
│       ├── Card.jsx          # White box container
│       ├── ExportMenu.jsx    # Dropdown to export CSV/Excel/PDF
│       ├── Input.jsx         # Text input with icon support
│       ├── Loader.jsx        # Full-page loading spinner
│       ├── Modal.jsx         # Pop-up dialog
│       ├── Select.jsx        # Dropdown selector
│       └── Table.jsx         # Data table with striping and hover
│
├── pages/                # One file per screen
│   ├── LoginPage.jsx
│   ├── SignupPage.jsx
│   ├── AdminDashboard.jsx
│   ├── DoctorDashboard.jsx
│   ├── PatientDashboard.jsx
│   ├── PatientsPage.jsx        # Admin/doctor patient management
│   ├── DoctorManagementPage.jsx
│   ├── ReminderPage.jsx
│   ├── AttendancePage.jsx
│   ├── ReportsPage.jsx
│   ├── ChatPage.jsx
│   ├── PatientDoctorsPage.jsx
│   ├── PatientAppointments.jsx
│   └── SettingsPage.jsx
│
└── utils/                # Pure helper functions
    ├── constants.js      # App-wide fixed values
    ├── formatters.js     # Date, number, text formatting
    └── validators.js     # Form field validation rules
```

---

## How It Works

### Authentication
When a user logs in, the backend returns a JWT token. The frontend stores that token in `localStorage` and attaches it to every API request via an Axios interceptor. On page load, `AuthContext` reads the token from `localStorage` to restore the session automatically.

### Role-Based Routing
`App.jsx` checks `user.role` and only renders routes that belong to that role. An admin cannot accidentally visit a patient page and vice versa. The sidebar in `Sidebar.jsx` mirrors this — each role has its own list of navigation links.

| Role | Routes |
|---|---|
| `admin` | `/admin/dashboard`, `/admin/patients`, `/admin/doctors`, `/admin/attendance`, `/admin/reminders`, `/admin/reports`, `/admin/chat` |
| `doctor` | `/doctor/dashboard`, `/admin/patients`, `/admin/reminders`, `/admin/attendance`, `/admin/reports`, `/admin/chat` |
| `patient` | `/patient/dashboard`, `/patient/doctors`, `/patient/appointments`, `/patient/chat` |
| all roles | `/settings` |

### Chat
`ChatPage` calls `chatService` directly for all messaging operations — no intermediate context layer. Opening a conversation automatically calls `PUT /api/v1/chat/messages/read` to mark incoming messages as read and clear the unread badge.

### Reports & Analytics
`ReportsPage` fetches all raw data once on mount (patients, reminders, attendance) and applies all filtering client-side. Switching the date range preset or clicking "Apply Filters" recomputes stat cards and both charts without any additional API calls. Percentage changes compare the selected period against the equally-long period immediately before it.

### Notifications
`AlertContext` holds a list of active toast messages. Any component can call `success("Done!")` or `error("Something went wrong")` and a toast appears on screen and auto-dismisses after a few seconds.

---

## Running Locally

```bash
# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview the production build locally
npm run preview
```

The app expects the backend running at `http://localhost:8000`. Copy `.env.example` to `.env` and adjust if needed.

---

## Deployment (Vercel)

The `vercel.json` at the project root rewrites all URLs to `index.html`, which is required for React Router to work correctly when a user refreshes the page or lands directly on a route.

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

## Deployment (Docker / nginx)

The `Dockerfile` in the project root does a two-stage build: Node compiles the app, then nginx serves the `dist/` folder. The `nginx.conf` includes a `try_files` rule that handles SPA routing and proxies `/api/` requests to the backend container.

```bash
# From the backend directory (docker-compose.yml covers both services)
docker-compose up --build
```

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend API base URL (e.g. `http://localhost:8000/api/v1`) |
| `VITE_WS_URL` | WebSocket server URL (e.g. `ws://localhost:8000`) |
| `VITE_APP_NAME` | Application display name |
| `VITE_APP_VERSION` | Version shown in the sidebar footer |
