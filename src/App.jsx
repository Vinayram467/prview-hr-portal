import { Routes, Route } from "react-router-dom";

import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import { ROLES } from "./context/AuthContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Leaves from "./pages/Leaves";
import Tasks from "./pages/Tasks";
import Payroll from "./pages/Payroll";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import DailyReports from "./pages/DailyReports";
import MyPlans from "./pages/MyPlans";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}

        <Route
          path="/"
          element={<Dashboard />}
        />

        {/* Admin only */}

        <Route
          path="/employees"
          element={
            <ProtectedRoute
              allowedRoles={[ROLES.ADMIN]}
            >
              <Employees />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute
              allowedRoles={[ROLES.ADMIN]}
            >
              <Analytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute
              allowedRoles={[ROLES.ADMIN]}
            >
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* Admin + Employee */}

        <Route
          path="/attendance"
          element={<Attendance />}
        />

        <Route
          path="/leaves"
          element={<Leaves />}
        />

        <Route
          path="/tasks"
          element={<Tasks />}
        />

        <Route
          path="/payroll"
          element={<Payroll />}
        />

        <Route
          path="/daily-reports"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.ADMIN,
                ROLES.EMPLOYEE,
              ]}
            >
              <DailyReports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-plans"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.ADMIN,
                ROLES.EMPLOYEE,
              ]}
            >
              <MyPlans />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={<Settings />}
        />
      </Route>
    </Routes>
  );
}