import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/layout/ProtectedRoute";

import { ROLES } from "./context/AuthContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Breaks from "./pages/Breaks";
import Leaves from "./pages/Leaves";
import Tasks from "./pages/Tasks";
import DailyReport from "./pages/DailyReport";
import MyPlans from "./pages/MyPlans";
import MyProgress from "./pages/MyProgress";
import Payroll from "./pages/Payroll";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      {/* =====================================================
          LOGIN
      ====================================================== */}
      <Route path="/login" element={<Login />} />

      {/* =====================================================
          PROTECTED APPLICATION
      ====================================================== */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* ===================================================
            DASHBOARD
        ==================================================== */}
        <Route path="/" element={<Dashboard />} />

        {/* ===================================================
            EMPLOYEES
        ==================================================== */}
        <Route
          path="/employees"
          element={
            <ProtectedRoute
              allowedRoles={[ROLES.ADMIN, ROLES.HR]}
            >
              <Employees />
            </ProtectedRoute>
          }
        />

        {/* ===================================================
            ATTENDANCE
        ==================================================== */}
        <Route
          path="/attendance"
          element={<Attendance />}
        />

        {/* ===================================================
            BREAKS
        ==================================================== */}
        <Route
          path="/breaks"
          element={<Breaks />}
        />

        {/* ===================================================
            LEAVES
        ==================================================== */}
        <Route
          path="/leaves"
          element={<Leaves />}
        />

        {/* ===================================================
            TASKS
        ==================================================== */}
        <Route
          path="/tasks"
          element={<Tasks />}
        />

        {/* ===================================================
            DAILY REPORTS
        ==================================================== */}
        <Route
          path="/daily-report"
          element={<DailyReport />}
        />

        {/* ===================================================
            MY PLANS
        ==================================================== */}
        <Route
          path="/my-plans"
          element={<MyPlans />}
        />

        {/* ===================================================
            MY PROGRESS
        ==================================================== */}
        <Route
          path="/my-progress"
          element={<MyProgress />}
        />

        {/* ===================================================
            PAYROLL
        ==================================================== */}
        <Route
          path="/payroll"
          element={<Payroll />}
        />

        {/* ===================================================
            ANALYTICS
            ADMIN / HR ONLY
        ==================================================== */}
        <Route
          path="/analytics"
          element={
            <ProtectedRoute
              allowedRoles={[ROLES.ADMIN, ROLES.HR]}
            >
              <Analytics />
            </ProtectedRoute>
          }
        />

        {/* ===================================================
            SETTINGS
        ==================================================== */}
        <Route
          path="/settings"
          element={<Settings />}
        />

        {/* ===================================================
            OLD REPORTS URL
            Keep old bookmarks working.
        ==================================================== */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute
              allowedRoles={[ROLES.ADMIN, ROLES.HR]}
            >
              <Navigate
                to="/analytics"
                replace
              />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* =====================================================
          FALLBACK
      ====================================================== */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}
