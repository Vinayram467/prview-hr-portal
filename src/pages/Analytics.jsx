import { useMemo, useState } from "react";
import { useData } from "../context/DataContext";

const todayStr = () => new Date().toISOString().slice(0, 10);

function getTaskProgress(task) {
  if (typeof task.progress === "number") {
    return task.progress;
  }

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

function getBreakMinutes(record) {
  if (!record?.breaks?.length) return 0;

  return record.breaks.reduce((total, br) => {
    if (!br.start) return total;

    const start = br.start.split(":").map(Number);
    const startMinutes = start[0] * 60 + start[1];

    let endMinutes;

    if (br.end) {
      const end = br.end.split(":").map(Number);
      endMinutes = end[0] * 60 + end[1];
    } else {
      const now = new Date();
      endMinutes = now.getHours() * 60 + now.getMinutes();
    }

    return total + Math.max(0, endMinutes - startMinutes);
  }, 0);
}

function getWorkingMinutes(record) {
  if (!record?.checkIn) return 0;

  const start = record.checkIn.split(":").map(Number);
  const startMinutes = start[0] * 60 + start[1];

  let endMinutes;

  if (record.checkOut) {
    const end = record.checkOut.split(":").map(Number);
    endMinutes = end[0] * 60 + end[1];
  } else {
    const now = new Date();
    endMinutes = now.getHours() * 60 + now.getMinutes();
  }

  const total = Math.max(0, endMinutes - startMinutes);
  const breaks = getBreakMinutes(record);

  return Math.max(0, total - breaks);
}

function formatMinutes(minutes) {
  if (!minutes) return "0m";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (!hours) {
    return `${mins}m`;
  }

  return `${hours}h ${mins}m`;
}

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getAttendanceStatus(record) {
  if (!record) return "Not Started";

  if (record.workStatus === "On Break") {
    return "On Break";
  }

  if (record.workStatus === "Completed" || record.checkOut) {
    return "Completed";
  }

  if (record.checkIn) {
    return "Working";
  }

  return record.status || "Not Started";
}

function ProgressBar({ value }) {
  const safeValue = Math.min(
    100,
    Math.max(0, Number(value) || 0)
  );

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{
            width: `${safeValue}%`,
          }}
        />
      </div>

      <span className="w-10 text-right text-xs font-semibold text-ink-600 dark:text-ink-300">
        {safeValue}%
      </span>
    </div>
  );
}

function StatCard({ label, value, description }) {
  return (
    <div className="card p-5">
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
  );
}

function SectionCard({
  title,
  description,
  children,
}) {
  return (
    <section className="card p-5">
      <div className="mb-5">
        <h2 className="font-display font-semibold text-ink-900 dark:text-white">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-xs text-ink-400">
            {description}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50 p-6 text-center text-sm text-ink-400 dark:border-ink-700 dark:bg-ink-900">
      {text}
    </div>
  );
}

/* =========================================================
   ANALYTICS PAGE
========================================================= */

