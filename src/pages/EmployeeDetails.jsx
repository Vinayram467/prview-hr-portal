import { Link, useParams } from "react-router-dom";
import { useData } from "../context/DataContext";

function getProgress(task) {
  if (typeof task.progress === "number") return task.progress;
  if (task.status === "Done") return 100;
  if (task.status === "In Progress") return 50;
  return 0;
}

function formatTime(time) {
  if (!time) return "—";

  const [hour, minute] = time.split(":");
  const date = new Date();

  date.setHours(Number(hour), Number(minute), 0, 0);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatus(record) {
  if (!record) return "Not Started";
  if (record.workStatus === "On Break") return "On Break";
  if (record.workStatus === "Completed" || record.checkOut) {
    return "Completed";
  }
  if (record.checkIn) return "Working";

  return "Not Started";
}

function ProgressBar({ value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
        <div
          className="h-full rounded-full bg-brand-500"
          style={{ width: `${value}%` }}
        />
      </div>

      <span className="w-10 text-right text-xs font-semibold text-ink-600 dark:text-ink-300">
        {value}%
      </span>
    </div>
  );
}

export default function EmployeeDetails() {
  const { employeeId } = useParams();

  const {
    employees = [],
    attendance = [],
    tasks = [],
    reports = [],
  } = useData();

  const employee = employees.find(
    (item) => item.id === employeeId
  );

  if (!employee) {
    return (
      <div className="card p-10 text-center">
        <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-white">
          Employee not found
        </h2>

        <p className="mt-2 text-sm text-ink-400">
          The employee record may have been removed.
        </p>

        <Link
          to="/employees"
          className="btn-primary inline-flex mt-5"
        >
          Back to Employees
        </Link>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  const todayAttendance = attendance.find(
    (record) =>
      record.employeeId === employeeId &&
      record.date === today
  );

  const employeeTasks = tasks.filter(
    (task) => task.employeeId === employeeId
  );

  const completedTasks = employeeTasks.filter(
    (task) => task.status === "Done"
  ).length;

  const progress =
    employeeTasks.length > 0
      ? Math.round(
          employeeTasks.reduce(
            (sum, task) => sum + getProgress(task),
            0
          ) / employeeTasks.length
        )
      : 0;

  const employeeReports = reports
    .filter((report) => report.employeeId === employeeId)
    .sort((a, b) => {
      const aDate = a.date || "";
      const bDate = b.date || "";

      return aDate < bDate ? 1 : -1;
    });

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/"
          className="text-sm text-brand-600 hover:text-brand-700"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Employee header */}
      <section className="card p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              {employee.name
                ?.split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </div>

            <div>
              <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">
                {employee.name}
              </h1>

              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                {employee.role} · {employee.department}
              </p>

              <p className="mt-1 text-xs text-ink-400">
                {employee.email || "No email"} ·{" "}
                {employee.phone || "No phone"}
              </p>
            </div>
          </div>

          <div>
            <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              {getStatus(todayAttendance)}
            </span>
          </div>
        </div>
      </section>

      {/* Today's status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="card p-5">
          <p className="text-xs text-ink-400">Login</p>
          <p className="mt-2 text-xl font-semibold text-ink-900 dark:text-white">
            {formatTime(todayAttendance?.checkIn)}
          </p>
        </div>

        <div className="card p-5">
          <p className="text-xs text-ink-400">Logout</p>
          <p className="mt-2 text-xl font-semibold text-ink-900 dark:text-white">
            {formatTime(todayAttendance?.checkOut)}
          </p>
        </div>

        <div className="card p-5">
          <p className="text-xs text-ink-400">Tasks</p>
          <p className="mt-2 text-xl font-semibold text-ink-900 dark:text-white">
            {employeeTasks.length}
          </p>
        </div>

        <div className="card p-5">
          <p className="text-xs text-ink-400">Completed</p>
          <p className="mt-2 text-xl font-semibold text-emerald-600">
            {completedTasks}
          </p>
        </div>

        <div className="card p-5">
          <p className="text-xs text-ink-400">Progress</p>
          <p className="mt-2 text-xl font-semibold text-brand-600">
            {progress}%
          </p>
        </div>
      </div>

      {/* Tasks */}
      <section className="card p-5">
        <h2 className="font-display font-semibold text-ink-900 dark:text-white">
          Employee Tasks
        </h2>

        <p className="mt-1 text-xs text-ink-400">
          Complete task history and current progress
        </p>

        <div className="mt-5 space-y-3">
          {employeeTasks.map((task) => (
            <div
              key={task.id}
              className="rounded-xl border border-ink-100 p-4 dark:border-ink-800"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-ink-800 dark:text-ink-100">
                    {task.title}
                  </p>

                  <p className="mt-1 text-xs text-ink-400">
                    Due {task.dueDate || "—"} · {task.priority || "Medium"}
                  </p>
                </div>

                <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                  {task.status}
                </span>
              </div>

              <div className="mt-4">
                <ProgressBar value={getProgress(task)} />
              </div>
            </div>
          ))}

          {employeeTasks.length === 0 && (
            <p className="py-6 text-center text-sm text-ink-400">
              No tasks assigned.
            </p>
          )}
        </div>
      </section>

      {/* Attendance */}
      <section className="card overflow-hidden">
        <div className="p-5">
          <h2 className="font-display font-semibold text-ink-900 dark:text-white">
            Attendance History
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-400 dark:border-ink-800">
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Login</th>
                <th className="p-4 font-medium">Logout</th>
                <th className="p-4 font-medium">Breaks</th>
              </tr>
            </thead>

            <tbody>
              {attendance
                .filter(
                  (record) => record.employeeId === employeeId
                )
                .slice(0, 30)
                .map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-ink-100 last:border-0 dark:border-ink-800"
                  >
                    <td className="p-4 text-ink-700 dark:text-ink-200">
                      {record.date}
                    </td>

                    <td className="p-4">
                      <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                        {record.workStatus || record.status || "—"}
                      </span>
                    </td>

                    <td className="p-4">
                      {formatTime(record.checkIn)}
                    </td>

                    <td className="p-4">
                      {formatTime(record.checkOut)}
                    </td>

                    <td className="p-4">
                      {record.breaks?.length || 0}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Reports */}
      <section className="card p-5">
        <h2 className="font-display font-semibold text-ink-900 dark:text-white">
          Daily Reports
        </h2>

        <p className="mt-1 text-xs text-ink-400">
          Reports submitted by this employee
        </p>

        <div className="mt-5 space-y-3">
          {employeeReports.slice(0, 10).map((report) => (
            <div
              key={report.id}
              className="rounded-xl border border-ink-100 p-4 dark:border-ink-800"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-ink-800 dark:text-ink-100">
                  {report.date}
                </p>

                <span className="text-xs text-brand-600">
                  {report.progress ?? progress}% progress
                </span>
              </div>

              {report.completed && (
                <p className="mt-3 text-sm text-ink-600 dark:text-ink-300">
                  <strong>Completed:</strong> {report.completed}
                </p>
              )}

              {report.pending && (
                <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">
                  <strong>Pending:</strong> {report.pending}
                </p>
              )}

              {report.blockers && (
                <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">
                  <strong>Blockers:</strong> {report.blockers}
                </p>
              )}

              {report.tomorrowPlan && (
                <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">
                  <strong>Tomorrow:</strong> {report.tomorrowPlan}
                </p>
              )}
            </div>
          ))}

          {employeeReports.length === 0 && (
            <p className="py-6 text-center text-sm text-ink-400">
              No daily reports submitted yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}