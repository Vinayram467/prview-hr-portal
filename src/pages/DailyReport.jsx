import { useMemo, useState } from "react";
import { useAuth, ROLES } from "../context/AuthContext";
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

function ProgressBar({ value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
          }}
        />
      </div>

      <span className="w-10 text-right text-xs font-semibold text-ink-600 dark:text-ink-300">
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

function SectionCard({ title, description, children }) {
  return (
    <section className="card p-5">
      <div className="mb-4">
        <h3 className="font-display font-semibold text-ink-900 dark:text-white">
          {title}
        </h3>

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

function EmptySection({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50 p-5 text-sm text-ink-400 dark:border-ink-700 dark:bg-ink-900">
      {text}
    </div>
  );
}

function formatReportDate(date) {
  if (!date) return "—";

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* =========================================================
   MAIN
========================================================= */

export default function DailyReport() {
  const { user } = useAuth();

  if (user?.role === ROLES.EMPLOYEE) {
    return <EmployeeDailyReport user={user} />;
  }

  return <AdminDailyReports />;
}

/* =========================================================
   EMPLOYEE DAILY REPORT
========================================================= */

function EmployeeDailyReport({ user }) {
  const {
    employees = [],
    tasks = [],
    reports = [],
    addDailyReport,
    updateDailyReport,
  } = useData();

  const today = todayStr();

  const employee = employees.find(
    (item) => item.id === user.employeeId
  );

  const myTasks = tasks.filter(
    (task) => task.employeeId === user.employeeId
  );

  const completedTasks = myTasks.filter(
    (task) => task.status === "Done"
  );

  const pendingTasks = myTasks.filter(
    (task) => task.status !== "Done"
  );

  const progress =
    myTasks.length > 0
      ? Math.round(
          myTasks.reduce(
            (sum, task) => sum + getTaskProgress(task),
            0
          ) / myTasks.length
        )
      : 0;

  const todayReport = reports.find(
    (report) =>
      report.employeeId === user.employeeId &&
      report.date === today
  );

  const [form, setForm] = useState({
    completed: todayReport?.completed || "",
    pending: todayReport?.pending || "",
    blockers: todayReport?.blockers || "",
    tomorrowPlan: todayReport?.tomorrowPlan || "",
    notes: todayReport?.notes || "",
  });

  const [message, setMessage] = useState("");

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function submitReport(event) {
    event.preventDefault();

    const payload = {
      employeeId: user.employeeId,
      date: today,
      progress,
      completed: form.completed,
      pending: form.pending,
      blockers: form.blockers,
      tomorrowPlan: form.tomorrowPlan,
      notes: form.notes,
    };

    if (todayReport) {
      updateDailyReport(todayReport.id, payload);
    } else {
      addDailyReport(payload);
    }

    setMessage("Daily report saved successfully.");

    setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
          PRview Employee Portal
        </p>

        <h1 className="mt-1 font-display text-2xl font-semibold text-ink-900 dark:text-white">
          Daily Report
        </h1>

        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Submit your work summary, pending items, blockers and tomorrow's
          plan.
        </p>
      </section>

      {/* Employee information */}
      <section className="card p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              {employee?.name
                ?.split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </div>

            <div>
              <h2 className="font-display font-semibold text-ink-900 dark:text-white">
                {employee?.name || "Employee"}
              </h2>

              <p className="text-xs text-ink-400">
                {employee?.role} · {employee?.department}
              </p>
            </div>
          </div>

          <div className="text-left md:text-right">
            <p className="text-xs text-ink-400">
              Report Date
            </p>

            <p className="mt-1 font-semibold text-ink-900 dark:text-white">
              {formatReportDate(today)}
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tasks"
          value={myTasks.length}
          description="Assigned tasks"
        />

        <StatCard
          label="Completed"
          value={completedTasks.length}
          description="Finished today"
        />

        <StatCard
          label="Pending"
          value={pendingTasks.length}
          description="Still remaining"
        />

        <StatCard
          label="Progress"
          value={`${progress}%`}
          description="Overall task progress"
        />
      </div>

      {/* Today's task breakdown */}
      <SectionCard
        title="Today's Task Breakdown"
        description="Tasks assigned to you and their current progress."
      >
        <div className="space-y-3">
          {myTasks.map((task) => (
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
                      : task.status === "In Progress"
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300"
                  }`}
                >
                  {task.status}
                </span>
              </div>

              <div className="mt-4">
                <ProgressBar value={getTaskProgress(task)} />
              </div>
            </div>
          ))}

          {myTasks.length === 0 && (
            <EmptySection text="No tasks have been assigned to you." />
          )}
        </div>
      </SectionCard>

      {/* Report form */}
      <form onSubmit={submitReport} className="space-y-5">
        <SectionCard
          title="1. Work Completed"
          description="Describe what you completed today."
        >
          <textarea
            value={form.completed}
            onChange={(event) =>
              updateField("completed", event.target.value)
            }
            rows={5}
            className="input w-full resize-none"
            placeholder="Example: Completed social media creatives for the client campaign, scheduled Instagram posts and finished the landing page updates."
          />
        </SectionCard>

        <SectionCard
          title="2. Pending Work"
          description="Mention tasks that are still pending."
        >
          <textarea
            value={form.pending}
            onChange={(event) =>
              updateField("pending", event.target.value)
            }
            rows={5}
            className="input w-full resize-none"
            placeholder="Example: Client approval is pending for the final creatives."
          />
        </SectionCard>

        <SectionCard
          title="3. Blockers / Issues"
          description="Mention anything that stopped or delayed your work."
        >
          <textarea
            value={form.blockers}
            onChange={(event) =>
              updateField("blockers", event.target.value)
            }
            rows={5}
            className="input w-full resize-none"
            placeholder="Example: Waiting for client feedback, missing brand assets, technical issue, etc."
          />
        </SectionCard>

        <SectionCard
          title="4. Tomorrow's Plan"
          description="What do you plan to work on tomorrow?"
        >
          <textarea
            value={form.tomorrowPlan}
            onChange={(event) =>
              updateField("tomorrowPlan", event.target.value)
            }
            rows={5}
            className="input w-full resize-none"
            placeholder="Example: Complete campaign creatives, prepare the presentation and schedule approved posts."
          />
        </SectionCard>

        <SectionCard
          title="5. Additional Notes"
          description="Anything else your manager should know."
        >
          <textarea
            value={form.notes}
            onChange={(event) =>
              updateField("notes", event.target.value)
            }
            rows={5}
            className="input w-full resize-none"
            placeholder="Additional comments or information..."
          />
        </SectionCard>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {message && (
            <p className="text-sm font-medium text-emerald-600">
              ✓ {message}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary sm:ml-auto"
          >
            {todayReport ? "Update Daily Report" : "Submit Daily Report"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* =========================================================
   ADMIN / HR DAILY REPORTS
========================================================= */

function AdminDailyReports() {
  const {
    employees = [],
    tasks = [],
    reports = [],
  } = useData();

  const today = todayStr();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    employees[0]?.id || ""
  );

  const [selectedDate, setSelectedDate] = useState(today);

  const selectedEmployee = employees.find(
    (employee) => employee.id === selectedEmployeeId
  );

  const selectedReport = reports.find(
    (report) =>
      report.employeeId === selectedEmployeeId &&
      report.date === selectedDate
  );

  const selectedTasks = tasks.filter(
    (task) => task.employeeId === selectedEmployeeId
  );

  const completedTasks = selectedTasks.filter(
    (task) => task.status === "Done"
  );

  const pendingTasks = selectedTasks.filter(
    (task) => task.status !== "Done"
  );

  const taskProgress =
    selectedTasks.length > 0
      ? Math.round(
          selectedTasks.reduce(
            (sum, task) => sum + getTaskProgress(task),
            0
          ) / selectedTasks.length
        )
      : 0;

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

  const reportsToday = employees.filter((employee) =>
    reports.some(
      (report) =>
        report.employeeId === employee.id &&
        report.date === today
    )
  ).length;

  const employeesWithoutReports =
    employees.length - reportsToday;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
          PRview Admin Portal
        </p>

        <h1 className="mt-1 font-display text-2xl font-semibold text-ink-900 dark:text-white">
          Daily Reports
        </h1>

        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Review each employee's daily work report individually.
        </p>
      </section>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Employees"
          value={employees.length}
          description="Active employees"
        />

        <StatCard
          label="Reports Today"
          value={reportsToday}
          description="Submitted today"
        />

        <StatCard
          label="Missing Reports"
          value={employeesWithoutReports}
          description="Employees who haven't submitted"
        />
      </div>

      {/* Employee selector */}
      <section className="card p-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-medium text-ink-700 dark:text-ink-200">
              Select Employee
            </label>

            <select
              value={selectedEmployeeId}
              onChange={(event) => {
                setSelectedEmployeeId(event.target.value);
                setSelectedDate(today);
              }}
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
                  {employee.name} · {employee.department}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ink-700 dark:text-ink-200">
              Report Date
            </label>

            <input
              type="date"
              value={selectedDate}
              onChange={(event) =>
                setSelectedDate(event.target.value)
              }
              className="input w-full"
            />
          </div>
        </div>
      </section>

      {/* Employee identity */}
      {selectedEmployee && (
        <section className="card p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                {selectedEmployee.name
                  ?.split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </div>

              <div>
                <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-white">
                  {selectedEmployee.name}
                </h2>

                <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                  {selectedEmployee.role} ·{" "}
                  {selectedEmployee.department}
                </p>

                <p className="mt-1 text-xs text-ink-400">
                  {selectedEmployee.email || "No email"}
                </p>
              </div>
            </div>

            <div className="text-left md:text-right">
              <p className="text-xs text-ink-400">
                Report Date
              </p>

              <p className="mt-1 font-semibold text-ink-900 dark:text-white">
                {formatReportDate(selectedDate)}
              </p>

              {selectedReport ? (
                <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  Report Submitted
                </span>
              ) : (
                <span className="mt-2 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  Report Missing
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Selected employee stats */}
      {selectedEmployee && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Tasks"
            value={selectedTasks.length}
            description="Assigned to employee"
          />

          <StatCard
            label="Completed"
            value={completedTasks.length}
            description="Completed tasks"
          />

          <StatCard
            label="Pending"
            value={pendingTasks.length}
            description="Remaining tasks"
          />

          <StatCard
            label="Progress"
            value={`${selectedReport?.progress ?? taskProgress}%`}
            description="Reported progress"
          />
        </div>
      )}

      {/* Individual report sections */}
      {selectedEmployee && selectedReport && (
        <>
          <SectionCard
            title="1. Work Completed"
            description={`What ${selectedEmployee.name} completed on ${formatReportDate(
              selectedDate
            )}.`}
          >
            {selectedReport.completed ? (
              <div className="rounded-xl border border-ink-100 bg-ink-50 p-5 text-sm leading-7 text-ink-700 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-200 whitespace-pre-wrap">
                {selectedReport.completed}
              </div>
            ) : (
              <EmptySection text="No completed-work details were submitted." />
            )}
          </SectionCard>

          <SectionCard
            title="2. Pending Work"
            description="Tasks or work that remain unfinished."
          >
            {selectedReport.pending ? (
              <div className="rounded-xl border border-ink-100 bg-ink-50 p-5 text-sm leading-7 text-ink-700 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-200 whitespace-pre-wrap">
                {selectedReport.pending}
              </div>
            ) : (
              <EmptySection text="No pending work was reported." />
            )}
          </SectionCard>

          <SectionCard
            title="3. Blockers / Issues"
            description="Problems, delays or dependencies affecting the employee's work."
          >
            {selectedReport.blockers ? (
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-5 text-sm leading-7 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200 whitespace-pre-wrap">
                {selectedReport.blockers}
              </div>
            ) : (
              <EmptySection text="No blockers or issues were reported." />
            )}
          </SectionCard>

          <SectionCard
            title="4. Tomorrow's Plan"
            description={`What ${selectedEmployee.name} plans to work on next.`}
          >
            {selectedReport.tomorrowPlan ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 text-sm leading-7 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200 whitespace-pre-wrap">
                {selectedReport.tomorrowPlan}
              </div>
            ) : (
              <EmptySection text="No plan for tomorrow was submitted." />
            )}
          </SectionCard>

          <SectionCard
            title="5. Additional Notes"
            description="Other information submitted by the employee."
          >
            {selectedReport.notes ? (
              <div className="rounded-xl border border-ink-100 bg-ink-50 p-5 text-sm leading-7 text-ink-700 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-200 whitespace-pre-wrap">
                {selectedReport.notes}
              </div>
            ) : (
              <EmptySection text="No additional notes were submitted." />
            )}
          </SectionCard>
        </>
      )}

      {/* Employee tasks */}
      {selectedEmployee && (
        <SectionCard
          title={`${selectedEmployee.name}'s Task Details`}
          description="Current tasks and their progress."
        >
          <div className="space-y-3">
            {selectedTasks.map((task) => (
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
                        : task.status === "In Progress"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>

                <div className="mt-4">
                  <ProgressBar value={getTaskProgress(task)} />
                </div>
              </div>
            ))}

            {selectedTasks.length === 0 && (
              <EmptySection text="No tasks are assigned to this employee." />
            )}
          </div>
        </SectionCard>
      )}

      {/* Previous reports */}
      {selectedEmployee && (
        <SectionCard
          title={`Previous Reports — ${selectedEmployee.name}`}
          description="Historical daily reports submitted by this employee."
        >
          <div className="space-y-3">
            {employeeReports.map((report) => (
              <button
                key={report.id}
                type="button"
                onClick={() => setSelectedDate(report.date)}
                className={`w-full rounded-xl border p-4 text-left transition-colors ${
                  report.date === selectedDate
                    ? "border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-950"
                    : "border-ink-100 hover:bg-ink-50 dark:border-ink-800 dark:hover:bg-ink-900"
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-ink-800 dark:text-ink-100">
                      {formatReportDate(report.date)}
                    </p>

                    <p className="mt-1 text-xs text-ink-400">
                      Click to view this report
                    </p>
                  </div>

                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                    {report.progress ?? 0}% progress
                  </span>
                </div>
              </button>
            ))}

            {employeeReports.length === 0 && (
              <EmptySection text="No previous reports are available for this employee." />
            )}
          </div>
        </SectionCard>
      )}

      {/* Nothing selected */}
      {!selectedEmployee && (
        <section className="card p-10 text-center">
          <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-white">
            Select an employee
          </h2>

          <p className="mt-2 text-sm text-ink-400">
            Select an employee above to view their individual daily report.
          </p>
        </section>
      )}

      {/* Employee selected but report missing */}
      {selectedEmployee && !selectedReport && (
        <section className="card p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
            !
          </div>

          <h2 className="mt-4 font-display text-lg font-semibold text-ink-900 dark:text-white">
            No daily report submitted
          </h2>

          <p className="mt-2 text-sm text-ink-400">
            {selectedEmployee.name} has not submitted a report for{" "}
            {formatReportDate(selectedDate)}.
          </p>
        </section>
      )}
    </div>
  );
}