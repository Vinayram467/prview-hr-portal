import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useData } from "../context/DataContext";
import Badge from "../components/ui/Badge";

const todayStr = () => new Date().toISOString().slice(0, 10);

function formatDate(date) {
  if (!date) return "—";

  const value = new Date(`${date}T00:00:00`);

  if (Number.isNaN(value.getTime())) return date;

  return value.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(time) {
  if (!time) return "—";

  const [hour, minute] = time.split(":").map(Number);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return time;
  }

  const value = new Date();
  value.setHours(hour, minute, 0, 0);

  return value.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function timeToMinutes(time) {
  if (!time) return 0;

  const [hours, minutes] = time.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return 0;
  }

  return hours * 60 + minutes;
}

function calculateBreakMinutes(record) {
  if (!record?.breaks?.length) return 0;

  return record.breaks.reduce((total, breakItem) => {
    if (!breakItem.start) return total;

    const start = timeToMinutes(breakItem.start);
    const end = breakItem.end
      ? timeToMinutes(breakItem.end)
      : timeToMinutes(new Date().toTimeString().slice(0, 5));

    return total + Math.max(0, end - start);
  }, 0);
}

function calculateWorkingMinutes(record) {
  if (!record?.checkIn) return 0;

  const start = timeToMinutes(record.checkIn);

  const end = record.checkOut
    ? timeToMinutes(record.checkOut)
    : timeToMinutes(new Date().toTimeString().slice(0, 5));

  return Math.max(0, end - start - calculateBreakMinutes(record));
}

