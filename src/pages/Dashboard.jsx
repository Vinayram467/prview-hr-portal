import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, ROLES } from "../context/AuthContext";
import { useData } from "../context/DataContext";

const todayStr = () => new Date().toISOString().slice(0, 10);

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

function formatMinutes(totalMinutes) {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return "0m";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;

  return `${hours}h ${minutes}m`;
}

function timeToMinutes(time) {
  if (!time) return null;

  const [hours, minutes] = time.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function getTaskProgress(status) {
  if (status === "Done") return 100;
  if (status === "In Progress") return 50;
  return 0;
}

function getTaskProgressClass(progress) {
  if (progress === 100) return "bg-emerald-500";
  if (progress >= 50) return "bg-brand-500";
  return "bg-ink-300 dark:bg-ink-600";
}

function StatCard({ label, value, description, icon }) {
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
          className={`h-full rounded-full transition-all ${getTaskProgressClass(
            progress
          )}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <span className="w-10 text-right text-xs font-semibold text-ink-600 dark:text-ink-300">
        {progress}%
      </span>
    </div>
  );
}

function StatusBadge({ status }) {
  const classes = {
    Working:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",

    "On Break":
      "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",

    Present:
      "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",

    Late:
      "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",

    Absent:
      "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",

    "Not Checked In":
      "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300",

    Completed:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",

    Missing:
      "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",

    Planned:
      "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",

    "In Progress":
      "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",

    "No Plan":
      "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
        classes[status] ||
        "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300"
      }`}
    >
      {status}
    </span>
  );
}

function calculateBreakMinutes(breakRecords, employeeId, today) {
  const employeeBreaks = breakRecords.filter(
    (item) =>
      item.employeeId === employeeId &&
      item.date === today
  );

  let total = 0;

  employeeBreaks.forEach((item) => {
    const start = timeToMinutes(item.startTime);

    if (start === null) return;

    const end =
      timeToMinutes(item.endTime) ??
      timeToMinutes(
        new Date().toTimeString().slice(0, 5)
      );

    if (end !== null && end >= start) {
      total += end - start;
    }
  });

  return total;
}

function getActiveBreak(breakRecords, employeeId, today) {
  return breakRecords.find(
    (item) =>
      item.employeeId === employeeId &&
      item.date === today &&
      item.startTime &&
      !item.endTime
  );
}

function calculateWorkingMinutes(
  attendanceRecord,
  breakRecords,
  employeeId,
  today
) {
  if (!attendanceRecord?.checkIn) {
    return 0;
  }

  const start = timeToMinutes(attendanceRecord.checkIn);

  if (start === null) {
    return 0;
  }

  const end = attendanceRecord.checkOut
    ? timeToMinutes(attendanceRecord.checkOut)
    : timeToMinutes(
        new Date().toTimeString().slice(0, 5)
      );

  if (end === null || end < start) {
    return 0;
  }

  const totalMinutes = end - start;

  const breakMinutes = calculateBreakMinutes(
    breakRecords,
    employeeId,
    today
  );

  return Math.max(0, totalMinutes - breakMinutes);
}

