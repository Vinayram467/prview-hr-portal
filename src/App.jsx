import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import { ROLES } from "./context/AuthContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Tasks from "./pages/Tasks";
import Reports from "./pages/Reports";
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

        {/* ================= ADMIN ================= */}

        <Route
          path="/employees"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <Employees />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* ================= SHARED ================= */}

        <Route path="/attendance" element={<Attendance />} />

        <Route path="/tasks" element={<Tasks />} />

        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}