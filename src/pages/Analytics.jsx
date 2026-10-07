import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useData } from "../context/DataContext";
import { ROLES, useAuth } from "../context/AuthContext";

function localDate(date = new Date()) {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10);
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function minutesToText(minutes = 0) {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const mins = total % 60;

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;

  return `${hours}h ${mins}m`;
}

function getTaskProgress(task) {
  const value = Number(task?.progress);

  if (Number.isFinite(value)) {
    return Math.min(100, Math.max(0, value));
  }

  if (task?.status === "Done" || task?.status === "Completed") {
    return 100;
  }

  return 0;
}

function getBreakMinutes(breakItem) {
  if (!breakItem?.startTime) return 0;

  const start = new Date(breakItem.startTime).getTime();
  const end = breakItem.endTime
    ? new Date(breakItem.endTime).getTime()
    : Date.now();

  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;

  return Math.max(0, Math.round((end - start) / 60000));
}

function getAttendanceMinutes(record, breaks = []) {
  if (!record?.checkIn) return 0;

  const start = new Date(record.checkIn).getTime();

  const end = record.checkOut
    ? new Date(record.checkOut).getTime()
    : Date.now();

  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;

  const totalMinutes = Math.max(
    0,
    Math.round((end - start) / 60000)
  );

  const breakMinutes = breaks
    .filter((item) => item.date === record.date)
    .reduce((sum, item) => sum + getBreakMinutes(item), 0);

  return Math.max(0, totalMinutes - breakMinutes);
}

function getAttendanceStatus(record, breaks) {
  if (!record?.checkIn) return "Absent";

  const activeBreak = breaks.some(
    (item) => item.date === record.date && !item.endTime
  );

  if (activeBreak) return "On Break";

  if (!record.checkOut) return "Working";

  return "Completed";
}

function ProgressBar({ value }) {
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-500">Progress</span>
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {Math.round(value)}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, helper }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
        {value}
      </p>

      {helper && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {helper}
        </p>
      )}
    </div>
  );
}