export default function Dashboard() {
  const { user } = useAuth();

  const {
    employees,
    attendance,
    tasks,
    breaks = [],
    reports = [],
    plans = [],
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
      plans={plans}
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
  plans,
}) {
  const navigate = useNavigate();
  const today = todayStr();

  const employeeMap = useMemo(() => {
    const map = {};

    employees.forEach((employee) => {
      map[employee.id] = employee;
    });

    return map;
  }, [employees]);

  const todayAttendance = useMemo(() => {
    return attendance.filter(
      (record) => record.date === today
    );
  }, [attendance, today]);

  const employeeRows = useMemo(() => {
    return employees.map((employee) => {
      const attendanceRecord =
        todayAttendance.find(
          (record) =>
            record.employeeId === employee.id
        );

      const employeeTasks = tasks.filter(
        (task) => task.employeeId === employee.id
      );

      const completedTasks = employeeTasks.filter(
        (task) => task.status === "Done"
      ).length;

      const taskProgress =
        employeeTasks.length > 0
          ? Math.round(
              employeeTasks.reduce(
                (sum, task) =>
                  sum + getTaskProgress(task.status),
                0
              ) / employeeTasks.length
            )
          : 0;

      const activeBreak = getActiveBreak(
        breaks,
        employee.id,
        today
      );

      const breakMinutes = calculateBreakMinutes(
        breaks,
        employee.id,
        today
      );

      const workingMinutes = calculateWorkingMinutes(
        attendanceRecord,
        breaks,
        employee.id,
        today
      );

      let attendanceStatus = "Not Checked In";

      if (attendanceRecord) {
        if (attendanceRecord.status === "Absent") {
          attendanceStatus = "Absent";
        } else if (activeBreak) {
          attendanceStatus = "On Break";
        } else if (
          attendanceRecord.checkIn &&
          !attendanceRecord.checkOut
        ) {
          attendanceStatus = "Working";
        } else if (attendanceRecord.status === "Late") {
          attendanceStatus = "Late";
        } else {
          attendanceStatus = "Present";
        }
      }

      const todayReport = reports.find(
        (report) =>
          report.employeeId === employee.id &&
          report.date === today
      );

      const employeePlans = plans
        .filter(
          (plan) =>
            plan.employeeId === employee.id &&
            plan.date >= today
        )
        .sort((a, b) =>
          a.date > b.date ? 1 : -1
        );

      const currentPlan = employeePlans[0];

      return {
        employee,
        attendanceRecord,
        attendanceStatus,
        completedTasks,
        totalTasks: employeeTasks.length,
        taskProgress,
        activeBreak,
        breakMinutes,
        workingMinutes,
        todayReport,
        currentPlan,
      };
    });
  }, [
    employees,
    todayAttendance,
    tasks,
    breaks,
    reports,
    plans,
    today,
  ]);

  const presentToday = employeeRows.filter(
    (row) =>
      row.attendanceStatus !== "Absent" &&
      row.attendanceStatus !== "Not Checked In"
  ).length;

  const workingToday = employeeRows.filter(
    (row) => row.attendanceStatus === "Working"
  ).length;

  const onBreakToday = employeeRows.filter(
    (row) => row.attendanceStatus === "On Break"
  ).length;

  const reportsSubmitted = employeeRows.filter(
    (row) => row.todayReport
  ).length;

  const completedTasks = tasks.filter(
    (task) => task.status === "Done"
  ).length;

  const taskCompletion =
    tasks.length > 0
      ? Math.round(
          (completedTasks / tasks.length) * 100
        )
      : 0;

  const pendingTasks = tasks.filter(
    (task) => task.status !== "Done"
  );

  const teamTaskData = useMemo(() => {
    return employees
      .map((employee) => {
        const employeeTasks = tasks.filter(
          (task) => task.employeeId === employee.id
        );

        if (employeeTasks.length === 0) {
          return null;
        }

        const totalProgress =
          employeeTasks.reduce(
            (sum, task) =>
              sum + getTaskProgress(task.status),
            0
          );

        return {
          employee,
          taskCount: employeeTasks.length,
          completed: employeeTasks.filter(
            (task) => task.status === "Done"
          ).length,
          progress: Math.round(
            totalProgress / employeeTasks.length
          ),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.progress - a.progress);
  }, [employees, tasks]);

  return (
    <div className="space-y-6">
      {/* Header */}

      <section className="card overflow-hidden p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
              PRview Admin Portal
            </p>

            <h2 className="mt-1 font-display text-2xl font-semibold text-ink-900 dark:text-white">
              Employee Monitoring Dashboard
            </h2>

            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              Monitor attendance, working time, breaks,
              tasks, reports and plans for every employee.
            </p>
          </div>

          <div className="rounded-xl bg-brand-50 px-4 py-3 dark:bg-brand-950">
            <p className="text-xs text-ink-400">
              Today
            </p>

            <p className="mt-1 text-sm font-semibold text-brand-700 dark:text-brand-300">
              {new Date().toLocaleDateString([], {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}

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
          value={workingToday}
          description="Currently working"
          icon="◉"
        />

        <StatCard
          label="On Break"
          value={onBreakToday}
          description="Currently on break"
          icon="☕"
        />

        <StatCard
          label="Reports"
          value={`${reportsSubmitted}/${employees.length}`}
          description="Submitted today"
          icon="▤"
        />

        <StatCard
          label="Task Progress"
          value={`${taskCompletion}%`}
          description={`${completedTasks}/${tasks.length} completed`}
          icon="↗"
        />
      </div>

      {/* Employee Monitoring */}

      <section className="card p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display font-semibold text-ink-900 dark:text-white">
              Employee Monitoring
            </h3>

            <p className="mt-1 text-xs text-ink-400">
              Individual attendance, work time, breaks,
              tasks and reporting status
            </p>
          </div>

          <span className="w-fit rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            {employees.length} employees
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-400 dark:border-ink-800">
                <th className="pb-3 font-medium">
                  Employee
                </th>

                <th className="pb-3 font-medium">
                  Attendance
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
                  Working Time
                </th>

                <th className="pb-3 font-medium">
                  Tasks
                </th>

                <th className="pb-3 font-medium">
                  Progress
                </th>

                <th className="pb-3 font-medium">
                  Daily Report
                </th>

                <th className="pb-3 font-medium">
                  Plan
                </th>

                <th className="pb-3 text-right font-medium">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {employeeRows.map((row) => {
                const {
                  employee,
                  attendanceRecord,
                  attendanceStatus,
                  completedTasks,
                  totalTasks,
                  taskProgress,
                  activeBreak,
                  breakMinutes,
                  workingMinutes,
                  todayReport,
                  currentPlan,
                } = row;

                return (
                  <tr
                    key={employee.id}
                    className="border-b border-ink-50 last:border-0 dark:border-ink-800/60"
                  >
                    {/* Employee */}

                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                          {employee.name?.[0] || "?"}
                        </span>

                        <div>
                          <p className="font-medium text-ink-800 dark:text-ink-100">
                            {employee.name}
                          </p>

                          <p className="text-xs text-ink-400">
                            {employee.role}
                          </p>

                          <p className="text-[11px] text-ink-400">
                            {employee.department}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Attendance */}

                    <td className="py-4">
                      <StatusBadge
                        status={attendanceStatus}
                      />
                    </td>

                    {/* Login */}

                    <td className="py-4 text-ink-600 dark:text-ink-300">
                      {formatTime(
                        attendanceRecord?.checkIn
                      )}
                    </td>

                    {/* Logout */}

                    <td className="py-4 text-ink-600 dark:text-ink-300">
                      {formatTime(
                        attendanceRecord?.checkOut
                      )}
                    </td>

                    {/* Break */}

                    <td className="py-4">
                      {activeBreak ? (
                        <div>
                          <StatusBadge status="On Break" />

                          <p className="mt-1 text-[11px] text-ink-400">
                            Since{" "}
                            {formatTime(
                              activeBreak.startTime
                            )}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-ink-700 dark:text-ink-200">
                            {formatMinutes(
                              breakMinutes
                            )}
                          </p>

                          <p className="text-[11px] text-ink-400">
                            Total break
                          </p>
                        </div>
                      )}
                    </td>

                    {/* Working Time */}

                    <td className="py-4">
                      <p className="font-medium text-ink-700 dark:text-ink-200">
                        {attendanceRecord?.checkIn
                          ? formatMinutes(
                              workingMinutes
                            )
                          : "—"}
                      </p>

                      <p className="text-[11px] text-ink-400">
                        Net work time
                      </p>
                    </td>

                    {/* Tasks */}

                    <td className="py-4">
                      <p className="font-medium text-ink-700 dark:text-ink-200">
                        {completedTasks}/{totalTasks}
                      </p>

                      <p className="text-[11px] text-ink-400">
                        completed
                      </p>
                    </td>

                    {/* Progress */}

                    <td className="w-40 py-4">
                      <ProgressBar
                        progress={taskProgress}
                      />
                    </td>

                    {/* Daily Report */}

                    <td className="py-4">
                      <StatusBadge
                        status={
                          todayReport
                            ? "Completed"
                            : "Missing"
                        }
                      />
                    </td>

                    {/* Plan */}

                    <td className="py-4">
                      {currentPlan ? (
                        <div>
                          <StatusBadge
                            status={
                              currentPlan.status ||
                              "Planned"
                            }
                          />

                          <p className="mt-1 max-w-[150px] truncate text-[11px] text-ink-400">
                            {currentPlan.title}
                          </p>
                        </div>
                      ) : (
                        <StatusBadge status="No Plan" />
                      )}
                    </td>

                    {/* Actions */}

                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          className="btn-outline px-3 py-2 text-xs"
                          onClick={() =>
                            navigate(
                              `/analytics?employee=${employee.id}`
                            )
                          }
                        >
                          Analytics
                        </button>

                        <button
                          className="btn-ghost px-3 py-2 text-xs"
                          onClick={() =>
                            navigate(
                              `/daily-reports?employee=${employee.id}`
                            )
                          }
                        >
                          Report
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {employeeRows.length === 0 && (
          <div className="py-10 text-center text-sm text-ink-400">
            No employees found.
          </div>
        )}
      </section>

      {/* Team Task Performance */}

      <section className="card p-5">
        <div className="mb-5">
          <h3 className="font-display font-semibold text-ink-900 dark:text-white">
            Employee Task Performance
          </h3>

          <p className="mt-1 text-xs text-ink-400">
            Current task completion by employee
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {teamTaskData.map((item) => (
            <div
              key={item.employee.id}
              className="rounded-xl border border-ink-100 p-4 dark:border-ink-800"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    {item.employee.name?.[0] ||
                      "?"}
                  </span>

                  <div>
                    <p className="text-sm font-medium text-ink-800 dark:text-ink-100">
                      {item.employee.name}
                    </p>

                    <p className="text-xs text-ink-400">
                      {item.completed}/{item.taskCount}{" "}
                      tasks completed
                    </p>
                  </div>
                </div>

                <span className="text-sm font-semibold text-ink-700 dark:text-ink-200">
                  {item.progress}%
                </span>
              </div>

              <ProgressBar
                progress={item.progress}
              />
            </div>
          ))}

          {teamTaskData.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-ink-400">
              No tasks have been assigned yet.
            </p>
          )}
        </div>
      </section>

      {/* Pending Tasks */}

      <section className="card p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-ink-900 dark:text-white">
              Pending Tasks
            </h3>

            <p className="mt-1 text-xs text-ink-400">
              Tasks that still need attention
            </p>
          </div>

          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            {pendingTasks.length} pending
          </span>
        </div>

        <div className="space-y-3">
          {pendingTasks
            .slice(0, 8)
            .map((task) => {
              const employee =
                employeeMap[task.employeeId];

              const progress =
                getTaskProgress(task.status);

              return (
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
                        Assigned to{" "}
                        {employee?.name ||
                          "Unknown"}{" "}
                        · Due {task.dueDate}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                        task.priority === "High"
                          ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                          : task.priority === "Medium"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  <div className="mt-3">
                    <ProgressBar
                      progress={progress}
                    />
                  </div>
                </div>
              );
            })}

          {pendingTasks.length === 0 && (
            <p className="py-8 text-center text-sm text-ink-400">
              No pending tasks.
            </p>
          )}
        </div>
      </section>
    </div>
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
  checkIn,
  checkOut,
}) {
  const today = todayStr();

  const me = employees.find(
    (employee) => employee.id === user.employeeId
  );

  const todayRecord = attendance.find(
    (record) =>
      record.employeeId === user.employeeId &&
      record.date === today
  );

  const myTasks = tasks.filter(
    (task) => task.employeeId === user.employeeId
  );

  const completedTasks = myTasks.filter(
    (task) => task.status === "Done"
  ).length;

  const taskCompletion =
    myTasks.length > 0
      ? Math.round(
          (completedTasks / myTasks.length) * 100
        )
      : 0;

  const pendingTasks = myTasks.filter(
    (task) => task.status !== "Done"
  );

  const isCheckedIn =
    todayRecord?.checkIn &&
    !todayRecord?.checkOut;

  function handleCheckIn() {
    checkIn(user.employeeId);
  }

  function handleCheckOut() {
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
          {me?.name?.split(" ")[0] || "there"} 👋
        </h2>

        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Here's your work overview for today.
        </p>
      </section>

      {/* Attendance / work */}

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

            <p className="mt-1 text-xs text-ink-400">
              {todayRecord?.checkOut
                ? `Checked out at ${formatTime(
                    todayRecord.checkOut
                  )}`
                : isCheckedIn
                ? "You are currently working"
                : "Start your workday when you're ready"}
            </p>
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

            {isCheckedIn && (
              <button
                className="btn-primary"
                onClick={handleCheckOut}
              >
                Clock Out
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

      {/* Stats */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Tasks"
          value={myTasks.length}
          description={`${pendingTasks.length} still pending`}
          icon="✓"
        />

        <StatCard
          label="Completed"
          value={completedTasks}
          description="Tasks finished"
          icon="✓"
        />

        <StatCard
          label="Progress"
          value={`${taskCompletion}%`}
          description="Overall task completion"
          icon="↗"
        />
      </div>

      {/* Tasks */}

      <section className="card p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-ink-900 dark:text-white">
              Today's Tasks
            </h3>

            <p className="mt-1 text-xs text-ink-400">
              Your assigned work
            </p>
          </div>

          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            {taskCompletion}% complete
          </span>
        </div>

        <div className="space-y-4">
          {myTasks.map((task) => {
            const progress =
              getTaskProgress(task.status);

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
                      Due {task.dueDate}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                      task.status === "Done"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : task.status === "In Progress"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>

                <div className="mt-4">
                  <ProgressBar
                    progress={progress}
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

      {/* Today's activity */}

      <section className="card p-5">
        <h3 className="font-display font-semibold text-ink-900 dark:text-white">
          Today's Activity
        </h3>

        <div className="mt-5 space-y-4">
          {todayRecord?.checkIn && (
            <div className="flex items-center gap-4">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

              <div>
                <p className="text-sm font-medium text-ink-800 dark:text-ink-100">
                  Clocked in
                </p>

                <p className="text-xs text-ink-400">
                  {formatTime(
                    todayRecord.checkIn
                  )}
                </p>
              </div>
            </div>
          )}

          {todayRecord?.checkOut && (
            <div className="flex items-center gap-4">
              <div className="h-2.5 w-2.5 rounded-full bg-brand-500" />

              <div>
                <p className="text-sm font-medium text-ink-800 dark:text-ink-100">
                  Clocked out
                </p>

                <p className="text-xs text-ink-400">
                  {formatTime(
                    todayRecord.checkOut
                  )}
                </p>
              </div>
            </div>
          )}

          {!todayRecord && (
            <p className="text-sm text-ink-400">
              No activity recorded yet today.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}