export default function Analytics() {
  const {
    employees = [],
    attendance = [],
    tasks = [],
    leaves = [],
    reports = [],
  } = useData();

  const today = todayStr();

  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState(employees[0]?.id || "");

  const selectedEmployee = employees.find(
    (employee) => employee.id === selectedEmployeeId
  );

  /* =======================================================
     SELECTED EMPLOYEE DATA
  ======================================================= */

  const employeeTasks = useMemo(() => {
    return tasks.filter(
      (task) => task.employeeId === selectedEmployeeId
    );
  }, [tasks, selectedEmployeeId]);

  const employeeAttendance = useMemo(() => {
    return attendance
      .filter(
        (record) =>
          record.employeeId === selectedEmployeeId
      )
      .sort((a, b) => {
        const aDate = a.date || "";
        const bDate = b.date || "";

        return aDate < bDate ? 1 : -1;
      });
  }, [attendance, selectedEmployeeId]);

  const employeeReports = useMemo(() => {
    return reports
      .filter(
        (report) =>
          report.employeeId === selectedEmployeeId
      )
      .sort((a, b) => {
        const aDate = a.date || "";
        const bDate = b.date || "";

        return aDate < bDate ? 1 : -1;
      });
  }, [reports, selectedEmployeeId]);

  const employeeLeaves = useMemo(() => {
    return leaves
      .filter(
        (leave) =>
          leave.employeeId === selectedEmployeeId
      )
      .sort((a, b) => {
        const aDate = a.startDate || a.date || "";
        const bDate = b.startDate || b.date || "";

        return aDate < bDate ? 1 : -1;
      });
  }, [leaves, selectedEmployeeId]);

  const todayAttendance = employeeAttendance.find(
    (record) => record.date === today
  );

  const completedTasks = employeeTasks.filter(
    (task) => task.status === "Done"
  );

  const pendingTasks = employeeTasks.filter(
    (task) => task.status !== "Done"
  );

  const employeeProgress =
    employeeTasks.length > 0
      ? Math.round(
          employeeTasks.reduce(
            (sum, task) =>
              sum + getTaskProgress(task),
            0
          ) / employeeTasks.length
        )
      : 0;

  const attendanceDays = employeeAttendance.filter(
    (record) =>
      record.status !== "Absent" &&
      record.checkIn
  ).length;

  const absentDays = employeeAttendance.filter(
    (record) => record.status === "Absent"
  ).length;

  const leaveCount = employeeLeaves.length;

  const approvedLeaves = employeeLeaves.filter(
    (leave) => leave.status === "Approved"
  ).length;

  const pendingLeaves = employeeLeaves.filter(
    (leave) => leave.status === "Pending"
  ).length;

  const totalWorkingMinutes =
    employeeAttendance.reduce(
      (total, record) =>
        total + getWorkingMinutes(record),
      0
    );

  const totalBreakMinutes =
    employeeAttendance.reduce(
      (total, record) =>
        total + getBreakMinutes(record),
      0
    );

  const averageWorkingMinutes =
    attendanceDays > 0
      ? Math.round(
          totalWorkingMinutes / attendanceDays
        )
      : 0;

  const reportsSubmitted = employeeReports.length;

  const reportsWithProgress =
    employeeReports.filter(
      (report) =>
        typeof report.progress === "number"
    );

  const averageReportProgress =
    reportsWithProgress.length > 0
      ? Math.round(
          reportsWithProgress.reduce(
            (sum, report) =>
              sum + Number(report.progress || 0),
            0
          ) / reportsWithProgress.length
        )
      : employeeProgress;

  /* =======================================================
     TEAM DATA
  ======================================================= */

  const teamProgress = useMemo(() => {
    return employees
      .map((employee) => {
        const employeeTasks = tasks.filter(
          (task) =>
            task.employeeId === employee.id
        );

        const completed = employeeTasks.filter(
          (task) => task.status === "Done"
        ).length;

        const progress =
          employeeTasks.length > 0
            ? Math.round(
                employeeTasks.reduce(
                  (sum, task) =>
                    sum + getTaskProgress(task),
                  0
                ) / employeeTasks.length
              )
            : 0;

        return {
          employee,
          tasks: employeeTasks.length,
          completed,
          progress,
        };
      })
      .sort((a, b) => b.progress - a.progress);
  }, [employees, tasks]);

  const teamTaskCount = tasks.length;

  const teamCompletedTasks = tasks.filter(
    (task) => task.status === "Done"
  ).length;

  const teamProgressValue =
    teamTaskCount > 0
      ? Math.round(
          tasks.reduce(
            (sum, task) =>
              sum + getTaskProgress(task),
            0
          ) / teamTaskCount
        )
      : 0;

  const teamPresentToday = employees.filter(
    (employee) =>
      attendance.some(
        (record) =>
          record.employeeId === employee.id &&
          record.date === today &&
          record.checkIn
      )
  ).length;

  return (
    <div className="space-y-6">
      {/* ===================================================
          HEADER
      =================================================== */}

      <section>
        <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
          PRview Admin Portal
        </p>

        <h1 className="mt-1 font-display text-2xl font-semibold text-ink-900 dark:text-white">
          Employee Analytics
        </h1>

        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Review the complete performance and work analytics of each employee.
        </p>
      </section>

      {/* ===================================================
          EMPLOYEE SELECTOR
      =================================================== */}

      <section className="card p-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-medium text-ink-700 dark:text-ink-200">
              Select Employee
            </label>

            <select
              value={selectedEmployeeId}
              onChange={(event) =>
                setSelectedEmployeeId(
                  event.target.value
                )
              }
              className="input w-full"
            >
              <option value="">
                Select an employee
              </option>

              {employees.map((employee) => (
                <option
                  key={employee.id}
                  value={employee.id}
                >
                  {employee.name} ·{" "}
                  {employee.department}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            {selectedEmployee && (
              <div className="w-full rounded-xl bg-brand-50 p-4 dark:bg-brand-950">
                <p className="text-xs text-brand-600 dark:text-brand-300">
                  Currently viewing
                </p>

                <p className="mt-1 font-semibold text-brand-800 dark:text-brand-200">
                  {selectedEmployee.name}
                </p>

                <p className="mt-1 text-xs text-brand-600 dark:text-brand-400">
                  {selectedEmployee.role} ·{" "}
                  {selectedEmployee.department}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {!selectedEmployee ? (
        <section className="card p-10 text-center">
          <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-white">
            Select an employee
          </h2>

          <p className="mt-2 text-sm text-ink-400">
            Select an employee above to view their individual analytics.
          </p>
        </section>
      ) : (
        <>
          {/* =================================================
              EMPLOYEE PROFILE
          ================================================= */}

          <section className="card p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  {selectedEmployee.name
                    ?.split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </div>

                <div>
                  <h2 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">
                    {selectedEmployee.name}
                  </h2>

                  <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                    {selectedEmployee.role} ·{" "}
                    {selectedEmployee.department}
                  </p>

                  <p className="mt-1 text-xs text-ink-400">
                    {selectedEmployee.email ||
                      "No email available"}
                  </p>
                </div>
              </div>

              <div>
                <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  {getAttendanceStatus(
                    todayAttendance
                  )}
                </span>
              </div>
            </div>
          </section>

          {/* =================================================
              PERFORMANCE SUMMARY
          ================================================= */}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            <StatCard
              label="Task Progress"
              value={`${employeeProgress}%`}
              description="Overall task completion"
            />

            <StatCard
              label="Tasks Completed"
              value={completedTasks.length}
              description={`of ${employeeTasks.length} tasks`}
            />

            <StatCard
              label="Attendance"
              value={`${attendanceDays} days`}
              description={`${absentDays} absent`}
            />

            <StatCard
              label="Reports"
              value={reportsSubmitted}
              description="Reports submitted"
            />

            <StatCard
              label="Average Workday"
              value={formatMinutes(
                averageWorkingMinutes
              )}
              description="Average working time"
            />
          </div>

          {/* =================================================
              TODAY'S STATUS
          ================================================= */}

          <SectionCard
            title="Today's Attendance"
            description={`Attendance details for ${selectedEmployee.name} on ${formatDate(
              today
            )}.`}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-ink-100 p-4 dark:border-ink-800">
                <p className="text-xs text-ink-400">
                  Status
                </p>

                <p className="mt-2 font-semibold text-ink-900 dark:text-white">
                  {getAttendanceStatus(
                    todayAttendance
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-ink-100 p-4 dark:border-ink-800">
                <p className="text-xs text-ink-400">
                  Login
                </p>

                <p className="mt-2 font-semibold text-ink-900 dark:text-white">
                  {formatTime(
                    todayAttendance?.checkIn
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-ink-100 p-4 dark:border-ink-800">
                <p className="text-xs text-ink-400">
                  Logout
                </p>

                <p className="mt-2 font-semibold text-ink-900 dark:text-white">
                  {formatTime(
                    todayAttendance?.checkOut
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-ink-100 p-4 dark:border-ink-800">
                <p className="text-xs text-ink-400">
                  Today's Break
                </p>

                <p className="mt-2 font-semibold text-ink-900 dark:text-white">
                  {formatMinutes(
                    getBreakMinutes(
                      todayAttendance
                    )
                  )}
                </p>
              </div>
            </div>

            {todayAttendance?.breaks?.length > 0 && (
              <div className="mt-5">
                <p className="mb-3 text-sm font-medium text-ink-700 dark:text-ink-200">
                  Today's Break Details
                </p>

                <div className="space-y-2">
                  {todayAttendance.breaks.map(
                    (breakItem, index) => (
                      <div
                        key={
                          breakItem.id ||
                          `${breakItem.start}-${index}`
                        }
                        className="flex flex-col gap-2 rounded-lg border border-ink-100 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-ink-800"
                      >
                        <div>
                          <p className="text-sm font-medium text-ink-700 dark:text-ink-200">
                            Break {index + 1}
                          </p>

                          <p className="text-xs text-ink-400">
                            {formatTime(
                              breakItem.start
                            )}{" "}
                            →{" "}
                            {formatTime(
                              breakItem.end
                            )}
                          </p>
                        </div>

                        <span className="text-xs font-medium text-ink-500">
                          {breakItem.end
                            ? formatMinutes(
                                (() => {
                                  const start =
                                    breakItem.start
                                      .split(":")
                                      .map(Number);

                                  const end =
                                    breakItem.end
                                      .split(":")
                                      .map(Number);

                                  return Math.max(
                                    0,
                                    end[0] * 60 +
                                      end[1] -
                                      (start[0] *
                                        60 +
                                        start[1])
                                  );
                                })()
                              )
                            : "Ongoing"}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </SectionCard>

          {/* =================================================
              WORK TIME ANALYTICS
          ================================================= */}

          <SectionCard
            title="Working Time Analytics"
            description="Total working and break time recorded for this employee."
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl bg-brand-50 p-5 dark:bg-brand-950">
                <p className="text-xs text-brand-600 dark:text-brand-300">
                  Total Working Time
                </p>

                <p className="mt-2 text-2xl font-semibold text-brand-700 dark:text-brand-300">
                  {formatMinutes(
                    totalWorkingMinutes
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 p-5 dark:bg-amber-950">
                <p className="text-xs text-amber-600 dark:text-amber-300">
                  Total Break Time
                </p>

                <p className="mt-2 text-2xl font-semibold text-amber-700 dark:text-amber-300">
                  {formatMinutes(
                    totalBreakMinutes
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 p-5 dark:bg-emerald-950">
                <p className="text-xs text-emerald-600 dark:text-emerald-300">
                  Average Workday
                </p>

                <p className="mt-2 text-2xl font-semibold text-emerald-700 dark:text-emerald-300">
                  {formatMinutes(
                    averageWorkingMinutes
                  )}
                </p>
              </div>
            </div>
          </SectionCard>

          {/* =================================================
              TASK ANALYTICS
          ================================================= */}

          <SectionCard
            title="Task Performance"
            description={`Task-by-task performance for ${selectedEmployee.name}.`}
          >
            <div className="mb-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-ink-100 p-4 dark:border-ink-800">
                <p className="text-xs text-ink-400">
                  Total Tasks
                </p>

                <p className="mt-2 text-2xl font-semibold text-ink-900 dark:text-white">
                  {employeeTasks.length}
                </p>
              </div>

              <div className="rounded-xl border border-ink-100 p-4 dark:border-ink-800">
                <p className="text-xs text-ink-400">
                  Completed
                </p>

                <p className="mt-2 text-2xl font-semibold text-emerald-600">
                  {completedTasks.length}
                </p>
              </div>

              <div className="rounded-xl border border-ink-100 p-4 dark:border-ink-800">
                <p className="text-xs text-ink-400">
                  Pending
                </p>

                <p className="mt-2 text-2xl font-semibold text-amber-600">
                  {pendingTasks.length}
                </p>
              </div>
            </div>

            <div className="space-y-3">
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
                        Due {task.dueDate || "—"} ·{" "}
                        {task.priority || "Medium"} priority
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                        task.status === "Done"
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
                      value={getTaskProgress(task)}
                    />
                  </div>
                </div>
              ))}

              {employeeTasks.length === 0 && (
                <EmptyState text="No tasks are assigned to this employee." />
              )}
            </div>
          </SectionCard>

          {/* =================================================
              ATTENDANCE HISTORY
          ================================================= */}

          <SectionCard
            title="Attendance Analytics"
            description="Attendance history for the selected employee."
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left text-xs text-ink-400 dark:border-ink-800">
                    <th className="p-4 font-medium">
                      Date
                    </th>

                    <th className="p-4 font-medium">
                      Status
                    </th>

                    <th className="p-4 font-medium">
                      Login
                    </th>

                    <th className="p-4 font-medium">
                      Logout
                    </th>

                    <th className="p-4 font-medium">
                      Break
                    </th>

                    <th className="p-4 font-medium">
                      Working
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {employeeAttendance
                    .slice(0, 30)
                    .map((record) => (
                      <tr
                        key={record.id}
                        className="border-b border-ink-100 last:border-0 dark:border-ink-800"
                      >
                        <td className="p-4 text-ink-700 dark:text-ink-200">
                          {formatDate(record.date)}
                        </td>

                        <td className="p-4">
                          <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                            {getAttendanceStatus(
                              record
                            )}
                          </span>
                        </td>

                        <td className="p-4">
                          {formatTime(
                            record.checkIn
                          )}
                        </td>

                        <td className="p-4">
                          {formatTime(
                            record.checkOut
                          )}
                        </td>

                        <td className="p-4">
                          {formatMinutes(
                            getBreakMinutes(
                              record
                            )
                          )}
                        </td>

                        <td className="p-4">
                          {formatMinutes(
                            getWorkingMinutes(
                              record
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {employeeAttendance.length === 0 && (
              <EmptyState text="No attendance records are available." />
            )}
          </SectionCard>

          {/* =================================================
              DAILY REPORT ANALYTICS
          ================================================= */}

          <SectionCard
            title="Daily Report Analytics"
            description={`Daily reports submitted by ${selectedEmployee.name}.`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div className="rounded-xl border border-ink-100 p-4 dark:border-ink-800">
                <p className="text-xs text-ink-400">
                  Reports Submitted
                </p>

                <p className="mt-2 text-2xl font-semibold text-ink-900 dark:text-white">
                  {reportsSubmitted}
                </p>
              </div>

              <div className="rounded-xl border border-ink-100 p-4 dark:border-ink-800">
                <p className="text-xs text-ink-400">
                  Average Report Progress
                </p>

                <p className="mt-2 text-2xl font-semibold text-brand-600">
                  {averageReportProgress}%
                </p>
              </div>

              <div className="rounded-xl border border-ink-100 p-4 dark:border-ink-800">
                <p className="text-xs text-ink-400">
                  Latest Report
                </p>

                <p className="mt-2 text-lg font-semibold text-ink-900 dark:text-white">
                  {employeeReports[0]
                    ? formatDate(
                        employeeReports[0].date
                      )
                    : "—"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {employeeReports
                .slice(0, 10)
                .map((report) => (
                  <div
                    key={report.id}
                    className="rounded-xl border border-ink-100 p-4 dark:border-ink-800"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium text-ink-800 dark:text-ink-100">
                          {formatDate(
                            report.date
                          )}
                        </p>

                        <p className="mt-1 text-xs text-ink-400">
                          Daily report
                        </p>
                      </div>

                      <div className="w-full md:w-48">
                        <ProgressBar
                          value={
                            report.progress ??
                            employeeProgress
                          }
                        />
                      </div>
                    </div>

                    {report.completed && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-ink-500">
                          Completed
                        </p>

                        <p className="mt-1 text-sm leading-6 text-ink-700 dark:text-ink-300">
                          {report.completed}
                        </p>
                      </div>
                    )}

                    {report.blockers && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-amber-600">
                          Blockers
                        </p>

                        <p className="mt-1 text-sm leading-6 text-ink-700 dark:text-ink-300">
                          {report.blockers}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

              {employeeReports.length === 0 && (
                <EmptyState text="No daily reports are available for this employee." />
              )}
            </div>
          </SectionCard>

          {/* =================================================
              LEAVE ANALYTICS
          ================================================= */}

          <SectionCard
            title="Leave Analytics"
            description={`Leave history for ${selectedEmployee.name}.`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div className="rounded-xl border border-ink-100 p-4 dark:border-ink-800">
                <p className="text-xs text-ink-400">
                  Total Requests
                </p>

                <p className="mt-2 text-2xl font-semibold text-ink-900 dark:text-white">
                  {leaveCount}
                </p>
              </div>

              <div className="rounded-xl border border-ink-100 p-4 dark:border-ink-800">
                <p className="text-xs text-ink-400">
                  Approved
                </p>

                <p className="mt-2 text-2xl font-semibold text-emerald-600">
                  {approvedLeaves}
                </p>
              </div>

              <div className="rounded-xl border border-ink-100 p-4 dark:border-ink-800">
                <p className="text-xs text-ink-400">
                  Pending
                </p>

                <p className="mt-2 text-2xl font-semibold text-amber-600">
                  {pendingLeaves}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {employeeLeaves
                .slice(0, 10)
                .map((leave) => (
                  <div
                    key={leave.id}
                    className="flex flex-col gap-3 rounded-xl border border-ink-100 p-4 md:flex-row md:items-center md:justify-between dark:border-ink-800"
                  >
                    <div>
                      <p className="font-medium text-ink-800 dark:text-ink-100">
                        {leave.type ||
                          "Leave Request"}
                      </p>

                      <p className="mt-1 text-xs text-ink-400">
                        {leave.startDate ||
                          leave.date ||
                          "—"}{" "}
                        →{" "}
                        {leave.endDate ||
                          leave.date ||
                          "—"}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                        leave.status ===
                        "Approved"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : leave.status ===
                            "Rejected"
                          ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {leave.status ||
                        "Pending"}
                    </span>
                  </div>
                ))}

              {employeeLeaves.length === 0 && (
                <EmptyState text="No leave records are available for this employee." />
              )}
            </div>
          </SectionCard>

          {/* =================================================
              PERFORMANCE TREND
          ================================================= */}

          <SectionCard
            title="Recent Performance"
            description="Recent daily report progress for this employee."
          >
            {employeeReports.length > 0 ? (
              <div className="space-y-4">
                {employeeReports
                  .slice(0, 7)
                  .reverse()
                  .map((report) => {
                    const value =
                      report.progress ??
                      employeeProgress;

                    return (
                      <div
                        key={report.id}
                        className="grid grid-cols-[80px_1fr_50px] items-center gap-4"
                      >
                        <span className="text-xs text-ink-400">
                          {formatDate(
                            report.date
                          )}
                        </span>

                        <ProgressBar
                          value={value}
                        />

                        <span className="text-right text-xs font-semibold text-ink-700 dark:text-ink-200">
                          {value}%
                        </span>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <EmptyState text="Submit daily reports to start building the performance history." />
            )}
          </SectionCard>
        </>
      )}

      {/* =====================================================
          TEAM OVERVIEW
      ====================================================== */}

      <section className="pt-4">
        <div className="mb-5">
          <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
            Team Overview
          </p>

          <h2 className="mt-1 font-display text-xl font-semibold text-ink-900 dark:text-white">
            Company-wide Analytics
          </h2>

          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            Quick comparison across all employees.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <StatCard
            label="Team Employees"
            value={employees.length}
            description="Active employee records"
          />

          <StatCard
            label="Present Today"
            value={`${teamPresentToday}/${employees.length}`}
            description="Employees checked in"
          />

          <StatCard
            label="Team Progress"
            value={`${teamProgressValue}%`}
            description={`${teamCompletedTasks} of ${teamTaskCount} tasks completed`}
          />
        </div>

        <SectionCard
          title="Employee Performance Ranking"
          description="Employees ranked by overall task progress."
        >
          <div className="space-y-4">
            {teamProgress.map((item, index) => (
              <div
                key={item.employee.id}
                className="rounded-xl border border-ink-100 p-4 dark:border-ink-800"
              >
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                      {index + 1}
                    </span>

                    <div>
                      <p className="text-sm font-medium text-ink-800 dark:text-ink-100">
                        {item.employee.name}
                      </p>

                      <p className="text-xs text-ink-400">
                        {item.tasks} tasks ·{" "}
                        {item.completed} completed
                      </p>
                    </div>
                  </div>

                  <span className="text-sm font-semibold text-ink-700 dark:text-ink-200">
                    {item.progress}%
                  </span>
                </div>

                <ProgressBar
                  value={item.progress}
                />
              </div>
            ))}

            {teamProgress.length === 0 && (
              <EmptyState text="No employee performance data is available." />
            )}
          </div>
        </SectionCard>
      </section>
    </div>
  );
}