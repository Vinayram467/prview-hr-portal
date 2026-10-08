import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useAuth, ROLES } from "../context/AuthContext";
import { useData } from "../context/DataContext";

const today = () =>
  new Date().toISOString().slice(0, 10);

const EMPTY_FORM = {
  completed: "",
  pending: "",
  blockers: "",
  tomorrowPlan: "",
  notes: "",
};

function formatDate(date) {
  if (!date) return "—";

  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DailyReports() {
  const { user } = useAuth();

  const {
    employees,
    tasks,
    reports,
    addDailyReport,
  } = useData();

  const [searchParams, setSearchParams] =
    useSearchParams();

  const isAdmin =
    user.role === ROLES.ADMIN;

  const initialEmployee =
    searchParams.get("employee") ||
    (isAdmin
      ? employees[0]?.id ?? ""
      : user.employeeId);

  const [selectedEmployee, setSelectedEmployee] =
    useState(initialEmployee);

  const [selectedDate, setSelectedDate] =
    useState(
      searchParams.get("date") || today()
    );

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [saved, setSaved] =
    useState(false);

  const employeeId = isAdmin
    ? selectedEmployee
    : user.employeeId;

  const employee = useMemo(
    () =>
      employees.find(
        (item) => item.id === employeeId
      ),
    [employees, employeeId]
  );

  const employeeTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.employeeId === employeeId
      ),
    [tasks, employeeId]
  );

  const completedTasks = employeeTasks.filter(
    (task) => task.status === "Done"
  );

  const pendingTasks = employeeTasks.filter(
    (task) => task.status !== "Done"
  );

  const currentReport = useMemo(
    () =>
      reports.find(
        (report) =>
          report.employeeId === employeeId &&
          report.date === selectedDate
      ),
    [reports, employeeId, selectedDate]
  );

  const employeeReports = useMemo(
    () =>
      [...reports]
        .filter(
          (report) =>
            report.employeeId === employeeId
        )
        .sort((a, b) =>
          a.date < b.date ? 1 : -1
        ),
    [reports, employeeId]
  );

  const reportCompletion =
    employeeTasks.length > 0
      ? Math.round(
          (completedTasks.length /
            employeeTasks.length) *
            100
        )
      : 0;

  function loadReport(report) {
    setSelectedDate(report.date);

    setForm({
      completed: report.completed || "",
      pending: report.pending || "",
      blockers: report.blockers || "",
      tomorrowPlan:
        report.tomorrowPlan || "",
      notes: report.notes || "",
    });
  }

  function handleEmployeeChange(
    employeeId
  ) {
    setSelectedEmployee(employeeId);

    setSearchParams({
      employee: employeeId,
      date: selectedDate,
    });

    setForm(EMPTY_FORM);
    setSaved(false);
  }

  function handleDateChange(date) {
    setSelectedDate(date);

    setSearchParams({
      employee: employeeId,
      date,
    });

    const existing = reports.find(
      (report) =>
        report.employeeId === employeeId &&
        report.date === date
    );

    if (existing) {
      setForm({
        completed: existing.completed || "",
        pending: existing.pending || "",
        blockers: existing.blockers || "",
        tomorrowPlan:
          existing.tomorrowPlan || "",
        notes: existing.notes || "",
      });
    } else {
      setForm(EMPTY_FORM);
    }

    setSaved(false);
  }

  function handleChange(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setSaved(false);
  }

  function useTaskSummary() {
    const completedText =
      completedTasks.length > 0
        ? completedTasks
            .map(
              (task) =>
                `• ${task.title}`
            )
            .join("\n")
        : "No tasks completed.";

    const pendingText =
      pendingTasks.length > 0
        ? pendingTasks
            .map(
              (task) =>
                `• ${task.title}`
            )
            .join("\n")
        : "No pending tasks.";

    setForm((current) => ({
      ...current,
      completed: completedText,
      pending: pendingText,
    }));

    setSaved(false);
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!employeeId) {
      return;
    }

    addDailyReport({
      employeeId,
      date: selectedDate,
      completed: form.completed.trim(),
      pending: form.pending.trim(),
      blockers: form.blockers.trim(),
      tomorrowPlan:
        form.tomorrowPlan.trim(),
      notes: form.notes.trim(),
      submittedBy: user.name,
    });

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}

      <section className="card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
              Daily Work Update
            </p>

            <h2 className="mt-1 font-display text-2xl font-semibold text-ink-900 dark:text-white">
              Daily Reports
            </h2>

            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              Record completed work, pending
              work, blockers and the next plan.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {isAdmin && (
              <select
                className="input min-w-[220px]"
                value={selectedEmployee}
                onChange={(event) =>
                  handleEmployeeChange(
                    event.target.value
                  )
                }
              >
                {employees.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                ))}
              </select>
            )}

            <input
              type="date"
              className="input"
              value={selectedDate}
              onChange={(event) =>
                handleDateChange(
                  event.target.value
                )
              }
            />
          </div>
        </div>
      </section>

      {/* Employee summary */}

      {employee && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Employee"
            value={employee.name}
            description={
              employee.role ||
              employee.department ||
              "Employee"
            }
            icon="👤"
          />

          <SummaryCard
            label="Tasks"
            value={employeeTasks.length}
            description="Assigned tasks"
            icon="📋"
          />

          <SummaryCard
            label="Completed"
            value={completedTasks.length}
            description={`${reportCompletion}% task completion`}
            icon="✓"
          />

          <SummaryCard
            label="Pending"
            value={pendingTasks.length}
            description="Tasks still open"
            icon="⏳"
          />
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Report form */}

        <section className="card p-5 xl:col-span-2">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-semibold text-ink-900 dark:text-white">
                {formatDate(selectedDate)}
              </h3>

              <p className="mt-1 text-xs text-ink-400">
                {currentReport
                  ? "Existing report — update it below."
                  : "No report submitted for this date yet."}
              </p>
            </div>

            <button
              type="button"
              className="btn-outline"
              onClick={useTaskSummary}
            >
              Use Task Summary
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label className="label">
                Completed Work
              </label>

              <textarea
                className="input min-h-[130px]"
                value={form.completed}
                onChange={(event) =>
                  handleChange(
                    "completed",
                    event.target.value
                  )
                }
                placeholder="What did you complete today?"
                required
              />
            </div>

            <div>
              <label className="label">
                Pending Work
              </label>

              <textarea
                className="input min-h-[110px]"
                value={form.pending}
                onChange={(event) =>
                  handleChange(
                    "pending",
                    event.target.value
                  )
                }
                placeholder="What is still pending?"
              />
            </div>

            <div>
              <label className="label">
                Blockers
              </label>

              <textarea
                className="input min-h-[100px]"
                value={form.blockers}
                onChange={(event) =>
                  handleChange(
                    "blockers",
                    event.target.value
                  )
                }
                placeholder="Any blockers, dependencies or issues?"
              />
            </div>

            <div>
              <label className="label">
                Tomorrow's Plan
              </label>

              <textarea
                className="input min-h-[110px]"
                value={form.tomorrowPlan}
                onChange={(event) =>
                  handleChange(
                    "tomorrowPlan",
                    event.target.value
                  )
                }
                placeholder="What do you plan to work on tomorrow?"
              />
            </div>

            <div>
              <label className="label">
                Additional Notes
              </label>

              <textarea
                className="input min-h-[90px]"
                value={form.notes}
                onChange={(event) =>
                  handleChange(
                    "notes",
                    event.target.value
                  )
                }
                placeholder="Anything else the admin should know?"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                className="btn-primary"
              >
                {currentReport
                  ? "Update Report"
                  : "Submit Daily Report"}
              </button>

              {saved && (
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  ✓ Report saved successfully
                </span>
              )}
            </div>
          </form>
        </section>

        {/* History */}

        <section className="card p-5">
          <div className="mb-5">
            <h3 className="font-display font-semibold text-ink-900 dark:text-white">
              Report History
            </h3>

            <p className="mt-1 text-xs text-ink-400">
              Previous daily reports
            </p>
          </div>

          {employeeReports.length === 0 ? (
            <div className="rounded-lg border border-dashed border-ink-200 p-6 text-center dark:border-ink-700">
              <p className="text-sm text-ink-500 dark:text-ink-400">
                No reports submitted yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {employeeReports.map(
                (report) => (
                  <button
                    key={report.id}
                    type="button"
                    onClick={() =>
                      loadReport(report)
                    }
                    className={`w-full rounded-lg border p-4 text-left transition-colors ${
                      report.date ===
                      selectedDate
                        ? "border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-950/40"
                        : "border-ink-100 hover:bg-ink-50 dark:border-ink-800 dark:hover:bg-ink-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-ink-800 dark:text-ink-100">
                        {formatDate(
                          report.date
                        )}
                      </span>

                      <span className="text-xs text-brand-600 dark:text-brand-400">
                        View
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-xs text-ink-500 dark:text-ink-400">
                      {report.completed ||
                        "No completed work recorded."}
                    </p>

                    {report.tomorrowPlan && (
                      <p className="mt-2 text-xs text-ink-400">
                        Tomorrow:{" "}
                        {report.tomorrowPlan}
                      </p>
                    )}
                  </button>
                )
              )}
            </div>
          )}
        </section>
      </div>

      {/* Admin overview */}

      {isAdmin && (
        <section className="card overflow-hidden">
          <div className="border-b border-ink-100 p-5 dark:border-ink-800">
            <h3 className="font-display font-semibold text-ink-900 dark:text-white">
              Employee Report Overview
            </h3>

            <p className="mt-1 text-xs text-ink-400">
              Daily report status for the selected
              date.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs text-ink-400 dark:border-ink-800">
                  <th className="p-4 font-medium">
                    Employee
                  </th>

                  <th className="p-4 font-medium">
                    Department
                  </th>

                  <th className="p-4 font-medium">
                    Report
                  </th>

                  <th className="p-4 font-medium">
                    Completed
                  </th>

                  <th className="p-4 font-medium">
                    Tomorrow Plan
                  </th>
                </tr>
              </thead>

              <tbody>
                {employees.map(
                  (item) => {
                    const report =
                      reports.find(
                        (record) =>
                          record.employeeId ===
                            item.id &&
                          record.date ===
                            selectedDate
                      );

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-ink-50 last:border-0 dark:border-ink-800/60"
                      >
                        <td className="p-4">
                          <div className="font-medium text-ink-800 dark:text-ink-100">
                            {item.name}
                          </div>

                          <div className="text-xs text-ink-400">
                            {item.role}
                          </div>
                        </td>

                        <td className="p-4 text-ink-600 dark:text-ink-300">
                          {item.department ||
                            "—"}
                        </td>

                        <td className="p-4">
                          {report ? (
                            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              Submitted
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                              Missing
                            </span>
                          )}
                        </td>

                        <td className="max-w-[300px] p-4 text-xs text-ink-600 dark:text-ink-300">
                          {report?.completed ||
                            "—"}
                        </td>

                        <td className="max-w-[260px] p-4 text-xs text-ink-600 dark:text-ink-300">
                          {report?.tomorrowPlan ||
                            "—"}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon,
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
            {label}
          </p>

          <p className="mt-2 text-xl font-semibold text-ink-900 dark:text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-ink-400">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
          {icon}
        </div>
      </div>
    </div>
  );
}