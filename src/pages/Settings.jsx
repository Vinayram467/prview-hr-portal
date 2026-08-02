import { useState } from "react";
import { useAuth, ROLES } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useData } from "../context/DataContext";
import Modal from "../components/ui/Modal";

const NOTIF_KEY = "hr-dashboard:notifications";
const COMPANY_KEY = "hr-dashboard:company";

function loadJSON(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

const ROLE_LABEL = { admin: "Admin", hr: "HR", employee: "Employee" };

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { employees, resetDemoData } = useData();
  const isAdmin = user.role === ROLES.ADMIN;
  const me = employees.find((e) => e.id === user.employeeId);

  const [notifications, setNotifications] = useState(() =>
    loadJSON(NOTIF_KEY, {
      leaveRequests: true,
      attendanceAlerts: true,
      payrollReminders: false,
      productUpdates: true,
    })
  );

  const [company, setCompany] = useState(() =>
    loadJSON(COMPANY_KEY, {
      name: "TalentFlow HR",
      workWeek: "Sunday – Thursday",
      annualLeaveDays: 21,
      sickLeaveDays: 14,
    })
  );

  const [savedNotif, setSavedNotif] = useState(false);
  const [savedCompany, setSavedCompany] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  function toggleNotif(key) {
    setNotifications((n) => ({ ...n, [key]: !n[key] }));
  }

  function saveNotifications() {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications));
    setSavedNotif(true);
    setTimeout(() => setSavedNotif(false), 1800);
  }

  function saveCompany(e) {
    e.preventDefault();
    localStorage.setItem(COMPANY_KEY, JSON.stringify(company));
    setSavedCompany(true);
    setTimeout(() => setSavedCompany(false), 1800);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Account */}
      <section className="card p-5">
        <h3 className="font-display font-semibold text-ink-900 dark:text-white mb-1">Account</h3>
        <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">
          Your session details for this demo.
        </p>
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white font-semibold">
            {user.name[0]}
          </span>
          <div>
            <p className="text-sm font-medium text-ink-800 dark:text-ink-100">{user.name}</p>
            <p className="text-xs text-ink-400">
              {ROLE_LABEL[user.role]}
              {me ? ` · ${me.role} · ${me.department}` : ""}
            </p>
            {me && <p className="text-xs text-ink-400 mt-0.5">{me.email}</p>}
          </div>
        </div>
        <p className="mt-4 text-xs text-ink-400">
          This template uses demo authentication — profile editing, password
          changes, and 2FA would connect to your real auth provider.
        </p>
      </section>

      {/* Appearance */}
      <section className="card p-5">
        <h3 className="font-display font-semibold text-ink-900 dark:text-white mb-1">Appearance</h3>
        <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">
          Choose how TalentFlow HR looks on your device.
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink-800 dark:text-ink-100">Dark mode</p>
            <p className="text-xs text-ink-400 mt-0.5">
              Currently {theme === "dark" ? "on" : "off"} · saved automatically
            </p>
          </div>
          <button
            role="switch"
            aria-checked={theme === "dark"}
            onClick={toggleTheme}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              theme === "dark" ? "bg-brand-600" : "bg-ink-200 dark:bg-ink-700"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                theme === "dark" ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </section>

      {/* Notifications */}
      <section className="card p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display font-semibold text-ink-900 dark:text-white">Notifications</h3>
          {savedNotif && <span className="text-xs text-brand-600 dark:text-brand-400">Saved</span>}
        </div>
        <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">
          Choose what you want to be notified about.
        </p>
        <div className="space-y-4">
          <ToggleRow
            label="Leave request updates"
            desc="New requests to review, or updates to your own requests"
            checked={notifications.leaveRequests}
            onChange={() => toggleNotif("leaveRequests")}
          />
          <ToggleRow
            label="Attendance alerts"
            desc="Late check-ins and missed check-outs"
            checked={notifications.attendanceAlerts}
            onChange={() => toggleNotif("attendanceAlerts")}
          />
          <ToggleRow
            label="Payroll reminders"
            desc="Upcoming payroll runs and payslip availability"
            checked={notifications.payrollReminders}
            onChange={() => toggleNotif("payrollReminders")}
          />
          <ToggleRow
            label="Product updates"
            desc="Occasional news about new dashboard features"
            checked={notifications.productUpdates}
            onChange={() => toggleNotif("productUpdates")}
          />
        </div>
        <button className="btn-primary mt-5" onClick={saveNotifications}>Save preferences</button>
      </section>

      {/* Company settings — admin only */}
      {isAdmin && (
        <section className="card p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-display font-semibold text-ink-900 dark:text-white">Company policy</h3>
            {savedCompany && <span className="text-xs text-brand-600 dark:text-brand-400">Saved</span>}
          </div>
          <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">
            Visible to Admin only. Used across attendance and leave calculations.
          </p>
          <form onSubmit={saveCompany} className="space-y-4">
            <div>
              <label className="label">Company name</label>
              <input
                className="input"
                value={company.name}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Work week</label>
                <input
                  className="input"
                  value={company.workWeek}
                  onChange={(e) => setCompany({ ...company, workWeek: e.target.value })}
                />
              </div>
              <div />
              <div>
                <label className="label">Annual leave days / year</label>
                <input
                  type="number"
                  className="input"
                  value={company.annualLeaveDays}
                  onChange={(e) => setCompany({ ...company, annualLeaveDays: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="label">Sick leave days / year</label>
                <input
                  type="number"
                  className="input"
                  value={company.sickLeaveDays}
                  onChange={(e) => setCompany({ ...company, sickLeaveDays: Number(e.target.value) })}
                />
              </div>
            </div>
            <button className="btn-primary" type="submit">Save company policy</button>
          </form>
        </section>
      )}

      {/* Danger zone — admin only */}
      {isAdmin && (
        <section className="card p-5 border-red-200 dark:border-red-900/50">
          <h3 className="font-display font-semibold text-red-600 mb-1">Danger zone</h3>
          <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">
            Resets employees, attendance, leaves, and payroll back to the
            original demo data. Your notification and company settings above
            are kept.
          </p>
          <button className="btn-danger" onClick={() => setConfirmReset(true)}>
            Reset demo data
          </button>
        </section>
      )}

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset all demo data?"
        footer={
          <>
            <button className="btn-outline" onClick={() => setConfirmReset(false)}>Cancel</button>
            <button
              className="btn-danger"
              onClick={() => {
                resetDemoData();
                setConfirmReset(false);
              }}
            >
              Reset data
            </button>
          </>
        }
      >
        <p className="text-sm text-ink-600 dark:text-ink-300">
          This overwrites every employee, attendance record, leave request,
          and payslip with the original seed data. Any edits you've made will
          be lost.
        </p>
      </Modal>
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-ink-800 dark:text-ink-100">{label}</p>
        <p className="text-xs text-ink-400 mt-0.5">{desc}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-brand-600" : "bg-ink-200 dark:bg-ink-700"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
