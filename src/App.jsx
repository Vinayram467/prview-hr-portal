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
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />

        <Route
          path="/employees"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <Employees />
            </ProtectedRoute>
          }
        />

        <Route path="/attendance" element={<Attendance />} />
        <Route path="/leaves" element={<Leaves />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/payroll" element={<Payroll />} />

        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <Reports />
            </ProtectedRoute>
          }
        />

        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