function formatMinutes(minutes) {
  if (!minutes || minutes < 1) return "0m";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function getTaskProgress(task) {
  if (typeof task.progress === "number") {
    return Math.max(0, Math.min(100, task.progress));
  }

  if (task.status === "Done") return 100;
  if (task.status === "In Progress") return 50;

  return 0;
}

function getAttendanceStatus(record) {
  if (!record) return "Not Started";

  if (record.workStatus === "On Break") {
    return "On Break";
  }

  if (record.checkOut) {
    return "Completed";
  }

  if (record.checkIn) {
    return "Working";
  }

  return "Not Started";
}

function statusClasses(status) {
  if (status === "Working") {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
  }

  if (status === "On Break") {
    return "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
  }

  if (status === "Completed") {
    return "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
  }

  return "bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300";
}

function ProgressBar({ progress }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
        <div
          className={`h-full rounded-full transition-all ${
            progress === 100
              ? "bg-emerald-500"
              : progress >= 50
              ? "bg-brand-500"
              : "bg-ink-400"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <span className="w-10 text-right text-xs font-semibold text-ink-600 dark:text-ink-300">
        {progress}%
      </span>
    </div>
  );
}

function StatCard({ label, value, description }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-ink-500 dark:text-ink-400">{label}</p>

      <p className="mt-2 text-2xl font-semibold text-ink-900 dark:text-white">
        {value}
      </p>

      {description && (
        <p className="mt-1 text-xs text-ink-400">{description}</p>
      )}
    </div>
  );
}

function SectionCard({ title, description, children }) {
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-ink-100 px-5 py-4 dark:border-ink-800">
        <h3 className="font-display font-semibold text-ink-900 dark:text-white">
          {title}
        </h3>

        {description && (
          <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
            {description}
          </p>
        )}
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

export default function EmployeeDetails() {
  const { employeeId } = useParams();
  const navigate = useNavigate();

  const {
    employees = [],
    attendance = [],
    tasks = [],
    leaves = [],
    reports = [],
  } = useData();

  const employee = employees.find((item) => item.id === employeeId);

  const today = todayStr();

  const todayAttendance = useMemo(
    () =>
      attendance.find(
        (record) =>
          record.employeeId === employeeId && record.date === today
      ),
    [attendance, employeeId, today]
  );

  const employeeTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.employeeId === employeeId)
        .sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        }),
    [tasks, employeeId]
  );

  const employeeAttendance = useMemo(
    () =>
      attendance
        .filter((record) => record.employeeId === employeeId)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [attendance, employeeId]
  );

  const employeeLeaves = useMemo(
    () =>
      leaves
        .filter((leave) => leave.employeeId === employeeId)
        .sort((a, b) =>
          a.appliedOn < b.appliedOn ? 1 : -1
        ),
    [leaves, employeeId]
  );

  const employeeReports = useMemo(
    () =>
      reports
        .filter((report) => report.employeeId === employeeId)
        .sort((a, b) =>
          a.date < b.date ? 1 : -1
        ),
    [reports, employeeId]
  );

  const completedTasks = employeeTasks.filter(
    (task) => task.status === "Done"
  ).length;

  const pendingTasks = employeeTasks.filter(
    (task) => task.status !== "Done"
  ).length;

  const averageProgress =
    employeeTasks.length > 0
      ? Math.round(
          employeeTasks.reduce(
            (total, task) => total + getTaskProgress(task),
            0
          ) / employeeTasks.length
        )
      : 0;

  const attendanceDays = employeeAttendance.filter(
    (record) => record.checkIn
  ).length;

  const totalWorkingMinutes = employeeAttendance.reduce(
    (total, record) => total + calculateWorkingMinutes(record),
    0
  );

  const totalBreakMinutes = employeeAttendance.reduce(
    (total, record) => total + calculateBreakMinutes(record),
    0
  );

  const averageWorkingMinutes =
    attendanceDays > 0
      ? Math.round(totalWorkingMinutes / attendanceDays)
      : 0;

  const submittedReports = employeeReports.length;

  const latestReport = employeeReports[0];

  if (!employee) {
    return (
      <div className="space-y-5">
        <button
          className="btn-outline"
          onClick={() => navigate("/employees")}
        >
          ← Back to Employees
        </button>

        <div className="card p-8 text-center">
          <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-white">
            Employee not found
          </h2>

          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
            The employee you are looking for does not exist in the current
            demo data.
          </p>
        </div>
      </div>
    );
  }

  const initials = employee.name
    .split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const todayStatus = getAttendanceStatus(todayAttendance);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          className="btn-outline"
          onClick={() => navigate("/employees")}
        >
          ← Back to Employees
        </button>

        <Link
          to={`/analytics?employee=${employee.id}`}
          className="btn-primary"
        >
          View Analytics
        </Link>
      </div>

      {/* Employee profile */}
      <section className="card overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500" />

        <div className="px-5 pb-5">
          <div className="-mt-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end gap-4">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white text-xl font-bold text-white shadow-sm dark:border-ink-900"
                style={{
                  backgroundColor: employee.avatarColor || "#7C3AED",
                }}
              >
                {initials}
              </div>

              <div className="pb-1">
                <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">
                  {employee.name}
                </h1>

                <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                  {employee.role} · {employee.department}
                </p>
              </div>
            </div>

            <Badge status={employee.status} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-ink-400">Email</p>
              <p className="mt-1 text-sm font-medium text-ink-800 dark:text-ink-100">
                {employee.email || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-ink-400">Phone</p>
              <p className="mt-1 text-sm font-medium text-ink-800 dark:text-ink-100">
                {employee.phone || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-ink-400">Join date</p>
              <p className="mt-1 text-sm font-medium text-ink-800 dark:text-ink-100">
                {formatDate(employee.joinDate)}
              </p>
            </div>

            <div>
              <p className="text-xs text-ink-400">Employee ID</p>
              <p className="mt-1 text-sm font-medium text-ink-800 dark:text-ink-100">
                {employee.id}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Today's status */}
      <section>
        <div className="mb-3">
          <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-white">
            Today
          </h2>

          <p className="text-sm text-ink-500 dark:text-ink-400">
            {formatDate(today)}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Status"
            value={todayStatus}
            description={
              <span
                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClasses(
                  todayStatus
                )}`}
              >
                {todayStatus}
              </span>
            }
          />

          <StatCard
            label="Login"
            value={formatTime(todayAttendance?.checkIn)}
            description="Today's check-in"
          />

          <StatCard
            label="Logout"
            value={formatTime(todayAttendance?.checkOut)}
            description="Today's check-out"
          />

          <StatCard
            label="Break"
            value={formatMinutes(calculateBreakMinutes(todayAttendance))}
            description="Total today"
          />

          <StatCard
            label="Working"
            value={formatMinutes(
              calculateWorkingMinutes(todayAttendance)
            )}
            description="Net working time"
          />
        </div>
      </section>

      {/* Performance summary */}
      <section>
        <div className="mb-3">
          <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-white">
            Performance Overview
          </h2>

          <p className="text-sm text-ink-500 dark:text-ink-400">
            Overall employee activity from the available records.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Total Tasks"
            value={employeeTasks.length}
            description="Assigned tasks"
          />

          <StatCard
            label="Completed"
            value={completedTasks}
            description="Finished tasks"
          />

          <StatCard
            label="Pending"
            value={pendingTasks}
            description="Open tasks"
          />

          <StatCard
            label="Task Progress"
            value={`${averageProgress}%`}
            description="Average task progress"
          />

          <StatCard
            label="Reports"
            value={submittedReports}
            description="Daily reports submitted"
          />
        </div>
      </section>

      {/* Attendance details */}
      <SectionCard
        title="Attendance"
        description="Recent attendance, working hours and breaks."
      >
        {employeeAttendance.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-400">
            No attendance records available.
          </p>
        ) : (
          <>
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-ink-50 p-4 dark:bg-ink-900">
                <p className="text-xs text-ink-400">Attendance days</p>
                <p className="mt-1 text-xl font-semibold text-ink-900 dark:text-white">
                  {attendanceDays}
                </p>
              </div>

              <div className="rounded-xl bg-ink-50 p-4 dark:bg-ink-900">
                <p className="text-xs text-ink-400">
                  Average working day
                </p>
                <p className="mt-1 text-xl font-semibold text-ink-900 dark:text-white">
                  {formatMinutes(averageWorkingMinutes)}
                </p>
              </div>

              <div className="rounded-xl bg-ink-50 p-4 dark:bg-ink-900">
                <p className="text-xs text-ink-400">Total break time</p>
                <p className="mt-1 text-xl font-semibold text-ink-900 dark:text-white">
                  {formatMinutes(totalBreakMinutes)}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left text-xs text-ink-400 dark:border-ink-800">
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">Login</th>
                    <th className="p-3 font-medium">Logout</th>
                    <th className="p-3 font-medium">Break</th>
                    <th className="p-3 font-medium">Working</th>
                    <th className="p-3 font-medium">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {employeeAttendance.slice(0, 15).map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-ink-50 last:border-0 dark:border-ink-800/60"
                    >
                      <td className="p-3 text-ink-700 dark:text-ink-200">
                        {formatDate(record.date)}
                      </td>

                      <td className="p-3">
                        {formatTime(record.checkIn)}
                      </td>

                      <td className="p-3">
                        {formatTime(record.checkOut)}
                      </td>

                      <td className="p-3">
                        {formatMinutes(calculateBreakMinutes(record))}
                      </td>

                      <td className="p-3">
                        {formatMinutes(calculateWorkingMinutes(record))}
                      </td>

                      <td className="p-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses(
                            getAttendanceStatus(record)
                          )}`}
                        >
                          {getAttendanceStatus(record)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </SectionCard>

      {/* Tasks */}
      <SectionCard
        title="Tasks"
        description="All tasks assigned to this employee."
      >
        {employeeTasks.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-400">
            No tasks assigned.
          </p>
        ) : (
          <div className="space-y-3">
            {employeeTasks.map((task) => {
              const progress = getTaskProgress(task);

              return (
                <div
                  key={task.id}
                  className="rounded-xl border border-ink-100 p-4 dark:border-ink-800"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-ink-800 dark:text-ink-100">
                        {task.title}
                      </p>

                      {task.description && (
                        <p className="mt-1 text-xs text-ink-400">
                          {task.description}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-ink-400">
                        Due: {formatDate(task.dueDate)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          task.priority === "High"
                            ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                            : task.priority === "Medium"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300"
                        }`}
                      >
                        {task.priority || "Normal"}
                      </span>

                      <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                        {task.status || "To Do"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <ProgressBar progress={progress} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Daily reports */}
      <SectionCard
        title="Daily Reports"
        description="Reports submitted by this employee."
      >
        {employeeReports.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-400">
            No daily reports submitted yet.
          </p>
        ) : (
          <div className="space-y-4">
            {employeeReports.slice(0, 10).map((report) => (
              <div
                key={report.id}
                className="rounded-xl border border-ink-100 p-4 dark:border-ink-800"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-ink-800 dark:text-ink-100">
                    {formatDate(report.date)}
                  </p>

                  <span className="text-xs text-ink-400">
                    Submitted
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-ink-400">
                      Completed
                    </p>

                    <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700 dark:text-ink-200">
                      {report.completed || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-ink-400">
                      Pending
                    </p>

                    <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700 dark:text-ink-200">
                      {report.pending || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-ink-400">
                      Blockers
                    </p>

                    <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700 dark:text-ink-200">
                      {report.blockers || "None"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-ink-400">
                      Tomorrow's Plan
                    </p>

                    <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700 dark:text-ink-200">
                      {report.tomorrowPlan || "—"}
                    </p>
                  </div>
                </div>

                {report.notes && (
                  <div className="mt-4 rounded-lg bg-ink-50 p-3 dark:bg-ink-900">
                    <p className="text-xs font-medium text-ink-400">
                      Notes
                    </p>

                    <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700 dark:text-ink-200">
                      {report.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {latestReport && (
          <div className="mt-5 rounded-xl bg-brand-50 p-4 dark:bg-brand-950">
            <p className="text-xs font-medium text-brand-700 dark:text-brand-300">
              Latest report
            </p>

            <p className="mt-1 text-sm text-brand-800 dark:text-brand-200">
              {formatDate(latestReport.date)}
            </p>
          </div>
        )}
      </SectionCard>

      {/* Leaves */}
      <SectionCard
        title="Leave History"
        description="Leave requests submitted by this employee."
      >
        {employeeLeaves.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-400">
            No leave records available.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs text-ink-400 dark:border-ink-800">
                  <th className="p-3 font-medium">Type</th>
                  <th className="p-3 font-medium">From</th>
                  <th className="p-3 font-medium">To</th>
                  <th className="p-3 font-medium">Applied</th>
                  <th className="p-3 font-medium">Status</th>
                </tr>
              </thead>

              <tbody>
                {employeeLeaves.map((leave) => (
                  <tr
                    key={leave.id}
                    className="border-b border-ink-50 last:border-0 dark:border-ink-800/60"
                  >
                    <td className="p-3">{leave.type || "—"}</td>
                    <td className="p-3">{formatDate(leave.from)}</td>
                    <td className="p-3">{formatDate(leave.to)}</td>
                    <td className="p-3">
                      {formatDate(leave.appliedOn)}
                    </td>
                    <td className="p-3">
                      <Badge status={leave.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Quick links */}
      <section className="card p-5">
        <h3 className="font-display font-semibold text-ink-900 dark:text-white">
          Employee Management
        </h3>

        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Continue managing this employee from the related modules.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/attendance" className="btn-outline">
            Attendance
          </Link>

          <Link to="/tasks" className="btn-outline">
            Tasks
          </Link>

          <Link to="/daily-report" className="btn-outline">
            Daily Reports
          </Link>

          <Link
            to={`/analytics?employee=${employee.id}`}
            className="btn-primary"
          >
            Analytics
          </Link>
        </div>
      </section>
    </div>
  );
}