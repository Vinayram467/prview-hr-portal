import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, ROLES } from "../context/AuthContext";
import { useData } from "../context/DataContext";

const todayStr = () => new Date().toISOString().slice(0, 10);

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

function getTaskProgress(task) {
  if (typeof task.progress === "number") {
    return task.progress;
  }

  if (task.status === "Done") return 100;
  if (task.status === "In Progress") return 50;

  return 0;
}

function getEmployeeStatus(record) {
  if (!record) {
    return {
      label: "Not Started",
      className:
        "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300",
    };
  }

  if (record.workStatus === "On Break") {
    return {
      label: "On Break",
      className:
        "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    };
  }

  if (record.workStatus === "Completed" || record.checkOut) {
    return {
      label: "Completed",
      className:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    };
  }

  if (record.checkIn) {
    return {
      label: "Working",
      className:
        "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    };
  }

  return {
    label: "Not Started",
    className:
      "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300",
  };
}

function getBreakMinutes(record) {
  if (!record?.breaks?.length) return 0;

  return record.breaks.reduce((total, br) => {
    if (!br.start) return total;

    const start = br.start.split(":").map(Number);

    if (!br.end) {
      const now = new Date();
      const startDate = new Date();

      startDate.setHours(start[0], start[1], 0, 0);

      return total + Math.max(0, Math.round((now - startDate) / 60000));
    }

    const end = br.end.split(":").map(Number);

    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];

    return total + Math.max(0, endMinutes - startMinutes);
  }, 0);
}

function getWorkingMinutes(record) {
  if (!record?.checkIn) return 0;

  const start = record.checkIn.split(":").map(Number);
  const startDate = new Date();

  startDate.setHours(start[0], start[1], 0, 0);

  let endDate = new Date();

  if (record.checkOut) {
    const end = record.checkOut.split(":").map(Number);
    endDate = new Date();
    endDate.setHours(end[0], end[1], 0, 0);
  }

  const totalMinutes = Math.max(
    0,
    Math.round((endDate - startDate) / 60000)
  );

  return Math.max(0, totalMinutes - getBreakMinutes(record));
}

function formatMinutes(minutes) {
  if (!minutes) return "0m";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (!hours) return `${mins}m`;

  return `${hours}h ${mins}m`;
}

function ProgressBar({ value }) {
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>

      <span className="w-9 text-right text-xs font-semibold text-ink-600 dark:text-ink-300">
        {value}%
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

export default function Dashboard() {
  const { user } = useAuth();
  const data = useData();

  if (user.role === ROLES.EMPLOYEE) {
    return <EmployeeDashboard user={user} data={data} />;
  }

  return <AdminDashboard data={data} />;
}

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

function AdminDashboard({ data }) {
  const navigate = useNavigate();

  const {
    employees = [],
    attendance = [],
    tasks = [],
    leaves = [],
    reports = [],
  } = data;

  const today = todayStr();

  const employeeRows = useMemo(() => {
    return employees.map((employee) => {
      const attendanceRecord = attendance.find(
        (record) =>
          record.employeeId === employee.id &&
          record.date === today
      );

      const employeeTasks = tasks.filter(
        (task) => task.employeeId === employee.id
      );

      const completed = employeeTasks.filter(
        (task) => task.status === "Done"
      ).length;

      const progress =
        employeeTasks.length > 0
          ? Math.round(
              employeeTasks.reduce(
                (sum, task) => sum + getTaskProgress(task),
                0
              ) / employeeTasks.length
            )
          : 0;

      const employeeReport = reports
        .filter(
          (report) =>
            report.employeeId === employee.id &&
            report.date === today
        )
        .sort((a, b) => {
          const aTime = a.updatedAt || a.createdAt || "";
          const bTime = b.updatedAt || b.createdAt || "";

          return aTime < bTime ? 1 : -1;
        })[0];

      return {
        employee,
        attendanceRecord,
        employeeTasks,
        completed,
        progress,
        report: employeeReport,
        breakMinutes: getBreakMinutes(attendanceRecord),
        workingMinutes: getWorkingMinutes(attendanceRecord),
        status: getEmployeeStatus(attendanceRecord),
      };
    });
  }, [employees, attendance, tasks, reports, today]);

  const workingCount = employeeRows.filter(
    (row) => row.status.label === "Working"
  ).length;

  const breakCount = employeeRows.filter(
    (row) => row.status.label === "On Break"
  ).length;

  const completedCount = employeeRows.filter(
    (row) => row.status.label === "Completed"
  ).length;

  const checkedInCount = employeeRows.filter(
    (row) => row.attendanceRecord?.checkIn
  ).length;

  const pendingTasks = tasks.filter(
    (task) => task.status !== "Done"
  ).length;

  const pendingLeaves = leaves.filter(
    (leave) => leave.status === "Pending"
  ).length;

  const submittedReports = employeeRows.filter(
    (row) => row.report
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
          PRview Admin Portal
        </p>

        <h1 className="mt-1 font-display text-2xl font-semibold text-ink-900 dark:text-white">
          Employee Operations Dashboard
        </h1>

        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Monitor attendance, breaks, tasks, progress and daily reports for
          every employee.
        </p>
      </section>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          label="Total Employees"
          value={employees.length}
          description="Active employee records"
        />

        <StatCard
          label="Checked In"
          value={checkedInCount}
          description={`${workingCount} currently working`}
        />

        <StatCard
          label="On Break"
          value={breakCount}
          description="Employees currently on break"
        />

        <StatCard
          label="Pending Tasks"
          value={pendingTasks}
          description="Tasks not completed"
        />

        <StatCard
          label="Reports Submitted"
          value={`${submittedReports}/${employees.length}`}
          description="Today's daily reports"
        />
      </div>

      {/* Live employee status */}
      <section className="card overflow-hidden">
        <div className="p-5 border-b border-ink-100 dark:border-ink-800">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display font-semibold text-ink-900 dark:text-white">
                Today's Employee Status
              </h2>

              <p className="mt-1 text-xs text-ink-400">
                {today} · Each employee is tracked separately
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {workingCount} Working
              </span>

              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                {breakCount} On Break
              </span>

              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {completedCount} Completed
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-400 dark:border-ink-800">
                <th className="p-4 font-medium">Employee</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Login</th>
                <th className="p-4 font-medium">Logout</th>
                <th className="p-4 font-medium">Break</th>
                <th className="p-4 font-medium">Working</th>
                <th className="p-4 font-medium">Tasks</th>
                <th className="p-4 font-medium">Progress</th>
                <th className="p-4 font-medium">Report</th>
                <th className="p-4 font-medium">Action</th>
              </tr>
            </thead>

            <tbody>
              {employeeRows.map((row) => (
                <tr
                  key={row.employee.id}
                  className="border-b border-ink-100 last:border-0 dark:border-ink-800"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                        {row.employee.name
                          ?.split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)}
                      </div>

                      <div>
                        <p className="font-medium text-ink-800 dark:text-ink-100">
                          {row.employee.name}
                        </p>

                        <p className="text-xs text-ink-400">
                          {row.employee.role} · {row.employee.department}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${row.status.className}`}
                    >
                      {row.status.label}
                    </span>
                  </td>

                  <td className="p-4 text-ink-600 dark:text-ink-300">
                    {formatTime(row.attendanceRecord?.checkIn)}
                  </td>

                  <td className="p-4 text-ink-600 dark:text-ink-300">
                    {formatTime(row.attendanceRecord?.checkOut)}
                  </td>

                  <td className="p-4 text-ink-600 dark:text-ink-300">
                    {formatMinutes(row.breakMinutes)}
                  </td>

                  <td className="p-4 text-ink-600 dark:text-ink-300">
                    {formatMinutes(row.workingMinutes)}
                  </td>

                  <td className="p-4">
                    <span className="font-medium text-ink-800 dark:text-ink-100">
                      {row.completed}/{row.employeeTasks.length}
                    </span>
                  </td>

                  <td className="p-4">
                    <ProgressBar value={row.progress} />
                  </td>

                  <td className="p-4">
                    {row.report ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        Submitted
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                        Missing
                      </span>
                    )}
                  </td>

                  <td className="p-4">
                    <button
                      className="btn-outline text-xs"
                      onClick={() =>
                        navigate(`/employees/${row.employee.id}`)
                      }
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {employeeRows.length === 0 && (
          <div className="p-10 text-center text-sm text-ink-400">
            No employees found.
          </div>
        )}
      </section>

      {/* Quick information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="card p-5">
          <h3 className="font-display font-semibold text-ink-900 dark:text-white">
            Today's workload
          </h3>

          <p className="mt-1 text-xs text-ink-400">
            Overall team task progress
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-ink-50 p-4 dark:bg-ink-800">
              <p className="text-xs text-ink-400">Total</p>
              <p className="mt-1 text-xl font-semibold text-ink-900 dark:text-white">
                {tasks.length}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950">
              <p className="text-xs text-emerald-600 dark:text-emerald-300">
                Done
              </p>
              <p className="mt-1 text-xl font-semibold text-emerald-700 dark:text-emerald-300">
                {tasks.filter((task) => task.status === "Done").length}
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-950">
              <p className="text-xs text-amber-600 dark:text-amber-300">
                Pending
              </p>
              <p className="mt-1 text-xl font-semibold text-amber-700 dark:text-amber-300">
                {pendingTasks}
              </p>
            </div>
          </div>
        </section>

        <section className="card p-5">
          <h3 className="font-display font-semibold text-ink-900 dark:text-white">
            Pending approvals
          </h3>

          <p className="mt-1 text-xs text-ink-400">
            Items requiring admin or HR attention
          </p>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-ink-100 p-4 dark:border-ink-800">
              <span className="text-sm text-ink-700 dark:text-ink-200">
                Leave requests
              </span>

              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                {pendingLeaves}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-ink-100 p-4 dark:border-ink-800">
              <span className="text-sm text-ink-700 dark:text-ink-200">
                Daily reports missing
              </span>

              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                {Math.max(0, employees.length - submittedReports)}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* =========================================================
   EMPLOYEE DASHBOARD
========================================================= */

function EmployeeDashboard({ user, data }) {
  const {
    employees = [],
    attendance = [],
    tasks = [],
    leaves = [],
    payroll = [],
  } = data;

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

  const progress =
    myTasks.length > 0
      ? Math.round(
          myTasks.reduce(
            (sum, task) => sum + getTaskProgress(task),
            0
          ) / myTasks.length
        )
      : 0;

  const pendingTasks = myTasks.filter(
    (task) => task.status !== "Done"
  );

  const myLeaves = leaves
    .filter((leave) => leave.employeeId === user.employeeId)
    .slice(0, 5);

  const myPayslip = payroll.find(
    (item) => item.employeeId === user.employeeId
  );

  const status = getEmployeeStatus(todayRecord);

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden p-6">
        <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
          PRview Employee Portal
        </p>

        <h1 className="mt-1 font-display text-2xl font-semibold text-ink-900 dark:text-white">
          Good morning, {me?.name?.split(" ")[0] || "there"} 👋
        </h1>

        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Here's your complete work overview for today.
        </p>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Today's Status"
          value={status.label}
          description={
            todayRecord?.checkIn
              ? `Login ${formatTime(todayRecord.checkIn)}`
              : "Not checked in"
          }
        />

        <StatCard
          label="My Tasks"
          value={myTasks.length}
          description={`${pendingTasks.length} pending`}
        />

        <StatCard
          label="My Progress"
          value={`${progress}%`}
          description={`${completedTasks} tasks completed`}
        />

        <StatCard
          label="Leave Requests"
          value={myLeaves.length}
          description="Recent requests"
        />
      </div>

      <section className="card p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display font-semibold text-ink-900 dark:text-white">
              Today's Work
            </h2>

            <p className="mt-1 text-xs text-ink-400">
              Your assigned tasks and progress
            </p>
          </div>

          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            {progress}% complete
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {pendingTasks.slice(0, 6).map((task) => {
            const taskProgress = getTaskProgress(task);

            return (
              <div
                key={task.id}
                className="rounded-xl border border-ink-100 p-4 dark:border-ink-800"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-ink-800 dark:text-ink-100">
                      {task.title}
                    </p>

                    <p className="mt-1 text-xs text-ink-400">
                      Due {task.dueDate || "—"}
                    </p>
                  </div>

                  <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                    {task.status}
                  </span>
                </div>

                <div className="mt-3">
                  <ProgressBar value={taskProgress} />
                </div>
              </div>
            );
          })}

          {pendingTasks.length === 0 && (
            <p className="py-6 text-center text-sm text-ink-400">
              No pending tasks. Great work!
            </p>
          )}
        </div>
      </section>

      {myPayslip && (
        <section className="card p-5">
          <h2 className="font-display font-semibold text-ink-900 dark:text-white">
            Latest Payslip
          </h2>

          <p className="mt-1 text-xs text-ink-400">
            {myPayslip.month}
          </p>

          <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-ink-400">Base Salary</p>
              <p className="mt-1 font-semibold text-ink-900 dark:text-white">
                EGP {Number(myPayslip.baseSalary || 0).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-xs text-ink-400">Bonus</p>
              <p className="mt-1 font-semibold text-emerald-600">
                + EGP {Number(myPayslip.bonus || 0).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-xs text-ink-400">Deductions</p>
              <p className="mt-1 font-semibold text-red-600">
                - EGP {Number(myPayslip.deductions || 0).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-xs text-ink-400">Net Pay</p>
              <p className="mt-1 font-semibold text-ink-900 dark:text-white">
                EGP {Number(myPayslip.netPay || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}