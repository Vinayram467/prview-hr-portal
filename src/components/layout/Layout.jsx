import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

import { useAuth } from "../../context/AuthContext";

const TITLES = {
  "/": "Dashboard",
  "/employees": "Employees",
  "/attendance": "Attendance",
  "/breaks": "Breaks",
  "/leaves": "Leaves",
  "/tasks": "Tasks",
  "/daily-report": "Daily Reports",
  "/my-plans": "My Plans",
  "/my-progress": "My Progress",
  "/payroll": "Payroll",
  "/analytics": "Analytics",
  "/settings": "Settings",
  "/reports": "Analytics",
};

export default function Layout() {
  const { user } = useAuth();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const location = useLocation();

  const title =
    TITLES[location.pathname] ??
    "PRview Employee Portal";

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <Sidebar
        role={user.role}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-w-0 lg:pl-64">
        <Topbar
          onMenuClick={() =>
            setSidebarOpen(true)
          }
          title={title}
        />

        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
