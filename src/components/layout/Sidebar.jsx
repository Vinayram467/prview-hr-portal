import { NavLink } from "react-router-dom";
import { ROLES } from "../../context/AuthContext";

const NAV_ITEMS = [
  {
    to: "/",
    label: "Dashboard",
    icon: "▦",
    roles: [
      ROLES.ADMIN,
      ROLES.HR,
      ROLES.EMPLOYEE,
    ],
  },
  {
    to: "/employees",
    label: "Employees",
    icon: "👥",
    roles: [
      ROLES.ADMIN,
      ROLES.HR,
    ],
  },
  {
    to: "/attendance",
    label: "Attendance",
    icon: "🕒",
    roles: [
      ROLES.ADMIN,
      ROLES.HR,
      ROLES.EMPLOYEE,
    ],
  },
  {
    to: "/tasks",
    label: "Tasks",
    icon: "✅",
    roles: [
      ROLES.ADMIN,
      ROLES.HR,
      ROLES.EMPLOYEE,
    ],
  },
  {
    to: "/daily-reports",
    label: "Daily Reports",
    icon: "📝",
    roles: [
      ROLES.ADMIN,
      ROLES.HR,
      ROLES.EMPLOYEE,
    ],
  },
  {
    to: "/my-plans",
    label: "My Plans",
    icon: "🎯",
    roles: [
      ROLES.ADMIN,
      ROLES.HR,
      ROLES.EMPLOYEE,
    ],
  },
  {
    to: "/analytics",
    label: "Analytics",
    icon: "📈",
    roles: [
      ROLES.ADMIN,
      ROLES.HR,
    ],
  },
  {
    to: "/leaves",
    label: "Leaves",
    icon: "📅",
    roles: [
      ROLES.ADMIN,
      ROLES.HR,
      ROLES.EMPLOYEE,
    ],
  },
  {
    to: "/payroll",
    label: "Payroll",
    icon: "💰",
    roles: [
      ROLES.ADMIN,
      ROLES.HR,
      ROLES.EMPLOYEE,
    ],
  },
  {
    to: "/reports",
    label: "Reports",
    icon: "📊",
    roles: [
      ROLES.ADMIN,
      ROLES.HR,
    ],
  },
  {
    to: "/settings",
    label: "Settings",
    icon: "⚙️",
    roles: [
      ROLES.ADMIN,
      ROLES.HR,
      ROLES.EMPLOYEE,
    ],
  },
];

export default function Sidebar({
  role,
  open,
  onClose,
}) {
  const items = NAV_ITEMS.filter((item) =>
    item.roles.includes(role)
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink-950/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed z-50 top-0 left-0 h-full w-64 shrink-0
        bg-white dark:bg-ink-900 border-r border-ink-100 dark:border-ink-800
        transform transition-transform duration-200
        ${
          open
            ? "translate-x-0"
            : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex items-center gap-3 h-16 px-5 border-b border-ink-100 dark:border-ink-800">
          <img
            src="/prview-logo.png"
            alt="PRview"
            className="h-9 w-auto max-w-[120px] object-contain"
          />

          <span className="font-display text-lg font-semibold text-ink-900 dark:text-white">
            PRview
          </span>
        </div>

        <nav className="h-[calc(100%-128px)] overflow-y-auto p-3 space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                    : "text-ink-600 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800"
                }`
              }
            >
              <span aria-hidden="true">
                {item.icon}
              </span>

              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
          <p className="text-xs text-ink-400">
            PRview Employee Portal
          </p>

          <p className="text-xs text-ink-400">
            v1.0 — prototype
          </p>
        </div>
      </aside>
    </>
  );
}