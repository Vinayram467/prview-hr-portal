import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/layout/ProtectedRoute";

import { ROLES } from "./context/AuthContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import EmployeeDetails from "./pages/EmployeeDetails";
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
      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* Protected application */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route path="/" element={<Dashboard />} />

        {/* Employees */}
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

        {/* Individual employee */}
        <Route
          path="/employees/:employeeId"
          element={
            <ProtectedRoute
              allowedRoles={[ROLES.ADMIN, ROLES.HR]}
            >
              <EmployeeDetails />
            </ProtectedRoute>
          }
        />

        {/* Attendance */}
        <Route path="/attendance" element={<Attendance />} />

        {/* Breaks */}
        <Route path="/breaks" element={<Breaks />} />

        {/* Leaves */}
        <Route path="/leaves" element={<Leaves />} />

        {/* Tasks */}
        <Route path="/tasks" element={<Tasks />} />

        {/* Daily reports */}
        <Route
          path="/daily-report"
          element={<DailyReport />}
        />

        {/* Employee planning */}
        <Route
          path="/my-plans"
          element={<MyPlans />}
        />

        {/* Employee progress */}
        <Route
          path="/my-progress"
          element={<MyProgress />}
        />

        {/* Payroll */}
        <Route path="/payroll" element={<Payroll />} />

        {/* Analytics */}
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

        {/* Settings */}
        <Route path="/settings" element={<Settings />} />

        {/* Old route kept for compatibility */}
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

      {/* Unknown route */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}