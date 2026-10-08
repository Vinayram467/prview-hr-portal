import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth, ROLES } from "../context/AuthContext";
import { localDate, useData } from "../context/DataContext";

function todayStr() {
  return localDate();
}

function formatTime(time) {
  if (!time) return "—";

  const [hour, minute] = time.split(":");
  const date = new Date();

  date.setHours(Number(hour), Number(minute));

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function timeToMinutes(time) {
  if (!time) return null;

  const [hours, minutes] = time
    .split(":")
    .map(Number);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function formatMinutes(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return "0m";
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;

  return `${hours}h ${mins}m`;
}

function calculateDuration(start, end) {
  const startMinutes = timeToMinutes(start);

  if (startMinutes === null) {
    return 0;
  }

  const endMinutes =
    timeToMinutes(end) ??
    timeToMinutes(
      new Date().toTimeString().slice(0, 5)
    );

  if (
    endMinutes === null ||
    endMinutes < startMinutes
  ) {
    return 0;
  }

  return endMinutes - startMinutes;
}

function getTaskProgress(status) {
  if (status === "Done") return 100;
  if (status === "In Progress") return 50;
  return 0;
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

function StatusBadge({ status }) {
  const styles = {
    Present:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",

    Working:
      "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",

    Late:
      "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",

    Absent:
      "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",

    "On Break":
      "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",

    Done:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",

    "In Progress":
      "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",

    "To Do":
      "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300",

    Planned:
      "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",

    Completed:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",

    Pending:
      "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",

    Approved:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",

    Rejected:
      "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[status] ||
        "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300"
      }`}
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

export default function Analytics() {
  const { user } = useAuth();

  const {
    employees,
    attendance,
    tasks,
    breaks = [],
    reports = [],
    plans = [],
    leaves,
  } = useData();

  const [searchParams, setSearchParams] =
    useSearchParams();

  const employeeFromUrl =
    searchParams.get("employee");

  const defaultEmployee =
    user?.role === ROLES.EMPLOYEE
      ? user.employeeId
      : employeeFromUrl ||
        employees[0]?.id ||
        "";

  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState(defaultEmployee);

  const isEmployee =
    user?.role === ROLES.EMPLOYEE;

  const employeeId = isEmployee
    ? user.employeeId
    : selectedEmployeeId;

  const employee = employees.find(
    (item) => item.id === employeeId
  );

  const today = todayStr();

  const employeeAttendance = useMemo(() => {
    return attendance
      .filter(
        (record) =>
          record.employeeId === employeeId
      )
      .sort((a, b) =>
        a.date < b.date ? 1 : -1
      );
  }, [attendance, employeeId]);

  const employeeTasks = useMemo(() => {
    return tasks.filter(
      (task) =>
        task.employeeId === employeeId
    );
  }, [tasks, employeeId]);

  const employeeBreaks = useMemo(() => {
    return breaks
      .filter(
        (item) =>
          item.employeeId === employeeId
      )
      .sort((a, b) => {
        if (a.date !== b.date) {
          return a.date < b.date ? 1 : -1;
        }

        return a.startTime < b.startTime
          ? 1
          : -1;
      });
  }, [breaks, employeeId]);

  const employeeReports = useMemo(() => {
    return reports
      .filter(
        (report) =>
          report.employeeId === employeeId
      )
      .sort((a, b) =>
        a.date < b.date ? 1 : -1
      );
  }, [reports, employeeId]);

  const employeePlans = useMemo(() => {
    return plans
      .filter(
        (plan) =>
          plan.employeeId === employeeId
      )
      .sort((a, b) =>
        a.date < b.date ? 1 : -1
      );
  }, [plans, employeeId]);

  const employeeLeaves = useMemo(() => {
    return leaves
      .filter(
        (leave) =>
          leave.employeeId === employeeId
      )
      .sort((a, b) =>
        a.startDate < b.startDate ? 1 : -1
      );
  }, [leaves, employeeId]);

  const todayAttendance = employeeAttendance.find(
    (record) => record.date === today
  );

  const todayBreaks = employeeBreaks.filter(
    (item) => item.date === today
  );

  const activeBreak = todayBreaks.find(
    (item) =>
      item.startTime &&
      !item.endTime
  );

  const todayBreakMinutes =
    todayBreaks.reduce(
      (sum, item) =>
        sum +
        calculateDuration(
          item.startTime,
          item.endTime
        ),
      0
    );

  const todayWorkingMinutes =
    todayAttendance?.checkIn
      ? Math.max(
          0,
          calculateDuration(
            todayAttendance.checkIn,
            todayAttendance.checkOut
          ) - todayBreakMinutes
        )
      : 0;

  const completedTasks =
    employeeTasks.filter(
      (task) => task.status === "Done"
    ).length;

  const pendingTasks =
    employeeTasks.filter(
      (task) => task.status !== "Done"
    );

  const taskProgress =
    employeeTasks.length > 0
      ? Math.round(
          employeeTasks.reduce(
            (sum, task) =>
              sum +
              getTaskProgress(
                task.status
              ),
            0
          ) /
            employeeTasks.length
        )
      : 0;

  const attendanceDays =
    employeeAttendance.length;

  const presentDays =
    employeeAttendance.filter(
      (record) =>
        record.status !== "Absent"
    ).length;

  const attendanceRate =
    attendanceDays > 0
      ? Math.round(
          (presentDays /
            attendanceDays) *
            100
        )
      : 0;

  const reportsSubmitted =
    employeeReports.length;

  const reportDates = new Set(
    employeeReports.map(
      (report) => report.date
    )
  );

  const reportRate =
    attendanceDays > 0
      ? Math.round(
          (reportsSubmitted /
            attendanceDays) *
            100
        )
      : 0;

  const totalBreakMinutes =
    employeeBreaks.reduce(
      (sum, item) =>
        sum +
        calculateDuration(
          item.startTime,
          item.endTime
        ),
      0
    );

  const totalWorkMinutes =
    employeeAttendance.reduce(
      (sum, record) => {
        if (!record.checkIn) {
          return sum;
        }

        const dayBreakMinutes =
          employeeBreaks
            .filter(
              (item) =>
                item.date ===
                record.date
            )
            .reduce(
              (breakSum, item) =>
                breakSum +
                calculateDuration(
                  item.startTime,
                  item.endTime
                ),
              0
            );

        return (
          sum +
          Math.max(
            0,
            calculateDuration(
              record.checkIn,
              record.checkOut
            ) -
              dayBreakMinutes
          )
        );
      },
      0
    );

  const averageWorkMinutes =
    presentDays > 0
      ? Math.round(
          totalWorkMinutes /
            presentDays
        )
      : 0;

  const upcomingPlans =
    employeePlans.filter(
      (plan) => plan.date >= today
    );

  const completedPlans =
    employeePlans.filter(
      (plan) =>
        plan.status === "Completed"
    ).length;

  const inProgressPlans =
    employeePlans.filter(
      (plan) =>
        plan.status === "In Progress"
    ).length;

  const pendingLeaves =
    employeeLeaves.filter(
      (leave) =>
        leave.status === "Pending"
    ).length;

  const approvedLeaves =
    employeeLeaves.filter(
      (leave) =>
        leave.status === "Approved"
    ).length;

  function handleEmployeeChange(
    event
  ) {
    const id = event.target.value;

    setSelectedEmployeeId(id);

    setSearchParams({
      employee: id,
    });
  }

  if (!employee) {
    return (
      <div className="card p-8 text-center">
        <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-white">
          No employee selected
        </h2>

        <p className="mt-2 text-sm text-ink-400">
          Select an employee to view
          their analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Employee selector */}

      {!isEmployee && (
        <section className="card p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
                Employee Analytics
              </p>

              <h2 className="mt-1 font-display text-xl font-semibold text-ink-900 dark:text-white">
                Individual Performance
              </h2>

              <p className="mt-1 text-xs text-ink-400">
                Select an employee to inspect
                their complete work history.
              </p>
            </div>

            <div className="w-full md:max-w-sm">
              <label className="label">
                Select employee
              </label>

              <select
                className="input"
                value={employeeId}
                onChange={
                  handleEmployeeChange
                }
              >
                {employees.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name} —{" "}
                      {item.role}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        </section>
      )}

      {/* Profile */}

      <section className="card overflow-hidden p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-xl font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              {employee.name
                .split(" ")
                .map(
                  (name) =>
                    name[0]
                )
                .join("")
                .slice(0, 2)}
            </div>

            <div>
              <h2 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">
                {employee.name}
              </h2>

              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                {employee.role}
              </p>

              <p className="mt-1 text-xs text-ink-400">
                {employee.department}
                {employee.email
                  ? ` · ${employee.email}`
                  : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusBadge
              status={employee.status}
            />

            {activeBreak && (
              <StatusBadge status="On Break" />
            )}

            {todayAttendance?.checkIn &&
              !todayAttendance?.checkOut &&
              !activeBreak && (
                <StatusBadge status="Working" />
              )}
          </div>
        </div>
      </section>

      {/* Main stats */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard
          label="Task Progress"
          value={`${taskProgress}%`}
          description={`${completedTasks}/${employeeTasks.length} completed`}
          icon="✓"
        />

        <StatCard
          label="Attendance"
          value={`${attendanceRate}%`}
          description={`${presentDays}/${attendanceDays} days`}
          icon="◉"
        />

        <StatCard
          label="Today Work"
          value={formatMinutes(
            todayWorkingMinutes
          )}
          description={
            todayAttendance?.checkIn
              ? "Net working time"
              : "Not checked in"
          }
          icon="◷"
        />

        <StatCard
          label="Avg Workday"
          value={formatMinutes(
            averageWorkMinutes
          )}
          description="Average net time"
          icon="⌛"
        />

        <StatCard
          label="Reports"
          value={`${reportsSubmitted}`}
          description={`${reportRate}% report rate`}
          icon="▤"
        />

        <StatCard
          label="Plans"
          value={`${upcomingPlans.length}`}
          description={`${completedPlans} completed`}
          icon="→"
        />
      </div>

      {/* Today's status */}

      <section className="card p-5">
        <div className="mb-5">
          <h3 className="font-display font-semibold text-ink-900 dark:text-white">
            Today's Status
          </h3>

          <p className="mt-1 text-xs text-ink-400">
            Current attendance and activity
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
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
              Working time
            </p>

            <p className="mt-2 font-semibold text-ink-900 dark:text-white">
              {formatMinutes(
                todayWorkingMinutes
              )}
            </p>
          </div>

          <div className="rounded-xl border border-ink-100 p-4 dark:border-ink-800">
            <p className="text-xs text-ink-400">
              Break time
            </p>

            <p className="mt-2 font-semibold text-ink-900 dark:text-white">
              {formatMinutes(
                todayBreakMinutes
              )}
            </p>

            {activeBreak && (
              <p className="mt-1 text-xs text-amber-600">
                Currently on break
              </p>
            )}
          </div>

          <div className="rounded-xl border border-ink-100 p-4 dark:border-ink-800">
            <p className="text-xs text-ink-400">
              Daily report
            </p>

            <div className="mt-2">
              <StatusBadge
                status={
                  reportDates.has(today)
                    ? "Completed"
                    : "Pending"
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tasks */}

      <section className="card p-5">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display font-semibold text-ink-900 dark:text-white">
              Task Performance
            </h3>

            <p className="mt-1 text-xs text-ink-400">
              Task-by-task performance for this
              employee
            </p>
          </div>

          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            {taskProgress}% overall
          </span>
        </div>

        <div className="space-y-4">
          {employeeTasks.map((task) => (
            <div
              key={task.id}
              className="rounded-xl border border-ink-100 p-4 dark:border-ink-800"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium text-ink-800 dark:text-ink-100">
                    {task.title}
                  </p>

                  <p className="mt-1 text-xs text-ink-400">
                    Due {task.dueDate}
                    {task.priority
                      ? ` · ${task.priority} priority`
                      : ""}
                  </p>
                </div>

                <StatusBadge
                  status={task.status}
                />
              </div>

              <div className="mt-4">
                <ProgressBar
                  progress={getTaskProgress(
                    task.status
                  )}
                />
              </div>
            </div>
          ))}

          {employeeTasks.length === 0 && (
            <p className="py-8 text-center text-sm text-ink-400">
              No tasks assigned to this employee.
            </p>
          )}
        </div>
      </section>

      {/* Attendance history */}

      <section className="card p-5">
        <div className="mb-5">
          <h3 className="font-display font-semibold text-ink-900 dark:text-white">
            Attendance History
          </h3>

          <p className="mt-1 text-xs text-ink-400">
            Recent attendance records
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-400 dark:border-ink-800">
                <th className="pb-3 font-medium">
                  Date
                </th>

                <th className="pb-3 font-medium">
                  Login
                </th>

                <th className="pb-3 font-medium">
                  Logout
                </th>

                <th className="pb-3 font-medium">
                  Working
                </th>

                <th className="pb-3 font-medium">
                  Break
                </th>

                <th className="pb-3 font-medium">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {employeeAttendance
                .slice(0, 14)
                .map((record) => {
                  const dayBreaks =
                    employeeBreaks.filter(
                      (item) =>
                        item.date ===
                        record.date
                    );

                  const breakMinutes =
                    dayBreaks.reduce(
                      (sum, item) =>
                        sum +
                        calculateDuration(
                          item.startTime,
                          item.endTime
                        ),
                      0
                    );

                  const workingMinutes =
                    record.checkIn
                      ? Math.max(
                          0,
                          calculateDuration(
                            record.checkIn,
                            record.checkOut
                          ) -
                            breakMinutes
                        )
                      : 0;

                  return (
                    <tr
                      key={record.id}
                      className="border-b border-ink-50 last:border-0 dark:border-ink-800/60"
                    >
                      <td className="py-3 text-ink-800 dark:text-ink-100">
                        {record.date}
                      </td>

                      <td className="py-3 text-ink-600 dark:text-ink-300">
                        {formatTime(
                          record.checkIn
                        )}
                      </td>

                      <td className="py-3 text-ink-600 dark:text-ink-300">
                        {formatTime(
                          record.checkOut
                        )}
                      </td>

                      <td className="py-3 text-ink-600 dark:text-ink-300">
                        {record.checkIn
                          ? formatMinutes(
                              workingMinutes
                            )
                          : "—"}
                      </td>

                      <td className="py-3 text-ink-600 dark:text-ink-300">
                        {formatMinutes(
                          breakMinutes
                        )}
                      </td>

                      <td className="py-3">
                        <StatusBadge
                          status={
                            record.status
                          }
                        />
                      </td>
                    </tr>
                  );
                })}

              {employeeAttendance.length ===
                0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="py-8 text-center text-sm text-ink-400"
                  >
                    No attendance records
                    available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Break history */}

      <section className="card p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-ink-900 dark:text-white">
              Break History
            </h3>

            <p className="mt-1 text-xs text-ink-400">
              Where the employee went and how
              long the break lasted
            </p>
          </div>

          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            {formatMinutes(
              totalBreakMinutes
            )}{" "}
            total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-400 dark:border-ink-800">
                <th className="pb-3 font-medium">
                  Date
                </th>

                <th className="pb-3 font-medium">
                  Start
                </th>

                <th className="pb-3 font-medium">
                  End
                </th>

                <th className="pb-3 font-medium">
                  Duration
                </th>

                <th className="pb-3 font-medium">
                  Where
                </th>

                <th className="pb-3 font-medium">
                  Reason
                </th>

                <th className="pb-3 font-medium">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {employeeBreaks
                .slice(0, 20)
                .map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-ink-50 last:border-0 dark:border-ink-800/60"
                  >
                    <td className="py-3 text-ink-800 dark:text-ink-100">
                      {item.date}
                    </td>

                    <td className="py-3 text-ink-600 dark:text-ink-300">
                      {formatTime(
                        item.startTime
                      )}
                    </td>

                    <td className="py-3 text-ink-600 dark:text-ink-300">
                      {formatTime(
                        item.endTime
                      )}
                    </td>

                    <td className="py-3 font-medium text-ink-700 dark:text-ink-200">
                      {formatMinutes(
                        calculateDuration(
                          item.startTime,
                          item.endTime
                        )
                      )}
                    </td>

                    <td className="py-3 text-ink-600 dark:text-ink-300">
                      {item.location ||
                        "—"}
                    </td>

                    <td className="max-w-[200px] truncate py-3 text-ink-600 dark:text-ink-300">
                      {item.reason || "—"}
                    </td>

                    <td className="py-3">
                      <StatusBadge
                        status={
                          item.endTime
                            ? "Completed"
                            : "On Break"
                        }
                      />
                    </td>
                  </tr>
                ))}

              {employeeBreaks.length ===
                0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="py-8 text-center text-sm text-ink-400"
                  >
                    No break records
                    available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Daily Reports */}

      <section className="card p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-ink-900 dark:text-white">
              Daily Reports
            </h3>

            <p className="mt-1 text-xs text-ink-400">
              Submitted work summaries
            </p>
          </div>

          <span className="text-sm font-semibold text-ink-700 dark:text-ink-200">
            {reportsSubmitted} submitted
          </span>
        </div>

        <div className="space-y-4">
          {employeeReports
            .slice(0, 7)
            .map((report) => (
              <div
                key={report.id}
                className="rounded-xl border border-ink-100 p-4 dark:border-ink-800"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-ink-800 dark:text-ink-100">
                      {report.date}
                    </p>

                    <p className="text-xs text-ink-400">
                      Daily work report
                    </p>
                  </div>

                  <StatusBadge status="Completed" />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-ink-400">
                      Completed
                    </p>

                    <p className="mt-1 whitespace-pre-wrap text-sm text-ink-600 dark:text-ink-300">
                      {report.completed ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-ink-400">
                      Pending
                    </p>

                    <p className="mt-1 whitespace-pre-wrap text-sm text-ink-600 dark:text-ink-300">
                      {report.pending ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-ink-400">
                      Blockers
                    </p>

                    <p className="mt-1 whitespace-pre-wrap text-sm text-ink-600 dark:text-ink-300">
                      {report.blockers ||
                        "None"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-ink-400">
                      Tomorrow's plan
                    </p>

                    <p className="mt-1 whitespace-pre-wrap text-sm text-ink-600 dark:text-ink-300">
                      {report.tomorrowPlan ||
                        "—"}
                    </p>
                  </div>
                </div>

                {report.notes && (
                  <div className="mt-4 border-t border-ink-100 pt-4 dark:border-ink-800">
                    <p className="text-xs font-medium text-ink-400">
                      Notes
                    </p>

                    <p className="mt-1 whitespace-pre-wrap text-sm text-ink-600 dark:text-ink-300">
                      {report.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}

          {employeeReports.length ===
            0 && (
            <p className="py-8 text-center text-sm text-ink-400">
              No daily reports submitted yet.
            </p>
          )}
        </div>
      </section>

      {/* Plans */}

      <section className="card p-5">
        <div className="mb-5">
          <h3 className="font-display font-semibold text-ink-900 dark:text-white">
            Employee Plans
          </h3>

          <p className="mt-1 text-xs text-ink-400">
            Planned and future work
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {employeePlans
            .slice(0, 8)
            .map((plan) => (
              <div
                key={plan.id}
                className="rounded-xl border border-ink-100 p-4 dark:border-ink-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink-800 dark:text-ink-100">
                      {plan.title}
                    </p>

                    <p className="mt-1 text-xs text-ink-400">
                      {plan.date}
                    </p>
                  </div>

                  <StatusBadge
                    status={
                      plan.status ||
                      "Planned"
                    }
                  />
                </div>

                {plan.priorities && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-ink-400">
                      Priorities
                    </p>

                    <p className="mt-1 whitespace-pre-wrap text-sm text-ink-600 dark:text-ink-300">
                      {plan.priorities}
                    </p>
                  </div>
                )}

                {plan.description && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-ink-400">
                      Action plan
                    </p>

                    <p className="mt-1 whitespace-pre-wrap text-sm text-ink-600 dark:text-ink-300">
                      {plan.description}
                    </p>
                  </div>
                )}
              </div>
            ))}

          {employeePlans.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-ink-400">
              No plans created yet.
            </p>
          )}
        </div>
      </section>

      {/* Leave analytics */}

      <section className="card p-5">
        <div className="mb-5">
          <h3 className="font-display font-semibold text-ink-900 dark:text-white">
            Leave Analytics
          </h3>

          <p className="mt-1 text-xs text-ink-400">
            Leave history for this employee
          </p>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-ink-100 p-4 dark:border-ink-800">
            <p className="text-xs text-ink-400">
              Total requests
            </p>

            <p className="mt-2 text-2xl font-semibold text-ink-900 dark:text-white">
              {employeeLeaves.length}
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

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-400 dark:border-ink-800">
                <th className="pb-3 font-medium">
                  Type
                </th>

                <th className="pb-3 font-medium">
                  Dates
                </th>

                <th className="pb-3 font-medium">
                  Reason
                </th>

                <th className="pb-3 font-medium">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {employeeLeaves.map(
                (leave) => (
                  <tr
                    key={leave.id}
                    className="border-b border-ink-50 last:border-0 dark:border-ink-800/60"
                  >
                    <td className="py-3 text-ink-700 dark:text-ink-200">
                      {leave.type}
                    </td>

                    <td className="py-3 text-ink-600 dark:text-ink-300">
                      {leave.startDate} →{" "}
                      {leave.endDate}
                    </td>

                    <td className="max-w-[250px] truncate py-3 text-ink-600 dark:text-ink-300">
                      {leave.reason ||
                        "—"}
                    </td>

                    <td className="py-3">
                      <StatusBadge
                        status={
                          leave.status
                        }
                      />
                    </td>
                  </tr>
                )
              )}

              {employeeLeaves.length ===
                0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="py-8 text-center text-sm text-ink-400"
                  >
                    No leave records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}