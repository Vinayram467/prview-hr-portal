import { NavLink } from "react-router-dom";
import { ROLES } from "../../context/AuthContext";

const NAV_ITEMS = [
  {
    to: "/",
    label: "Dashboard",
    icon: "▦",
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE],
  },

  {
    to: "/employees",
    label: "Employees",
    icon: "👥",
    roles: [ROLES.ADMIN, ROLES.HR],
  },

  {
    to: "/attendance",
    label: "Attendance",
    icon: "🕒",
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE],
  },

  {
    to: "/tasks",
    label: "Tasks",
    icon: "✅",
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE],
  },

  {
    to: "/breaks",
    label: "Breaks",
    icon: "☕",
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE],
  },

  {
    to: "/daily-report",
    label: "Daily Reports",
    icon: "📝",
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE],
  },

  {
    to: "/analytics",
    label: "Analytics",
    icon: "📊",
    roles: [ROLES.ADMIN, ROLES.HR],
  },

  {
    to: "/leaves",
    label: "Leaves",
    icon: "📅",
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE],
  },

  {
    to: "/payroll",
    label: "Payroll",
    icon: "💰",
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE],
  },

  {
    to: "/settings",
    label: "Settings",
    icon: "⚙️",
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE],
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
        bg-white dark:bg-ink-900
        border-r border-ink-100 dark:border-ink-800
        transform transition-transform duration-200
        ${
          open
            ? "translate-x-0"
            : "-translate-x-full"
        }
        lg:translate-x-0`}
      >
        <div className="flex items-center gap-3 h-16 px-5 border-b border-ink-100 dark:border-ink-800">
          <img
            src="/prview-logo.png"
            alt="PRview"
            className="h-9 w-auto max-w-[150px] object-contain"
          />

          <span className="sr-only">
            PRview PR & Marketing Agency
          </span>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100%-7rem)]">
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
              <span
                className="w-5 text-center"
                aria-hidden="true"
              >
                {item.icon}
              </span>

              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900">
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400">
            PRview PR & Marketing Agency
          </p>

          <p className="mt-0.5 text-xs text-ink-400">
            Employee Management Portal
          </p>
        </div>
      </aside>
    </>
  );
}