function SectionCard({ title, subtitle, children, action }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        {action}
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
      {message}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Working:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    "On Break":
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    Completed:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    Absent:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles[status] || styles.Absent
      }`}
    >
      {status}
    </span>
  );
}

export default function Analytics() {
  const { user } = useAuth();
  const {
    employees,
    attendance,
    breaks,
    tasks,
    reports,
    leaves,
  } = useData();

  const [searchParams, setSearchParams] = useSearchParams();

  const isAdminOrHR =
    user?.role === ROLES.ADMIN || user?.role === ROLES.HR;

  const today = localDate();

  const selectedEmployeeId =
    searchParams.get("employee") ||
    employees?.[0]?.id ||
    "";

  const selectedEmployee =
    employees?.find((employee) => employee.id === selectedEmployeeId) ||
    employees?.[0] ||
    null;

  const [reportDate, setReportDate] = useState(today);

  const employeeAttendance = useMemo(() => {
    if (!selectedEmployee) return [];

    return (attendance || [])
      .filter((item) => item.employeeId === selectedEmployee.id)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [attendance, selectedEmployee]);

  const employeeTasks = useMemo(() => {
    if (!selectedEmployee) return [];

    return (tasks || [])
      .filter((task) => task.employeeId === selectedEmployee.id)
      .sort((a, b) => {
        const aDate = a.dueDate || a.createdAt || "";
        const bDate = b.dueDate || b.createdAt || "";

        return String(bDate).localeCompare(String(aDate));
      });
  }, [tasks, selectedEmployee]);

  const employeeBreaks = useMemo(() => {
    if (!selectedEmployee) return [];

    return (breaks || [])
      .filter((item) => item.employeeId === selectedEmployee.id)
      .sort((a, b) => {
        return (
          new Date(b.startTime || 0).getTime() -
          new Date(a.startTime || 0).getTime()
        );
      });
  }, [breaks, selectedEmployee]);

  const employeeReports = useMemo(() => {
    if (!selectedEmployee) return [];

    return (reports || [])
      .filter((report) => report.employeeId === selectedEmployee.id)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [reports, selectedEmployee]);

  const employeeLeaves = useMemo(() => {
    if (!selectedEmployee) return [];

    return (leaves || [])
      .filter((leave) => leave.employeeId === selectedEmployee.id)
      .sort((a, b) =>
        String(b.startDate || "").localeCompare(
          String(a.startDate || "")
        )
      );
  }, [leaves, selectedEmployee]);

  const selectedTodayAttendance = employeeAttendance.find(
    (item) => item.date === today
  );

  const selectedTodayBreaks = employeeBreaks.filter(
    (item) => item.date === today
  );

  const selectedTodayTasks = employeeTasks.filter(
    (task) => task.dueDate === today
  );

  const selectedTodayReport = employeeReports.find(
    (report) => report.date === reportDate
  );

  const completedTasks = employeeTasks.filter(
    (task) => getTaskProgress(task) >= 100
  );

  const pendingTasks = employeeTasks.filter(
    (task) => getTaskProgress(task) < 100
  );

  const averageTaskProgress =
    employeeTasks.length > 0
      ? employeeTasks.reduce(
          (sum, task) => sum + getTaskProgress(task),
          0
        ) / employeeTasks.length
      : 0;

  const attendanceMinutes = employeeAttendance.reduce(
    (sum, record) => {
      const recordBreaks = employeeBreaks.filter(
        (item) => item.date === record.date
      );

      return sum + getAttendanceMinutes(record, recordBreaks);
    },
    0
  );

  const averageWorkday =
    employeeAttendance.length > 0
      ? attendanceMinutes / employeeAttendance.length
      : 0;

  const presentDays = employeeAttendance.filter(
    (item) => item.checkIn
  ).length;

  const absentDays = Math.max(
    0,
    employeeAttendance.length - presentDays
  );

  const approvedLeaves = employeeLeaves.filter(
    (leave) =>
      String(leave.status || "").toLowerCase() === "approved"
  ).length;

  const todayStatus = getAttendanceStatus(
    selectedTodayAttendance,
    selectedTodayBreaks
  );

  const todayWorkingMinutes = selectedTodayAttendance
    ? getAttendanceMinutes(
        selectedTodayAttendance,
        selectedTodayBreaks
      )
    : 0;

  const todayBreakMinutes = selectedTodayBreaks.reduce(
    (sum, item) => sum + getBreakMinutes(item),
    0
  );

  const todayTaskProgress =
    selectedTodayTasks.length > 0
      ? selectedTodayTasks.reduce(
          (sum, task) => sum + getTaskProgress(task),
          0
        ) / selectedTodayTasks.length
      : 0;

  const teamStats = useMemo(() => {
    const totalEmployees = employees?.length || 0;

    const present = (employees || []).filter((employee) => {
      const record = (attendance || []).find(
        (item) =>
          item.employeeId === employee.id && item.date === today
      );

      return Boolean(record?.checkIn);
    }).length;

    const onBreak = (employees || []).filter((employee) => {
      return (breaks || []).some(
        (item) =>
          item.employeeId === employee.id &&
          item.date === today &&
          !item.endTime
      );
    }).length;

    const working = (employees || []).filter((employee) => {
      const record = (attendance || []).find(
        (item) =>
          item.employeeId === employee.id && item.date === today
      );

      const activeBreak = (breaks || []).some(
        (item) =>
          item.employeeId === employee.id &&
          item.date === today &&
          !item.endTime
      );

      return Boolean(record?.checkIn) && !record?.checkOut && !activeBreak;
    }).length;

    const completedToday = (tasks || []).filter(
      (task) =>
        task.employeeId &&
        task.dueDate === today &&
        getTaskProgress(task) >= 100
    ).length;

    const totalTodayTasks = (tasks || []).filter(
      (task) => task.employeeId && task.dueDate === today
    ).length;

    const progress =
      totalTodayTasks > 0
        ? (completedToday / totalTodayTasks) * 100
        : 0;

    return {
      totalEmployees,
      present,
      onBreak,
      working,
      completedToday,
      totalTodayTasks,
      progress,
    };
  }, [employees, attendance, breaks, tasks, today]);

  function handleEmployeeChange(event) {
    const employeeId = event.target.value;

    const nextParams = new URLSearchParams(searchParams);

    if (employeeId) {
      nextParams.set("employee", employeeId);
    } else {
      nextParams.delete("employee");
    }

    setSearchParams(nextParams);
  }

  if (!isAdminOrHR) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        You do not have permission to view Analytics.
      </div>
    );
  }

  if (!selectedEmployee) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          No employees found
        </h2>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Add an employee first to view analytics.
        </p>

        <Link
          to="/employees"
          className="mt-4 inline-flex rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Go to Employees
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">
            PRview Management Analytics
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            Employee Analytics
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monitor attendance, work time, tasks, reports and performance
            for individual employees.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={selectedEmployee.id}
            onChange={handleEmployeeChange}
            className="min-w-[240px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            {(employees || []).map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name} — {employee.role || "Employee"}
              </option>
            ))}
          </select>

          <Link
            to={`/employees/${selectedEmployee.id}`}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            View Profile
          </Link>
        </div>
      </div>

      {/* Employee profile */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
              {selectedEmployee.name
                ?.split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {selectedEmployee.name}
              </h2>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                {selectedEmployee.role || "Employee"}
                {selectedEmployee.department
                  ? ` • ${selectedEmployee.department}`
                  : ""}
              </p>

              {selectedEmployee.email && (
                <p className="mt-1 text-xs text-slate-400">
                  {selectedEmployee.email}
                </p>
              )}
            </div>
          </div>

          <StatusBadge status={todayStatus} />
        </div>
      </div>

      {/* Main stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Task Progress"
          value={`${Math.round(averageTaskProgress)}%`}
          helper={`${completedTasks.length} completed / ${employeeTasks.length} total`}
        />

        <StatCard
          label="Present Days"
          value={presentDays}
          helper={`${absentDays} other attendance records`}
        />

        <StatCard
          label="Average Workday"
          value={minutesToText(averageWorkday)}
          helper="After break deductions"
        />

        <StatCard
          label="Reports"
          value={employeeReports.length}
          helper={`${employeeReports.filter((r) => r.date === today).length} submitted today`}
        />

        <StatCard
          label="Approved Leaves"
          value={approvedLeaves}
          helper={`${employeeLeaves.length} total requests`}
        />
      </div>

      {/* Today's overview */}
      <SectionCard
        title="Today's Work Overview"
        subtitle={formatDate(today)}
        action={
          <Link
            to={`/employees/${selectedEmployee.id}`}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Full employee profile →
          </Link>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Login
            </p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
              {formatTime(selectedTodayAttendance?.checkIn)}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Logout
            </p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
              {formatTime(selectedTodayAttendance?.checkOut)}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Working Time
            </p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
              {minutesToText(todayWorkingMinutes)}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Break Time
            </p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
              {minutesToText(todayBreakMinutes)}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div>
            <ProgressBar value={todayTaskProgress} />

            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {selectedTodayTasks.length} task
              {selectedTodayTasks.length === 1 ? "" : "s"} due today
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Daily Report
            </p>

            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
              {selectedTodayReport
                ? "Submitted"
                : "Not submitted"}
            </p>

            {selectedTodayReport && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Report submitted for {formatDate(today)}
              </p>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Task performance */}
      <SectionCard
        title="Task Performance"
        subtitle="Performance across all assigned tasks"
      >
        {employeeTasks.length === 0 ? (
          <EmptyState message="No tasks assigned to this employee yet." />
        ) : (
          <div className="space-y-4">
            {employeeTasks.map((task) => {
              const progress = getTaskProgress(task);

              return (
                <div
                  key={task.id}
                  className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {task.title}
                      </h3>

                      {task.description && (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {task.description}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                        {task.priority && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
                            Priority: {task.priority}
                          </span>
                        )}

                        {task.dueDate && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
                            Due: {formatDate(task.dueDate)}
                          </span>
                        )}

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
                          {progress >= 100
                            ? "Completed"
                            : progress > 0
                            ? "In Progress"
                            : "To Do"}
                        </span>
                      </div>
                    </div>

                    <div className="w-full md:w-48">
                      <ProgressBar value={progress} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Attendance history */}
      <SectionCard
        title="Attendance History"
        subtitle="Login, logout and actual working time"
      >
        {employeeAttendance.length === 0 ? (
          <EmptyState message="No attendance records found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Login</th>
                  <th className="px-3 py-3">Logout</th>
                  <th className="px-3 py-3">Break</th>
                  <th className="px-3 py-3">Working</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {employeeAttendance.slice(0, 15).map((record) => {
                  const dayBreaks = employeeBreaks.filter(
                    (item) => item.date === record.date
                  );

                  const breakMinutes = dayBreaks.reduce(
                    (sum, item) => sum + getBreakMinutes(item),
                    0
                  );

                  const workMinutes = getAttendanceMinutes(
                    record,
                    dayBreaks
                  );

                  const status = getAttendanceStatus(
                    record,
                    dayBreaks
                  );

                  return (
                    <tr
                      key={record.id}
                      className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                    >
                      <td className="px-3 py-3 font-medium text-slate-900 dark:text-white">
                        {formatDate(record.date)}
                      </td>

                      <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                        {formatTime(record.checkIn)}
                      </td>

                      <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                        {formatTime(record.checkOut)}
                      </td>

                      <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                        {minutesToText(breakMinutes)}
                      </td>

                      <td className="px-3 py-3 font-semibold text-slate-900 dark:text-white">
                        {minutesToText(workMinutes)}
                      </td>

                      <td className="px-3 py-3">
                        <StatusBadge status={status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Break analytics */}
      <SectionCard
        title="Break Analytics"
        subtitle="Break history and reasons"
      >
        {employeeBreaks.length === 0 ? (
          <EmptyState message="No break records found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Reason</th>
                  <th className="px-3 py-3">Location</th>
                  <th className="px-3 py-3">Start</th>
                  <th className="px-3 py-3">End</th>
                  <th className="px-3 py-3">Duration</th>
                </tr>
              </thead>

              <tbody>
                {employeeBreaks.slice(0, 20).map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                      {formatDate(item.date)}
                    </td>

                    <td className="px-3 py-3 font-medium text-slate-900 dark:text-white">
                      {item.reason || "—"}
                    </td>

                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                      {item.location || "—"}
                    </td>

                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                      {formatTime(item.startTime)}
                    </td>

                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                      {formatTime(item.endTime)}
                    </td>

                    <td className="px-3 py-3 font-semibold text-slate-900 dark:text-white">
                      {minutesToText(getBreakMinutes(item))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Daily reports */}
      <SectionCard
        title="Daily Report Analytics"
        subtitle="Review what the employee completed, what remains and reported blockers"
        action={
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={reportDate}
              onChange={(event) => setReportDate(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />

            <Link
              to={`/daily-report?employee=${selectedEmployee.id}`}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Reports
            </Link>
          </div>
        }
      >
        {!selectedTodayReport && reportDate === today ? (
          <EmptyState message="No daily report has been submitted for today." />
        ) : !selectedTodayReport ? (
          <EmptyState message={`No report found for ${formatDate(reportDate)}.`} />
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <p className="text-xs text-slate-500">Completed</p>
                <p className="mt-2 whitespace-pre-line text-sm text-slate-800 dark:text-slate-200">
                  {selectedTodayReport.completed || "—"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <p className="text-xs text-slate-500">Pending</p>
                <p className="mt-2 whitespace-pre-line text-sm text-slate-800 dark:text-slate-200">
                  {selectedTodayReport.pending || "—"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <p className="text-xs text-slate-500">Blockers</p>
                <p className="mt-2 whitespace-pre-line text-sm text-slate-800 dark:text-slate-200">
                  {selectedTodayReport.blockers || "—"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Tomorrow's Plan
                </p>

                <p className="mt-2 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">
                  {selectedTodayReport.tomorrowPlan || "—"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Notes
                </p>

                <p className="mt-2 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">
                  {selectedTodayReport.notes || "—"}
                </p>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Leave analytics */}
      <SectionCard
        title="Leave Analytics"
        subtitle="Employee leave history"
      >
        {employeeLeaves.length === 0 ? (
          <EmptyState message="No leave requests found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                  <th className="px-3 py-3">Start</th>
                  <th className="px-3 py-3">End</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Reason</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {employeeLeaves.map((leave) => (
                  <tr
                    key={leave.id}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                      {formatDate(leave.startDate)}
                    </td>

                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                      {formatDate(leave.endDate)}
                    </td>

                    <td className="px-3 py-3 font-medium text-slate-900 dark:text-white">
                      {leave.type || leave.leaveType || "—"}
                    </td>

                    <td className="max-w-xs px-3 py-3 text-slate-600 dark:text-slate-300">
                      {leave.reason || "—"}
                    </td>

                    <td className="px-3 py-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold dark:bg-slate-800">
                        {leave.status || "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Team overview */}
      <SectionCard
        title="Team Overview"
        subtitle={`Live team snapshot for ${formatDate(today)}`}
        action={
          <Link
            to="/employees"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Manage employees →
          </Link>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Employees"
            value={teamStats.totalEmployees}
          />

          <StatCard
            label="Present"
            value={teamStats.present}
          />

          <StatCard
            label="Working"
            value={teamStats.working}
          />

          <StatCard
            label="On Break"
            value={teamStats.onBreak}
          />

          <StatCard
            label="Today's Task Progress"
            value={`${Math.round(teamStats.progress)}%`}
            helper={`${teamStats.completedToday}/${teamStats.totalTodayTasks} completed`}
          />
        </div>
      </SectionCard>

      {/* Recent performance */}
      <SectionCard
        title="Recent Performance"
        subtitle="Latest reports submitted by this employee"
      >
        {employeeReports.length === 0 ? (
          <EmptyState message="No daily reports available." />
        ) : (
          <div className="space-y-3">
            {employeeReports.slice(0, 5).map((report) => (
              <div
                key={report.id}
                className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formatDate(report.date)}
                    </p>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {report.completed
                        ? report.completed.slice(0, 120)
                        : "No completion details"}
                      {report.completed?.length > 120 ? "..." : ""}
                    </p>
                  </div>

                  <Link
                    to={`/daily-report?employee=${selectedEmployee.id}&date=${report.date}`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    View Report
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}