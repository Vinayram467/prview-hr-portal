import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth, ROLES } from "../context/AuthContext";
import { useData } from "../context/DataContext";

function localDate() {
  const d = new Date();
  const offset = d.getTimezoneOffset();

  return new Date(d.getTime() - offset * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function currentTime() {
  return new Date().toTimeString().slice(0, 5);
}

function timeToMinutes(time) {
  if (!time) return null;

  const [hours, minutes] = time.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function minutesBetween(start, end) {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  if (
    startMinutes === null ||
    endMinutes === null
  ) {
    return 0;
  }

  let difference = endMinutes - startMinutes;

  if (difference < 0) {
    difference += 24 * 60;
  }

  return difference;
}

function formatDuration(totalMinutes) {
  if (!totalMinutes || totalMinutes <= 0) {
    return "0m";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

function formatTime(time) {
  if (!time) return "—";

  const [hour, minute] = time.split(":");

  const date = new Date();

  date.setHours(
    Number(hour),
    Number(minute),
    0,
    0
  );

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getTaskProgress(task) {
  if (!task) return 0;

  if (typeof task.progress === "number") {
    return Math.max(
      0,
      Math.min(100, task.progress)
    );
  }

  if (task.status === "Done") {
    return 100;
  }

  if (task.status === "In Progress") {
    return 50;
  }

  return 0;
}

function getBreakMinutes(
  breaks,
  employeeId,
  date
) {
  return breaks
    .filter(
      (item) =>
        item.employeeId === employeeId &&
        item.date === date
    )
    .reduce((total, item) => {
      if (!item.start) return total;

      const end =
        item.end || currentTime();

      return (
        total +
        minutesBetween(
          item.start,
          end
        )
      );
    }, 0);
}

function getActiveBreak(
  breaks,
  employeeId,
  date
) {
  return breaks.find(
    (item) =>
      item.employeeId === employeeId &&
      item.date === date &&
      item.start &&
      !item.end
  );
}

function getWorkingMinutes(
  attendanceRecord,
  breaks
) {
  if (!attendanceRecord?.checkIn) {
    return 0;
  }

  const end =
    attendanceRecord.checkOut ||
    currentTime();

  const totalMinutes =
    minutesBetween(
      attendanceRecord.checkIn,
      end
    );

  const breakMinutes =
    getBreakMinutes(
      breaks,
      attendanceRecord.employeeId,
      attendanceRecord.date
    );

  return Math.max(
    totalMinutes - breakMinutes,
    0
  );
}

function getEmployeeStatus(
  attendanceRecord,
  activeBreak
) {
  if (!attendanceRecord?.checkIn) {
    return "Not Started";
  }

  if (activeBreak) {
    return "On Break";
  }

  if (attendanceRecord.checkOut) {
    return "Completed";
  }

  return "Working";
}

function statusClass(status) {
  if (status === "Working") {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
  }

  if (status === "On Break") {
    return "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
  }

  if (status === "Completed") {
    return "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
  }

  return "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300";
}

function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
        status
      )}`}
    >
      {status}
    </span>
  );
}

function StatCard({
  label,
  value,
  description,
  icon,
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-ink-500 dark:text-ink-400">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold text-ink-900 dark:text-white">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs text-ink-400">
              {description}
            </p>
          )}
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ progress }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
        <div
          className={`h-full rounded-full transition-all ${
            progress >= 100
              ? "bg-emerald-500"
              : progress >= 50
              ? "bg-brand-500"
              : "bg-ink-300 dark:bg-ink-600"
          }`}
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      <span className="w-10 text-right text-xs font-semibold text-ink-600 dark:text-ink-300">
        {progress}%
      </span>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  const {
    employees = [],
    attendance = [],
    tasks = [],
    breaks = [],
    reports = [],
    checkIn,
    checkOut,
  } = useData();

  if (user?.role === ROLES.EMPLOYEE) {
    return (
      <EmployeeDashboard
        user={user}
        employees={employees}
        attendance={attendance}
        tasks={tasks}
        breaks={breaks}
        checkIn={checkIn}
        checkOut={checkOut}
      />
    );
  }

  return (
    <AdminDashboard
      employees={employees}
      attendance={attendance}
      tasks={tasks}
      breaks={breaks}
      reports={reports}
    />
  );
}

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

function AdminDashboard({
  employees,
  attendance,
  tasks,
  breaks,
  reports,
}) {
  const today = localDate();

  const todayAttendance = useMemo(
    () =>
      attendance.filter(
        (record) => record.date === today
      ),
    [attendance, today]
  );

  const employeeRows = useMemo(() => {
    return employees.map((employee) => {
      const attendanceRecord =
        todayAttendance.find(
          (record) =>
            record.employeeId === employee.id
        );

      const activeBreak =
        getActiveBreak(
          breaks,
          employee.id,
          today
        );

      const employeeBreaks =
        breaks.filter(
          (item) =>
            item.employeeId === employee.id &&
            item.date === today
        );

      const breakMinutes =
        getBreakMinutes(
          breaks,
          employee.id,
          today
        );

      const workingMinutes =
        getWorkingMinutes(
          attendanceRecord,
          breaks
        );

      const status =
        getEmployeeStatus(
          attendanceRecord,
          activeBreak
        );

      const employeeTasks =
        tasks.filter(
          (task) =>
            task.employeeId === employee.id
        );

      const completedTasks =
        employeeTasks.filter(
          (task) =>
            task.status === "Done"
        ).length;

      const totalProgress =
        employeeTasks.length > 0
          ? Math.round(
              employeeTasks.reduce(
                (sum, task) =>
                  sum +
                  getTaskProgress(task),
                0
              ) /
                employeeTasks.length
            )
          : 0;

      const todayReport =
        reports.find(
          (report) =>
            report.employeeId ===
              employee.id &&
            report.date === today
        );

      return {
        employee,
        attendanceRecord,
        activeBreak,
        employeeBreaks,
        breakMinutes,
        workingMinutes,
        status,
        employeeTasks,
        completedTasks,
        totalProgress,
        todayReport,
      };
    });
  }, [
    employees,
    todayAttendance,
    breaks,
    tasks,
    reports,
    today,
  ]);

  const presentToday =
    employeeRows.filter(
      (row) =>
        row.attendanceRecord?.checkIn
    ).length;

  const currentlyWorking =
    employeeRows.filter(
      (row) =>
        row.status === "Working"
    ).length;

  const currentlyOnBreak =
    employeeRows.filter(
      (row) =>
        row.status === "On Break"
    ).length;

  const completedToday =
    employeeRows.filter(
      (row) =>
        row.status === "Completed"
    ).length;

  const reportsSubmitted =
    employeeRows.filter(
      (row) =>
        !!row.todayReport
    ).length;

  const totalTaskCount =
    tasks.length;

  const completedTaskCount =
    tasks.filter(
      (task) =>
        task.status === "Done"
    ).length;

  const overallTaskProgress =
    totalTaskCount > 0
      ? Math.round(
          tasks.reduce(
            (sum, task) =>
              sum +
              getTaskProgress(task),
            0
          ) /
            totalTaskCount
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="card overflow-hidden p-6">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
              PRview Admin Portal
            </p>

            <h2 className="mt-1 font-display text-2xl font-semibold text-ink-900 dark:text-white">
              Good morning, Admin 👋
            </h2>

            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              Monitor your team's attendance,
              breaks, working hours and
              performance.
            </p>
          </div>

          <div className="rounded-xl bg-brand-50 px-4 py-3 dark:bg-brand-950">
            <p className="text-xs text-ink-400">
              Today
            </p>

            <p className="mt-1 text-sm font-semibold text-brand-700 dark:text-brand-300">
              {new Date().toLocaleDateString(
                [],
                {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                }
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard
          label="Employees"
          value={employees.length}
          description="Total team"
          icon="👥"
        />

        <StatCard
          label="Present"
          value={`${presentToday}/${employees.length}`}
          description="Checked in today"
          icon="✓"
        />

        <StatCard
          label="Working"
          value={currentlyWorking}
          description="Currently working"
          icon="◉"
        />

        <StatCard
          label="On Break"
          value={currentlyOnBreak}
          description="Currently on break"
          icon="☕"
        />

        <StatCard
          label="Completed"
          value={completedToday}
          description="Workday completed"
          icon="✓"
        />

        <StatCard
          label="Task Progress"
          value={`${overallTaskProgress}%`}
          description={`${completedTaskCount}/${totalTaskCount} done`}
          icon="↗"
        />
      </div>

      {/* Employee monitoring */}
      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-ink-100 p-5 dark:border-ink-800 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="font-display font-semibold text-ink-900 dark:text-white">
              Today's Employee Monitoring
            </h3>

            <p className="mt-1 text-xs text-ink-400">
              Live attendance, breaks, working
              hours and task performance
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              {currentlyWorking} working
            </span>

            <span className="rounded-full bg-amber-50 px-3 py-1.5 font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              {currentlyOnBreak} on break
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-400 dark:border-ink-800">
                <th className="p-4 font-medium">
                  Employee
                </th>

                <th className="p-4 font-medium">
                  Login
                </th>

                <th className="p-4 font-medium">
                  Status
                </th>

                <th className="p-4 font-medium">
                  Break
                </th>

                <th className="p-4 font-medium">
                  Break Time
                </th>

                <th className="p-4 font-medium">
                  Working Time
                </th>

                <th className="p-4 font-medium">
                  Logout
                </th>

                <th className="p-4 font-medium">
                  Tasks
                </th>

                <th className="p-4 font-medium">
                  Progress
                </th>

                <th className="p-4 font-medium">
                  Report
                </th>

                <th className="p-4 text-right font-medium">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {employeeRows.map((row) => (
                <EmployeeMonitoringRow
                  key={row.employee.id}
                  row={row}
                />
              ))}

              {employeeRows.length === 0 && (
                <tr>
                  <td
                    colSpan={11}
                    className="p-10 text-center text-sm text-ink-400"
                  >
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Task performance + reports */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="card p-5">
          <div className="mb-5">
            <h3 className="font-display font-semibold text-ink-900 dark:text-white">
              Employee Task Performance
            </h3>

            <p className="mt-1 text-xs text-ink-400">
              Current task completion by employee
            </p>
          </div>

          <div className="space-y-5">
            {employeeRows
              .filter(
                (row) =>
                  row.employeeTasks.length > 0
              )
              .sort(
                (a, b) =>
                  b.totalProgress -
                  a.totalProgress
              )
              .map((row) => (
                <div
                  key={row.employee.id}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                        {row.employee.name?.[0] ||
                          "?"}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink-800 dark:text-ink-100">
                          {row.employee.name}
                        </p>

                        <p className="text-xs text-ink-400">
                          {
                            row.completedTasks
                          }
                          /
                          {
                            row.employeeTasks
                              .length
                          }{" "}
                          completed
                        </p>
                      </div>
                    </div>

                    <span className="text-sm font-semibold text-ink-700 dark:text-ink-200">
                      {row.totalProgress}%
                    </span>
                  </div>

                  <ProgressBar
                    progress={
                      row.totalProgress
                    }
                  />
                </div>
              ))}

            {employeeRows.filter(
              (row) =>
                row.employeeTasks.length > 0
            ).length === 0 && (
              <p className="py-8 text-center text-sm text-ink-400">
                No tasks assigned yet.
              </p>
            )}
          </div>
        </section>

        <section className="card p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-semibold text-ink-900 dark:text-white">
                Daily Report Status
              </h3>

              <p className="mt-1 text-xs text-ink-400">
                Today's employee report
                submissions
              </p>
            </div>

            <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              {reportsSubmitted}/
              {employees.length}
            </span>
          </div>

          <div className="space-y-3">
            {employeeRows.map((row) => (
              <div
                key={row.employee.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-ink-100 p-3 dark:border-ink-800"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    {row.employee.name?.[0] ||
                      "?"}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-800 dark:text-ink-100">
                      {row.employee.name}
                    </p>

                    <p className="text-xs text-ink-400">
                      {row.employee.department ||
                        row.employee.role ||
                        "Employee"}
                    </p>
                  </div>
                </div>

                {row.todayReport ? (
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    Submitted
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    Missing
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Current breaks */}
      <section className="card p-5">
        <div className="mb-5">
          <h3 className="font-display font-semibold text-ink-900 dark:text-white">
            Employees Currently on Break
          </h3>

          <p className="mt-1 text-xs text-ink-400">
            Active break reason and location
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {employeeRows
            .filter(
              (row) =>
                row.activeBreak
            )
            .map((row) => (
              <div
                key={row.employee.id}
                className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink-900 dark:text-white">
                      {row.employee.name}
                    </p>

                    <p className="mt-1 text-xs text-ink-400">
                      {row.employee.role ||
                        row.employee.department ||
                        "Employee"}
                    </p>
                  </div>

                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    On Break
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-ink-500 dark:text-ink-400">
                      Reason
                    </span>

                    <span className="font-medium text-ink-800 dark:text-ink-100">
                      {row.activeBreak.reason ||
                        "Break"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-ink-500 dark:text-ink-400">
                      Location
                    </span>

                    <span className="font-medium text-ink-800 dark:text-ink-100">
                      {row.activeBreak.location ||
                        "—"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-ink-500 dark:text-ink-400">
                      Started
                    </span>

                    <span className="font-medium text-ink-800 dark:text-ink-100">
                      {formatTime(
                        row.activeBreak.start
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-ink-500 dark:text-ink-400">
                      Break time
                    </span>

                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {formatDuration(
                        row.breakMinutes
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}

          {employeeRows.filter(
            (row) =>
              row.activeBreak
          ).length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-ink-200 p-8 text-center dark:border-ink-700">
              <p className="text-sm text-ink-400">
                No employees are currently
                on break.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function EmployeeMonitoringRow({ row }) {
  const {
    employee,
    attendanceRecord,
    activeBreak,
    breakMinutes,
    workingMinutes,
    status,
    employeeTasks,
    completedTasks,
    totalProgress,
    todayReport,
  } = row;

  return (
    <tr className="border-b border-ink-50 last:border-0 dark:border-ink-800/60">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            {employee.name?.[0] || "?"}
          </span>

          <div className="min-w-[150px]">
            <p className="font-medium text-ink-800 dark:text-ink-100">
              {employee.name}
            </p>

            <p className="text-xs text-ink-400">
              {employee.department ||
                employee.role ||
                "Employee"}
            </p>
          </div>
        </div>
      </td>

      <td className="p-4 text-ink-600 dark:text-ink-300">
        {formatTime(
          attendanceRecord?.checkIn
        )}
      </td>

      <td className="p-4">
        <StatusPill status={status} />
      </td>

      <td className="p-4">
        {activeBreak ? (
          <div>
            <p className="font-medium text-amber-600 dark:text-amber-400">
              {activeBreak.reason ||
                "Break"}
            </p>

            {activeBreak.location && (
              <p className="mt-0.5 text-xs text-ink-400">
                {activeBreak.location}
              </p>
            )}
          </div>
        ) : (
          <span className="text-ink-400">
            —
          </span>
        )}
      </td>

      <td className="p-4 text-amber-600 dark:text-amber-400">
        {formatDuration(breakMinutes)}
      </td>

      <td className="p-4 font-medium text-emerald-600 dark:text-emerald-400">
        {formatDuration(
          workingMinutes
        )}
      </td>

      <td className="p-4 text-ink-600 dark:text-ink-300">
        {formatTime(
          attendanceRecord?.checkOut
        )}
      </td>

      <td className="p-4">
        <span className="font-medium text-ink-700 dark:text-ink-200">
          {completedTasks}/
          {employeeTasks.length}
        </span>
      </td>

      <td className="min-w-[130px] p-4">
        <ProgressBar
          progress={totalProgress}
        />
      </td>

      <td className="p-4">
        {todayReport ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            Submitted
          </span>
        ) : (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            Missing
          </span>
        )}
      </td>

      <td className="p-4 text-right">
        <Link
          to={`/employees/${employee.id}`}
          className="btn-primary !px-3 !py-1.5 text-xs"
        >
          View
        </Link>
      </td>
    </tr>
  );
}

/* =========================================================
   EMPLOYEE DASHBOARD
========================================================= */

function EmployeeDashboard({
  user,
  employees,
  attendance,
  tasks,
  breaks,
  checkIn,
  checkOut,
}) {
  const today = localDate();

  const me = employees.find(
    (employee) =>
      employee.id === user.employeeId
  );

  const todayRecord = attendance.find(
    (record) =>
      record.employeeId ===
        user.employeeId &&
      record.date === today
  );

  const myTasks = tasks.filter(
    (task) =>
      task.employeeId ===
      user.employeeId
  );

  const completedTasks =
    myTasks.filter(
      (task) =>
        task.status === "Done"
    ).length;

  const pendingTasks =
    myTasks.filter(
      (task) =>
        task.status !== "Done"
    );

  const taskProgress =
    myTasks.length > 0
      ? Math.round(
          myTasks.reduce(
            (sum, task) =>
              sum +
              getTaskProgress(task),
            0
          ) /
            myTasks.length
        )
      : 0;

  const activeBreak =
    getActiveBreak(
      breaks,
      user.employeeId,
      today
    );

  const breakMinutes =
    getBreakMinutes(
      breaks,
      user.employeeId,
      today
    );

  const workingMinutes =
    getWorkingMinutes(
      todayRecord,
      breaks
    );

  const status =
    getEmployeeStatus(
      todayRecord,
      activeBreak
    );

  function handleCheckIn() {
    checkIn(user.employeeId);
  }

  function handleCheckOut() {
    if (activeBreak) return;

    checkOut(user.employeeId);
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <section className="card overflow-hidden p-6">
        <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
          PRview Employee Portal
        </p>

        <h2 className="mt-1 font-display text-2xl font-semibold text-ink-900 dark:text-white">
          Good morning,{" "}
          {me?.name?.split(" ")[0] ||
            "there"}{" "}
          👋
        </h2>

        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Here's your work overview for
          today.
        </p>
      </section>

      {/* Attendance */}
      <section className="card p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-ink-500 dark:text-ink-400">
              Today's attendance
            </p>

            <h3 className="mt-1 text-xl font-semibold text-ink-900 dark:text-white">
              {todayRecord?.checkIn
                ? `Started at ${formatTime(
                    todayRecord.checkIn
                  )}`
                : "You haven't checked in yet"}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusPill
                status={status}
              />

              {todayRecord?.checkOut && (
                <span className="text-xs text-ink-400">
                  Logout{" "}
                  {formatTime(
                    todayRecord.checkOut
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {!todayRecord?.checkIn && (
              <button
                className="btn-primary"
                onClick={handleCheckIn}
              >
                ✓ Clock In
              </button>
            )}

            {todayRecord?.checkIn &&
              !todayRecord?.checkOut && (
                <button
                  className="btn-outline"
                  disabled={
                    !!activeBreak
                  }
                  onClick={
                    handleCheckOut
                  }
                >
                  {activeBreak
                    ? "End break first"
                    : "Clock Out"}
                </button>
              )}

            {todayRecord?.checkOut && (
              <span className="rounded-lg bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                Workday completed ✓
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Work statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Working Time"
          value={formatDuration(
            workingMinutes
          )}
          description="Today"
          icon="◷"
        />

        <StatCard
          label="Break Time"
          value={formatDuration(
            breakMinutes
          )}
          description="Today"
          icon="☕"
        />

        <StatCard
          label="Tasks"
          value={myTasks.length}
          description="Assigned"
          icon="✓"
        />

        <StatCard
          label="Completed"
          value={completedTasks}
          description="Finished"
          icon="✓"
        />

        <StatCard
          label="Progress"
          value={`${taskProgress}%`}
          description="Task completion"
          icon="↗"
        />
      </div>

      {/* Current break */}
      {activeBreak && (
        <section className="card border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900 dark:bg-amber-950/30">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
            Currently on break
          </p>

          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-ink-900 dark:text-white">
                {activeBreak.reason ||
                  "Break"}
              </p>

              {activeBreak.location && (
                <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                  Location:{" "}
                  {activeBreak.location}
                </p>
              )}
            </div>

            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
              Started{" "}
              {formatTime(
                activeBreak.start
              )}
            </p>
          </div>
        </section>
      )}

      {/* Tasks */}
      <section className="card p-5">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display font-semibold text-ink-900 dark:text-white">
              My Tasks
            </h3>

            <p className="mt-1 text-xs text-ink-400">
              Your assigned work
            </p>
          </div>

          <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            {taskProgress}% complete
          </span>
        </div>

        <div className="space-y-4">
          {myTasks.map((task) => {
            const progress =
              getTaskProgress(task);

            return (
              <div
                key={task.id}
                className="rounded-xl border border-ink-100 p-4 dark:border-ink-800"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="font-medium text-ink-800 dark:text-ink-100">
                      {task.title}
                    </h4>

                    <p className="mt-1 text-xs text-ink-400">
                      Due{" "}
                      {task.dueDate ||
                        "—"}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                      task.status ===
                      "Done"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : task.status ===
                          "In Progress"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>

                <div className="mt-4">
                  <ProgressBar
                    progress={
                      progress
                    }
                  />
                </div>
              </div>
            );
          })}

          {myTasks.length === 0 && (
            <p className="py-8 text-center text-sm text-ink-400">
              No tasks assigned yet.
            </p>
          )}
        </div>
      </section>

      {/* Pending work */}
      <section className="card p-5">
        <div className="mb-5">
          <h3 className="font-display font-semibold text-ink-900 dark:text-white">
            Pending Work
          </h3>

          <p className="mt-1 text-xs text-ink-400">
            Tasks that still need attention
          </p>
        </div>

        <div className="space-y-3">
          {pendingTasks
            .slice(0, 5)
            .map((task) => (
              <div
                key={task.id}
                className="flex flex-col gap-2 rounded-xl border border-ink-100 p-4 dark:border-ink-800 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-ink-800 dark:text-ink-100">
                    {task.title}
                  </p>

                  <p className="mt-1 text-xs text-ink-400">
                    Due{" "}
                    {task.dueDate ||
                      "—"}
                  </p>
                </div>

                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  {task.status}
                </span>
              </div>
            ))}

          {pendingTasks.length === 0 && (
            <p className="py-8 text-center text-sm text-ink-400">
              All tasks completed. Great
              work! 🎉
            </p>
          )}
        </div>
      </section>
    </div>
  );
}