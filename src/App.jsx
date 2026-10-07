import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

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
        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/employees"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.ADMIN,
                ROLES.HR,
              ]}
            >
              <Employees />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employees/:employeeId"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.ADMIN,
                ROLES.HR,
              ]}
            >
              <EmployeeDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/attendance"
          element={<Attendance />}
        />

        <Route
          path="/breaks"
          element={<Breaks />}
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
          path="/daily-report"
          element={<DailyReport />}
        />

        <Route
          path="/my-plans"
          element={<MyPlans />}
        />

        <Route
          path="/my-progress"
          element={<MyProgress />}
        />

        <Route
          path="/payroll"
          element={<Payroll />}
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.ADMIN,
                ROLES.HR,
              ]}
            >
              <Analytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={<Settings />}
        />

        {/* Old route kept for compatibility */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.ADMIN,
                ROLES.HR,
              ]}
            >
              <Navigate
                to="/analytics"
                replace
              />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}