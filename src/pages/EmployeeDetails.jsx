import { useMemo } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
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

  const [hours, minutes] = time
    .split(":")
    .map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
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

  let difference =
    endMinutes - startMinutes;

  if (difference < 0) {
    difference += 24 * 60;
  }

  return difference;
}

function formatDuration(totalMinutes) {
  if (!totalMinutes || totalMinutes <= 0) {
    return "0m";
  }

  const hours = Math.floor(
    totalMinutes / 60
  );

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

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(
    `${date}T00:00:00`
  );

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

function getStatus(
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

  if (status === "Approved") {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
  }

  if (status === "Rejected") {
    return "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300";
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

function SectionCard({
  title,
  description,
  children,
  action,
}) {
  return (
    <section className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-ink-100 p-5 dark:border-ink-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display font-semibold text-ink-900 dark:text-white">
            {title}
          </h3>

          {description && (
            <p className="mt-1 text-xs text-ink-400">
              {description}
            </p>
          )}
        </div>

        {action}
      </div>

      <div className="p-5">
        {children}
      </div>
    </section>
  );
}

export default function EmployeeDetails() {
  const { employeeId } = useParams();
  const navigate = useNavigate();

  const {
    employees = [],
    attendance = [],
    breaks = [],
    tasks = [],
    reports = [],
    leaves = [],
  } = useData();

  const employee = employees.find(
    (item) => item.id === employeeId
  );

  const today = localDate();

  const todayAttendance =
    attendance.find(
      (record) =>
        record.employeeId === employeeId &&
        record.date === today
    );

  const activeBreak =
    getActiveBreak(
      breaks,
      employeeId,
      today
    );

  const todayBreakMinutes =
    getBreakMinutes(
      breaks,
      employeeId,
      today
    );

  const todayWorkingMinutes =
    getWorkingMinutes(
      todayAttendance,
      breaks
    );

  const todayStatus =
    getStatus(
      todayAttendance,
      activeBreak
    );

  const employeeTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.employeeId === employeeId
      ),
    [tasks, employeeId]
  );

  const completedTasks =
    employeeTasks.filter(
      (task) =>
        task.status === "Done"
    ).length;

  const pendingTasks =
    employeeTasks.filter(
      (task) =>
        task.status !== "Done"
    ).length;

  const overallProgress =
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

  const employeeAttendance =
    useMemo(
      () =>
        attendance
          .filter(
            (record) =>
              record.employeeId ===
              employeeId
          )
          .sort((a, b) =>
            a.date < b.date ? 1 : -1
          ),
      [attendance, employeeId]
    );

  const employeeBreaks =
    useMemo(
      () =>
        breaks
          .filter(
            (item) =>
              item.employeeId ===
              employeeId
          )
          .sort((a, b) => {
            if (a.date !== b.date) {
              return a.date < b.date
                ? 1
                : -1;
            }

            return a.start < b.start
              ? 1
              : -1;
          }),
      [breaks, employeeId]
    );

  const employeeReports =
    useMemo(
      () =>
        reports
          .filter(
            (report) =>
              report.employeeId ===
              employeeId
          )
          .sort((a, b) =>
            a.date < b.date ? 1 : -1
          ),
      [reports, employeeId]
    );

  const employeeLeaves =
    useMemo(
      () =>
        leaves
          .filter(
            (leave) =>
              leave.employeeId ===
              employeeId
          )
          .sort((a, b) =>
            a.startDate < b.startDate
              ? 1
              : -1
          ),
      [leaves, employeeId]
    );

  const totalWorkingMinutes =
    employeeAttendance.reduce(
      (total, record) =>
        total +
        getWorkingMinutes(
          record,
          breaks
        ),
      0
    );

  const averageWorkingMinutes =
    employeeAttendance.length > 0
      ? Math.round(
          totalWorkingMinutes /
            employeeAttendance.length
        )
      : 0;

  const totalBreakMinutes =
    employeeBreaks.reduce(
      (total, item) => {
        if (!item.start) {
          return total;
        }

        return (
          total +
          minutesBetween(
            item.start,
            item.end ||
              item.start
          )
        );
      },
      0
    );

  const approvedLeaves =
    employeeLeaves.filter(
      (leave) =>
        leave.status === "Approved"
    ).length;

  const pendingLeaves =
    employeeLeaves.filter(
      (leave) =>
        leave.status === "Pending"
    ).length;

  if (!employee) {
    return (
      <div className="card p-10 text-center">
        <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-white">
          Employee not found
        </h2>

        <p className="mt-2 text-sm text-ink-400">
          The employee record may have been
          removed or does not exist.
        </p>

        <button
          className="btn-primary mt-5"
          onClick={() =>
            navigate("/employees")
          }
        >
          Back to Employees
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-lg font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              {employee.name
                ?.split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </span>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">
                  {employee.name}
                </h2>

                <StatusPill
                  status={
                    employee.status ||
                    "Active"
                  }
                />
              </div>

              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                {employee.role ||
                  "Employee"}
                {employee.department
                  ? ` · ${employee.department}`
                  : ""}
              </p>

              <div className="mt-2 flex flex-wrap gap-4 text-xs text-ink-400">
                {employee.email && (
                  <span>
                    {employee.email}
                  </span>
                )}

                {employee.phone && (
                  <span>
                    {employee.phone}
                  </span>
                )}

                {employee.joinDate && (
                  <span>
                    Joined{" "}
                    {formatDate(
                      employee.joinDate
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to={`/analytics?employee=${employee.id}`}
              className="btn-outline"
            >
              View Analytics
            </Link>

            <button
              className="btn-outline"
              onClick={() =>
                navigate("/employees")
              }
            >
              Back
            </button>
          </div>
        </div>
      </section>

      {/* Today's status */}
      <section className="card p-5">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display font-semibold text-ink-900 dark:text-white">
              Today's Work Status
            </h3>

            <p className="mt-1 text-xs text-ink-400">
              {formatDate(today)}
            </p>
          </div>

          <StatusPill
            status={todayStatus}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Login"
            value={formatTime(
              todayAttendance?.checkIn
            )}
            description="Today's login"
            icon="→"
          />

          <StatCard
            label="Logout"
            value={formatTime(
              todayAttendance?.checkOut
            )}
            description="Today's logout"
            icon="←"
          />

          <StatCard
            label="Break"
            value={formatDuration(
              todayBreakMinutes
            )}
            description={
              activeBreak
                ? "Currently on break"
                : "Today's breaks"
            }
            icon="☕"
          />

          <StatCard
            label="Working"
            value={formatDuration(
              todayWorkingMinutes
            )}
            description="Actual working time"
            icon="◷"
          />

          <StatCard
            label="Tasks"
            value={`${completedTasks}/${employeeTasks.length}`}
            description={`${overallProgress}% complete`}
            icon="✓"
          />
        </div>

        {activeBreak && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/20">
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
                    {
                      activeBreak.location
                    }
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
          </div>
        )}
      </section>

      {/* Performance */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Overall Progress"
          value={`${overallProgress}%`}
          description="All assigned tasks"
          icon="↗"
        />

        <StatCard
          label="Completed Tasks"
          value={completedTasks}
          description="Finished tasks"
          icon="✓"
        />

        <StatCard
          label="Pending Tasks"
          value={pendingTasks}
          description="Still open"
          icon="!"
        />

        <StatCard
          label="Avg. Workday"
          value={formatDuration(
            averageWorkingMinutes
          )}
          description="Average actual time"
          icon="◷"
        />

        <StatCard
          label="Reports"
          value={employeeReports.length}
          description="Submitted reports"
          icon="▤"
        />
      </div>

      {/* Tasks */}
      <SectionCard
        title="Task Performance"
        description="Every task assigned to this employee"
        action={
          <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            {overallProgress}% overall
          </span>
        }
      >
        <div className="space-y-4">
          {employeeTasks.map((task) => {
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

                    {task.description && (
                      <p className="mt-1 text-xs text-ink-400">
                        {task.description}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-ink-400">
                      Due{" "}
                      {formatDate(
                        task.dueDate
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {task.priority && (
                      <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                        {task.priority}
                      </span>
                    )}

                    <StatusPill
                      status={
                        task.status ||
                        "To Do"
                      }
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <ProgressBar
                    progress={progress}
                  />
                </div>
              </div>
            );
          })}

          {employeeTasks.length === 0 && (
            <p className="py-8 text-center text-sm text-ink-400">
              No tasks assigned to this
              employee.
            </p>
          )}
        </div>
      </SectionCard>

      {/* Attendance */}
      <SectionCard
        title="Attendance History"
        description="Login, logout, breaks and actual working time"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
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
                  Break
                </th>

                <th className="pb-3 font-medium">
                  Working
                </th>

                <th className="pb-3 font-medium">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {employeeAttendance
                .slice(0, 30)
                .map((record) => {
                  const recordBreak =
                    getBreakMinutes(
                      breaks,
                      employeeId,
                      record.date
                    );

                  const recordWorking =
                    getWorkingMinutes(
                      record,
                      breaks
                    );

                  const recordActiveBreak =
                    getActiveBreak(
                      breaks,
                      employeeId,
                      record.date
                    );

                  const recordStatus =
                    getStatus(
                      record,
                      recordActiveBreak
                    );

                  return (
                    <tr
                      key={record.id}
                      className="border-b border-ink-50 last:border-0 dark:border-ink-800/60"
                    >
                      <td className="py-3 text-ink-700 dark:text-ink-200">
                        {formatDate(
                          record.date
                        )}
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

                      <td className="py-3 text-amber-600 dark:text-amber-400">
                        {formatDuration(
                          recordBreak
                        )}
                      </td>

                      <td className="py-3 font-medium text-emerald-600 dark:text-emerald-400">
                        {formatDuration(
                          recordWorking
                        )}
                      </td>

                      <td className="py-3">
                        <StatusPill
                          status={
                            recordStatus
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
                    colSpan={6}
                    className="py-8 text-center text-sm text-ink-400"
                  >
                    No attendance history
                    available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Break history */}
      <SectionCard
        title="Break History"
        description="All recorded breaks for this employee"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-400 dark:border-ink-800">
                <th className="pb-3 font-medium">
                  Date
                </th>

                <th className="pb-3 font-medium">
                  Reason
                </th>

                <th className="pb-3 font-medium">
                  Location
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
              </tr>
            </thead>

            <tbody>
              {employeeBreaks
                .slice(0, 40)
                .map((item) => {
                  const duration =
                    item.end
                      ? minutesBetween(
                          item.start,
                          item.end
                        )
                      : minutesBetween(
                          item.start,
                          currentTime()
                        );

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-ink-50 last:border-0 dark:border-ink-800/60"
                    >
                      <td className="py-3 text-ink-700 dark:text-ink-200">
                        {formatDate(
                          item.date
                        )}
                      </td>

                      <td className="py-3 text-ink-600 dark:text-ink-300">
                        {item.reason ||
                          "Break"}
                      </td>

                      <td className="py-3 text-ink-600 dark:text-ink-300">
                        {item.location ||
                          "—"}
                      </td>

                      <td className="py-3 text-ink-600 dark:text-ink-300">
                        {formatTime(
                          item.start
                        )}
                      </td>

                      <td className="py-3 text-ink-600 dark:text-ink-300">
                        {item.end
                          ? formatTime(
                              item.end
                            )
                          : "Active"}
                      </td>

                      <td className="py-3 font-medium text-amber-600 dark:text-amber-400">
                        {formatDuration(
                          duration
                        )}
                      </td>
                    </tr>
                  );
                })}

              {employeeBreaks.length ===
                0 && (
                <tr>
                  <td
                    colSpan={6}
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
      </SectionCard>

      {/* Daily reports */}
      <SectionCard
        title="Daily Reports"
        description="Reports submitted by this employee"
      >
        <div className="space-y-4">
          {employeeReports
            .slice(0, 10)
            .map((report) => (
              <div
                key={report.id}
                className="rounded-xl border border-ink-100 p-4 dark:border-ink-800"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-ink-800 dark:text-ink-100">
                      {formatDate(
                        report.date
                      )}
                    </p>

                    <p className="mt-1 text-xs text-ink-400">
                      Daily progress report
                    </p>
                  </div>

                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    {report.progress ??
                      overallProgress}
                    % progress
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                      Completed
                    </p>

                    <p className="mt-1 text-sm text-ink-700 dark:text-ink-200">
                      {report.completed ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                      Pending
                    </p>

                    <p className="mt-1 text-sm text-ink-700 dark:text-ink-200">
                      {report.pending ||
                        "—"}
                    </p>
                  </div>

                  {report.blockers && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                        Blockers
                      </p>

                      <p className="mt-1 text-sm text-ink-700 dark:text-ink-200">
                        {report.blockers}
                      </p>
                    </div>
                  )}

                  {report.tomorrowPlan && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                        Tomorrow's Plan
                      </p>

                      <p className="mt-1 text-sm text-ink-700 dark:text-ink-200">
                        {report.tomorrowPlan}
                      </p>
                    </div>
                  )}
                </div>

                {report.notes && (
                  <div className="mt-4 rounded-lg bg-ink-50 p-3 dark:bg-ink-900">
                    <p className="text-xs font-medium text-ink-400">
                      Notes
                    </p>

                    <p className="mt-1 text-sm text-ink-700 dark:text-ink-200">
                      {report.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}

          {employeeReports.length ===
            0 && (
            <p className="py-8 text-center text-sm text-ink-400">
              No daily reports submitted
              yet.
            </p>
          )}
        </div>
      </SectionCard>

      {/* Leave history */}
      <SectionCard
        title="Leave History"
        description="Leave requests for this employee"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-400 dark:border-ink-800">
                <th className="pb-3 font-medium">
                  Type
                </th>

                <th className="pb-3 font-medium">
                  Start
                </th>

                <th className="pb-3 font-medium">
                  End
                </th>

                <th className="pb-3 font-medium">
                  Status
                </th>

                <th className="pb-3 font-medium">
                  Applied
                </th>
              </tr>
            </thead>

            <tbody>
              {employeeLeaves
                .slice(0, 30)
                .map((leave) => (
                  <tr
                    key={leave.id}
                    className="border-b border-ink-50 last:border-0 dark:border-ink-800/60"
                  >
                    <td className="py-3 text-ink-700 dark:text-ink-200">
                      {leave.type ||
                        "Leave"}
                    </td>

                    <td className="py-3 text-ink-600 dark:text-ink-300">
                      {formatDate(
                        leave.startDate
                      )}
                    </td>

                    <td className="py-3 text-ink-600 dark:text-ink-300">
                      {formatDate(
                        leave.endDate
                      )}
                    </td>

                    <td className="py-3">
                      <StatusPill
                        status={
                          leave.status ||
                          "Pending"
                        }
                      />
                    </td>

                    <td className="py-3 text-ink-600 dark:text-ink-300">
                      {formatDate(
                        leave.appliedOn
                      )}
                    </td>
                  </tr>
                ))}

              {employeeLeaves.length ===
                0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-sm text-ink-400"
                  >
                    No leave history
                    available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
            <p className="text-xs text-ink-400">
              Approved
            </p>

            <p className="mt-1 text-xl font-semibold text-emerald-700 dark:text-emerald-300">
              {approvedLeaves}
            </p>
          </div>

          <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-950/30">
            <p className="text-xs text-ink-400">
              Pending
            </p>

            <p className="mt-1 text-xl font-semibold text-amber-700 dark:text-amber-300">
              {pendingLeaves}
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Quick links */}
      <section className="card p-5">
        <h3 className="font-display font-semibold text-ink-900 dark:text-white">
          Employee Management
        </h3>

        <p className="mt-1 text-xs text-ink-400">
          Quickly access this employee's
          related records.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to={`/analytics?employee=${employee.id}`}
            className="btn-primary"
          >
            Analytics
          </Link>

          <Link
            to={`/tasks?employee=${employee.id}`}
            className="btn-outline"
          >
            Tasks
          </Link>

          <Link
            to={`/attendance?employee=${employee.id}`}
            className="btn-outline"
          >
            Attendance
          </Link>

          <Link
            to={`/breaks?employee=${employee.id}`}
            className="btn-outline"
          >
            Breaks
          </Link>

          <Link
            to={`/daily-report?employee=${employee.id}`}
            className="btn-outline"
          >
            Daily Reports
          </Link>
        </div>
      </section>
    </div>
  );
}