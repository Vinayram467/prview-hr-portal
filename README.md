# TalentFlow HR — React HR Dashboard Template

A full HR dashboard template built with **React + Vite + Tailwind CSS**,
featuring role-based access (Admin / HR / Employee), dark mode, and a
responsive layout. All data is demo data stored in `localStorage` — swap
it for real API calls when you're ready to ship.

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

To build for production:

```bash
npm run build
npm run preview   # serve the production build locally
```

## Demo login

There's no real backend — the login screen lets you pick a role:

- **Admin** — full access to everything, including deleting employees
- **HR** — manage employees, attendance, leaves, payroll (view only), reports
- **Employee** — personal dashboard, check in/out, request leave, view own payslip

Switch roles anytime from the avatar menu (top right → "Switch role / Log out").

## Project structure

```
src/
  context/       AuthContext, ThemeContext, DataContext (all state lives here)
  data/          mockData.js — all seed/demo data in one place
  components/
    layout/      Sidebar, Topbar, Layout, ProtectedRoute
    ui/          StatCard, Badge, Modal
    charts/      Recharts wrappers (line, pie, bar)
  pages/         Login, Dashboard, Employees, Attendance, Leaves, Payroll, Reports
```

## What's implemented

- **Dashboard** — company-wide stats & charts for Admin/HR, a personalized
  view (today's status, leave balance, latest payslip) for Employees
- **Employees** — search, filter by department, add/edit, delete (Admin only)
- **Attendance** — check-in/out for employees, full team log with filters for Admin/HR
- **Leaves** — request form for employees, approve/reject queue for Admin/HR
- **Payroll** — editable (Admin), read-only (HR), own payslip only (Employee)
- **Tasks** — Admin/HR assign, edit, and delete tasks for any employee; Employees see only their own tasks and update status (To Do / In Progress / Done)
- **Reports** — headcount, attendance trend, payroll cost trend, leave breakdown
- **Dark mode** — persisted, toggle in the top bar
- **Responsive** — sidebar collapses into a mobile drawer under `lg` breakpoint

## Customizing for your buyer / your own brand

1. **Brand name & colors** — `src/data/mockData.js` has no branding; the name
   "TalentFlow HR" lives in `index.html`, `Sidebar.jsx`, and `Login.jsx`. Colors are
   defined once in `tailwind.config.js` under `theme.extend.colors.brand`.
2. **Demo data** — everything seeds from `src/data/mockData.js`. Replace it
   with your own employees/departments before making screenshots for a
   marketplace listing.
3. **Connecting a real backend** — the `DataContext` and `AuthContext` are
   the only two files that touch `localStorage`. Replace their internals with
   `fetch`/API calls and the rest of the app doesn't need to change.
4. **Reset demo data** — `useData()` exposes a `resetDemoData()` function if
   you want to add a "Reset demo" button anywhere in the UI.

## Notes for reselling this template

- This is a **frontend-only** template — there's no server, database, or real
  authentication. Say so clearly in your listing; buyers expect this for
  admin dashboard templates but it should never be a surprise.
- Before publishing to a marketplace (ThemeForest, Gumroad, etc.), run
  `npm run build` once yourself to confirm it builds clean, and include a
  few screenshots of each page in both light and dark mode.
- Consider adding a second color theme (a "swap the brand color" demo) —
  buyers of dashboard templates often ask for this and it's a five-minute
  change given the token setup in `tailwind.config.js`.
