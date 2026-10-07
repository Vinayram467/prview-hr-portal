import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

import { useData } from "../context/DataContext";

const todayStr = () => new Date().toISOString().slice(0, 10);

function formatTime(time) {
  if (!time) return "—";

  const [hour, minute] = time.split(":");

  const date = new Date();
  date.setHours(Number(hour), Number(minute), 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatShortDate(date) {
  if (!date) return "—";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function minutesFromTime(time) {
  if (!time) return null;

  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function durationBetweenTimes(start, end) {
  const startMinutes = minutesFromTime(start);

  if (startMinutes === null) return 0;

  let endMinutes = minutesFromTime(end);

  if (endMinutes === null) {
    const now = new Date();
    endMinutes = now.getHours() * 60 + now.getMinutes();
  }

  let duration = endMinutes - startMinutes;

  if (duration < 0) {
    duration += 24 * 60;
  }

  return Math.max(0, duration);
}

function durationBetweenISO(start, end) {
  if (!start) return 0;

  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();

  const duration = Math.round(
    (endDate.getTime() - startDate.getTime()) / 60000
  );

  return Math.max(0, duration);
}

function formatDuration(minutes) {
  if (!minutes || minutes < 1) return "0m";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

function getTaskProgress(status) {
  if (status === "Done") return 100;
  if (status === "In Progress") return 50;
  return 0;
}

function getStatusClasses(status) {
  if (
    status === "Present" ||
    status === "Done" ||
    status === "Approved"
  ) {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
  }

  if (
    status === "Late" ||
    status === "In Progress" ||
    status === "Pending"
  ) {
    return "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
  }

  if (
    status === "Absent" ||
    status === "Rejected"
  ) {
    return "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300";
  }

  return "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300";
}

function Badge({ children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
        children
      )}`}
    >
      {children}
    </span>
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

function ProgressBar({ progress }) {
  const safeProgress = Math.max(
    0,
    Math.min(100, progress)
  );

  const barClass =
    safeProgress === 100
      ? "bg-emerald-500"
      : safeProgress >= 50
      ? "bg-brand-500"
      : "bg-ink-300 dark:bg-ink-600";

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
        <div
          className={`h-full rounded-full transition-all ${barClass}`}
          style={{ width: `${safeProgress}%` }}
        />
      </div>

      <span className="w-10 text-right text-xs font-semibold text-ink-600 dark:text-ink-300">
        {safeProgress}%
      </span>
    </div>
  );
}

export default function Analytics() {
  const {
    employees,
    attendance,
    tasks,
    breaks,
    leaves,
    reports,
  } = useData();

  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState(employees[0]?.id ?? "");

  const selectedEmployee = employees.find(
    (employee) => employee.id === selectedEmployeeId
  );

  const today = todayStr();

  const employeeAttendance = useMemo(() => {
    return attendance
      .filter(
        (record) =>
          record.employeeId === selectedEmployeeId
      )
      .sort((a, b) =>
        a.date < b.date ? 1 : -1
      );
  }, [attendance, selectedEmployeeId]);

  const employeeTasks = useMemo(() => {
    return tasks.filter(
      (task) =>
        task.employeeId === selectedEmployeeId
    );
  }, [tasks, selectedEmployeeId]);

  const employeeBreaks = useMemo(() => {
    return breaks.filter(
      (item) =>
        item.employeeId === selectedEmployeeId
    );
  }, [breaks, selectedEmployeeId]);

  const employeeLeaves = useMemo(() => {
    return leaves
      .filter(
        (leave) =>
          leave.employeeId === selectedEmployeeId
      )
      .sort((a, b) =>
        a.appliedOn < b.appliedOn ? 1 : -1
      );
  }, [leaves, selectedEmployeeId]);

  const employeeReports = useMemo(() => {
    return reports
      .filter(
        (report) =>
          report.employeeId === selectedEmployeeId
      )
      .sort((a, b) =>
        a.date < b.date ? 1 : -1
      );
  }, [reports, selectedEmployeeId]);

  const todayAttendance = employeeAttendance.find(
    (record) => record.date === today
  );

  const todayBreaks = employeeBreaks.filter(
    (item) => item.date === today
  );

  const todayBreakMinutes = todayBreaks.reduce(
    (total, item) =>
      total +
      durationBetweenISO(
        item.startTime,
        item.endTime
      ),
    0
  );

  const todayGrossMinutes = todayAttendance?.checkIn
    ? durationBetweenTimes(
        todayAttendance.checkIn,
        todayAttendance.checkOut
      )
    : 0;

  const todayNetMinutes = Math.max(
    0,
    todayGrossMinutes - todayBreakMinutes
  );

  const completedTasks = employeeTasks.filter(
    (task) => task.status === "Done"
  ).length;

  const inProgressTasks = employeeTasks.filter(
    (task) => task.status === "In Progress"
  ).length;

  const pendingTasks = employeeTasks.filter(
    (task) => task.status === "To Do"
  ).length;

  const taskCompletion =
    employeeTasks.length > 0
      ? Math.round(
          (completedTasks / employeeTasks.length) *
            100
        )
      : 0;

  const attendanceStats = useMemo(() => {
    const workingDays = employeeAttendance.filter(
      (record) => record.status !== "Absent"
    ).length;

    const presentDays = employeeAttendance.filter(
      (record) => record.status === "Present"
    ).length;

    const lateDays = employeeAttendance.filter(
      (record) => record.status === "Late"
    ).length;

    const absentDays = employeeAttendance.filter(
      (record) => record.status === "Absent"
    ).length;

    const attendanceRate =
      employeeAttendance.length > 0
        ? Math.round(
            (workingDays /
              employeeAttendance.length) *
              100
          )
        : 0;

    return {
      workingDays,
      presentDays,
      lateDays,
      absentDays,
      attendanceRate,
    };
  }, [employeeAttendance]);

  const totalWorkedMinutes = useMemo(() => {
    return employeeAttendance.reduce(
      (total, record) => {
        if (!record.checkIn) return total;

        const gross = durationBetweenTimes(
          record.checkIn,
          record.checkOut
        );

        const dayBreaks = employeeBreaks.filter(
          (item) => item.date === record.date
        );

        const breakMinutes = dayBreaks.reduce(
          (breakTotal, item) =>
            breakTotal +
            durationBetweenISO(
              item.startTime,
              item.endTime
            ),
          0
        );

        return (
          total +
          Math.max(0, gross - breakMinutes)
        );
      },
      0
    );
  }, [employeeAttendance, employeeBreaks]);

  const averageWorkdayMinutes =
    attendanceStats.workingDays > 0
      ? Math.round(
          totalWorkedMinutes /
            attendanceStats.workingDays
        )
      : 0;

  const totalBreakMinutes = employeeBreaks.reduce(
    (total, item) =>
      total +
      durationBetweenISO(
        item.startTime,
        item.endTime
      ),
    0
  );

  const leaveStats = useMemo(() => {
    let approved = 0;
    let pending = 0;
    let rejected = 0;

    employeeLeaves.forEach((leave) => {
      if (leave.status === "Approved") approved += 1;
      if (leave.status === "Pending") pending += 1;
      if (leave.status === "Rejected") rejected += 1;
    });

    return {
      total: employeeLeaves.length,
      approved,
      pending,
      rejected,
    };
  }, [employeeLeaves]);

  const attendanceChartData = useMemo(() => {
    return [...employeeAttendance]
      .sort((a, b) =>
        a.date > b.date ? 1 : -1
      )
      .slice(-14)
      .map((record) => ({
        date: formatShortDate(record.date),
        rate:
          record.status === "Absent"
            ? 0
            : record.status === "Late"
            ? 75
            : 100,
        status: record.status,
      }));
  }, [employeeAttendance]);

  const workTimeChartData = useMemo(() => {
    return [...employeeAttendance]
      .sort((a, b) =>
        a.date > b.date ? 1 : -1
      )
      .slice(-14)
      .map((record) => {
        const gross = record.checkIn
          ? durationBetweenTimes(
              record.checkIn,
              record.checkOut
            )
          : 0;

        const dayBreaks = employeeBreaks.filter(
          (item) => item.date === record.date
        );

        const breakMinutes = dayBreaks.reduce(
          (total, item) =>
            total +
            durationBetweenISO(
              item.startTime,
              item.endTime
            ),
          0
        );

        return {
          date: formatShortDate(record.date),
          hours: Number(
            Math.max(
              0,
              gross - breakMinutes
            ) / 60
          ).toFixed(1),
        };
      });
  }, [employeeAttendance, employeeBreaks]);

  const recentTasks = useMemo(() => {
    return [...employeeTasks]
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;

        return a.dueDate > b.dueDate ? 1 : -1;
      })
      .slice(0, 8);
  }, [employeeTasks]);

  const recentReports = employeeReports.slice(0, 5);

  const initials =
    selectedEmployee?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  if (!selectedEmployee) {
    return (
      <div className="card p-8 text-center">
        <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-white">
          No employees available
        </h2>

        <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
          Add an employee before opening analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Employee selector */}
      <section className="card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
              Employee Analytics
            </p>

            <h2 className="mt-1 font-display text-xl font-semibold text-ink-900 dark:text-white">
              Individual performance overview
            </h2>

            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              Select an employee to review attendance,
              work time, tasks, reports and leaves.
            </p>
          </div>

          <div className="w-full lg:w-72">
            <label className="label">
              Select employee
            </label>

            <select
              className="input"
              value={selectedEmployeeId}
              onChange={(event) =>
                setSelectedEmployeeId(
                  event.target.value
                )
              }
            >
              {employees.map((employee) => (
                <option
                  key={employee.id}
                  value={employee.id}
                >
                  {employee.name} · {employee.role}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Employee profile */}
      <section className="card overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold text-white"
                style={{
                  backgroundColor:
                    selectedEmployee.avatarColor ||
                    "#7C3AED",
                }}
              >
                {initials}
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
                  {selectedEmployee.email} · Joined{" "}
                  {formatDate(
                    selectedEmployee.joinDate
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge>
                {selectedEmployee.status}
              </Badge>

              <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                {selectedEmployee.id}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Today's overview */}
      <section>
        <div className="mb-3">
          <h3 className="font-display font-semibold text-ink-900 dark:text-white">
            Today
          </h3>

          <p className="text-xs text-ink-500 dark:text-ink-400">
            {formatDate(today)}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Attendance"
            value={
              todayAttendance?.status || "Not marked"
            }
            description={
              todayAttendance?.checkIn
                ? `In ${formatTime(
                    todayAttendance.checkIn
                  )}`
                : "No clock-in recorded"
            }
          />

          <StatCard
            label="Working time"
            value={formatDuration(todayNetMinutes)}
            description={
              todayAttendance?.checkOut
                ? `Out ${formatTime(
                    todayAttendance.checkOut
                  )}`
                : todayAttendance?.checkIn
                ? "Currently working"
                : "No work session"
            }
          />

          <StatCard
            label="Break time"
            value={formatDuration(todayBreakMinutes)}
            description={`${todayBreaks.length} break${
              todayBreaks.length === 1 ? "" : "s"
            } today`}
          />

          <StatCard
            label="Tasks"
            value={`${completedTasks}/${employeeTasks.length}`}
            description={`${taskCompletion}% completed`}
          />

          <StatCard
            label="Reports"
            value={
              employeeReports.some(
                (report) => report.date === today
              )
                ? "Submitted"
                : "Missing"
            }
            description="Today's daily report"
          />
        </div>
      </section>

      {/* Performance summary */}
      <section>
        <div className="mb-3">
          <h3 className="font-display font-semibold text-ink-900 dark:text-white">
            Performance summary
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Task completion"
            value={`${taskCompletion}%`}
            description={`${completedTasks} completed · ${pendingTasks} pending`}
          />

          <StatCard
            label="Attendance rate"
            value={`${attendanceStats.attendanceRate}%`}
            description={`${attendanceStats.presentDays} present · ${attendanceStats.lateDays} late`}
          />

          <StatCard
            label="Average workday"
            value={formatDuration(
              averageWorkdayMinutes
            )}
            description="Based on recorded working days"
          />

          <StatCard
            label="Total break time"
            value={formatDuration(
              totalBreakMinutes
            )}
            description={`${employeeBreaks.length} recorded breaks`}
          />
        </div>
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4">
            <h3 className="font-display font-semibold text-ink-900 dark:text-white">
              Attendance history
            </h3>

            <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
              Last 14 recorded attendance days
            </p>
          </div>

          {attendanceChartData.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={260}
            >
              <LineChart
                data={attendanceChartData}
                margin={{
                  top: 10,
                  right: 10,
                  left: -10,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-ink-100 dark:text-ink-800"
                />

                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  stroke="currentColor"
                  className="text-ink-400"
                />

                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  stroke="currentColor"
                  className="text-ink-400"
                  unit="%"
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value) => [
                    `${value}%`,
                    "Attendance",
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#7C3AED"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState text="No attendance history available." />
          )}
        </div>

        <div className="card p-5">
          <div className="mb-4">
            <h3 className="font-display font-semibold text-ink-900 dark:text-white">
              Working time history
            </h3>

            <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
              Net working hours after recorded breaks
            </p>
          </div>

          {workTimeChartData.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={260}
            >
              <BarChart
                data={workTimeChartData}
                margin={{
                  top: 10,
                  right: 10,
                  left: -10,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-ink-100 dark:text-ink-800"
                />

                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  stroke="currentColor"
                  className="text-ink-400"
                />

                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="currentColor"
                  className="text-ink-400"
                  unit="h"
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value) => [
                    `${value} hours`,
                    "Working time",
                  ]}
                />

                <Bar
                  dataKey="hours"
                  fill="#7C3AED"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState text="No working-time history available." />
          )}
        </div>
      </section>

      {/* Task performance */}
      <section className="card p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-display font-semibold text-ink-900 dark:text-white">
              Task-by-task performance
            </h3>

            <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
              Individual task status and completion
            </p>
          </div>

          <div className="text-sm text-ink-500 dark:text-ink-400">
            {completedTasks} completed ·{" "}
            {inProgressTasks} in progress ·{" "}
            {pendingTasks} pending
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {recentTasks.map((task) => {
            const progress = getTaskProgress(
              task.status
            );

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

                    <p className="mt-1 text-xs text-ink-400">
                      Due{" "}
                      {task.dueDate
                        ? formatDate(task.dueDate)
                        : "—"}
                      {task.priority
                        ? ` · ${task.priority} priority`
                        : ""}
                    </p>
                  </div>

                  <Badge>{task.status}</Badge>
                </div>

                <div className="mt-3">
                  <ProgressBar
                    progress={progress}
                  />
                </div>
              </div>
            );
          })}

          {recentTasks.length === 0 && (
            <EmptyState text="No tasks assigned to this employee." />
          )}
        </div>
      </section>

      {/* Attendance history table */}
      <section className="card overflow-hidden">
        <div className="p-5">
          <h3 className="font-display font-semibold text-ink-900 dark:text-white">
            Attendance history
          </h3>

          <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
            Recent attendance records for this employee
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-y border-ink-100 text-left text-xs text-ink-400 dark:border-ink-800">
                <th className="p-4 font-medium">
                  Date
                </th>

                <th className="p-4 font-medium">
                  Status
                </th>

                <th className="p-4 font-medium">
                  Check in
                </th>

                <th className="p-4 font-medium">
                  Check out
                </th>

                <th className="p-4 font-medium">
                  Working time
                </th>
              </tr>
            </thead>

            <tbody>
              {employeeAttendance
                .slice(0, 14)
                .map((record) => {
                  const gross = record.checkIn
                    ? durationBetweenTimes(
                        record.checkIn,
                        record.checkOut
                      )
                    : 0;

                  const dayBreaks =
                    employeeBreaks.filter(
                      (item) =>
                        item.date === record.date
                    );

                  const breakMinutes =
                    dayBreaks.reduce(
                      (total, item) =>
                        total +
                        durationBetweenISO(
                          item.startTime,
                          item.endTime
                        ),
                      0
                    );

                  const net = Math.max(
                    0,
                    gross - breakMinutes
                  );

                  return (
                    <tr
                      key={record.id}
                      className="border-b border-ink-50 last:border-0 dark:border-ink-800/60"
                    >
                      <td className="p-4 text-ink-700 dark:text-ink-200">
                        {formatDate(record.date)}
                      </td>

                      <td className="p-4">
                        <Badge>
                          {record.status}
                        </Badge>
                      </td>

                      <td className="p-4 text-ink-600 dark:text-ink-300">
                        {formatTime(
                          record.checkIn
                        )}
                      </td>

                      <td className="p-4 text-ink-600 dark:text-ink-300">
                        {formatTime(
                          record.checkOut
                        )}
                      </td>

                      <td className="p-4 font-medium text-ink-700 dark:text-ink-200">
                        {formatDuration(net)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {employeeAttendance.length === 0 && (
          <div className="p-6">
            <EmptyState text="No attendance records found." />
          </div>
        )}
      </section>

      {/* Daily reports */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4">
            <h3 className="font-display font-semibold text-ink-900 dark:text-white">
              Daily reports
            </h3>

            <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
              Reports submitted by this employee
            </p>
          </div>

          <div className="space-y-3">
            {recentReports.map((report) => (
              <div
                key={report.id}
                className="rounded-xl border border-ink-100 p-4 dark:border-ink-800"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-ink-800 dark:text-ink-100">
                    {formatDate(report.date)}
                  </p>

                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Submitted
                  </span>
                </div>

                {report.completed && (
                  <div className="mt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                      Completed
                    </p>

                    <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">
                      {report.completed}
                    </p>
                  </div>
                )}

                {report.pending && (
                  <div className="mt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                      Pending
                    </p>

                    <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">
                      {report.pending}
                    </p>
                  </div>
                )}

                {report.blockers && (
                  <div className="mt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                      Blockers
                    </p>

                    <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">
                      {report.blockers}
                    </p>
                  </div>
                )}

                {report.tomorrowPlan && (
                  <div className="mt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                      Tomorrow
                    </p>

                    <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">
                      {report.tomorrowPlan}
                    </p>
                  </div>
                )}

                {report.notes && (
                  <div className="mt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                      Notes
                    </p>

                    <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">
                      {report.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {recentReports.length === 0 && (
              <EmptyState text="No daily reports submitted yet." />
            )}
          </div>
        </div>

        {/* Leave analytics */}
        <div className="card p-5">
          <div className="mb-4">
            <h3 className="font-display font-semibold text-ink-900 dark:text-white">
              Leave analytics
            </h3>

            <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
              Leave requests and approval status
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MiniMetric
              label="Total requests"
              value={leaveStats.total}
            />

            <MiniMetric
              label="Approved"
              value={leaveStats.approved}
            />

            <MiniMetric
              label="Pending"
              value={leaveStats.pending}
            />

            <MiniMetric
              label="Rejected"
              value={leaveStats.rejected}
            />
          </div>

          <div className="mt-5 space-y-3">
            {employeeLeaves.map((leave) => (
              <div
                key={leave.id}
                className="rounded-xl border border-ink-100 p-4 dark:border-ink-800"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-ink-800 dark:text-ink-100">
                      {leave.type}
                    </p>

                    <p className="mt-1 text-xs text-ink-400">
                      {formatDate(
                        leave.startDate
                      )}{" "}
                      →{" "}
                      {formatDate(
                        leave.endDate
                      )}
                    </p>
                  </div>

                  <Badge>{leave.status}</Badge>
                </div>

                {leave.reason && (
                  <p className="mt-2 text-xs text-ink-500 dark:text-ink-400">
                    {leave.reason}
                  </p>
                )}
              </div>
            ))}

            {employeeLeaves.length === 0 && (
              <EmptyState text="No leave records found." />
            )}
          </div>
        </div>
      </section>

      {/* Overall performance */}
      <section className="card p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display font-semibold text-ink-900 dark:text-white">
              Recent performance
            </h3>

            <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
              Management summary for {selectedEmployee.name}
            </p>
          </div>

          <div className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            {taskCompletion}% task completion
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <PerformanceItem
            title="Attendance"
            value={`${attendanceStats.attendanceRate}%`}
            description={`${attendanceStats.presentDays} present days`}
            progress={attendanceStats.attendanceRate}
          />

          <PerformanceItem
            title="Task delivery"
            value={`${taskCompletion}%`}
            description={`${completedTasks} of ${employeeTasks.length} tasks completed`}
            progress={taskCompletion}
          />

          <PerformanceItem
            title="Report discipline"
            value={
              employeeReports.length > 0
                ? "Active"
                : "No reports"
            }
            description={`${employeeReports.length} report${
              employeeReports.length === 1
                ? ""
                : "s"
            } submitted`}
            progress={
              employeeAttendance.length > 0
                ? Math.min(
                    100,
                    Math.round(
                      (employeeReports.length /
                        employeeAttendance.length) *
                        100
                    )
                  )
                : 0
            }
          />
        </div>
      </section>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-xl bg-ink-50 p-4 dark:bg-ink-800/60">
      <p className="text-xs text-ink-500 dark:text-ink-400">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold text-ink-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function PerformanceItem({
  title,
  value,
  description,
  progress,
}) {
  return (
    <div className="rounded-xl border border-ink-100 p-4 dark:border-ink-800">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink-700 dark:text-ink-200">
          {title}
        </p>

        <p className="text-lg font-semibold text-ink-900 dark:text-white">
          {value}
        </p>
      </div>

      <p className="mt-1 text-xs text-ink-400">
        {description}
      </p>

      <div className="mt-4">
        <ProgressBar progress={progress} />
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <p className="py-6 text-center text-sm text-ink-400">
      {text}
    </p>
  );
}