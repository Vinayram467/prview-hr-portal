import { useMemo, useState } from "react";
import { useAuth, ROLES } from "../context/AuthContext";
import {
  localDate,
  useData,
} from "../context/DataContext";

const EMPTY_FORM = {
  title: "",
  priorities: "",
  description: "",
  status: "Planned",
};

function formatDate(date) {
  if (!date) return "—";

  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function getTomorrow() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return localDate(tomorrow);
}

function statusClasses(status) {
  if (status === "Completed") {
    return "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300";
  }

  if (status === "In Progress") {
    return "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
  }

  return "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
}

export default function MyPlans() {
  const { user } = useAuth();

  const {
    employees,
    plans,
    reports,
    addPlan,
    updatePlan,
    deletePlan,
  } = useData();

  const isEmployee = user.role === ROLES.EMPLOYEE;

  const today = localDate();
  const tomorrow = getTomorrow();

  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState(
      isEmployee
        ? user.employeeId
        : employees[0]?.id ?? ""
    );

  const [selectedDate, setSelectedDate] =
    useState(tomorrow);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [message, setMessage] =
    useState("");

  const [editingPlanId, setEditingPlanId] =
    useState(null);

  const employeeId = isEmployee
    ? user.employeeId
    : selectedEmployeeId;

  const selectedEmployee = employees.find(
    (employee) =>
      employee.id === employeeId
  );

  const employeePlans = useMemo(() => {
    return plans
      .filter(
        (plan) =>
          plan.employeeId === employeeId
      )
      .sort((a, b) =>
        a.date < b.date ? -1 : 1
      );
  }, [plans, employeeId]);

  const upcomingPlans = employeePlans.filter(
    (plan) =>
      plan.date >= today &&
      plan.status !== "Completed"
  );

  const completedPlans = employeePlans.filter(
    (plan) =>
      plan.status === "Completed"
  );

  const todayReport = reports.find(
    (report) =>
      report.employeeId === employeeId &&
      report.date === today
  );

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingPlanId(null);
    setMessage("");
  }

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
  }

  function handleEmployeeChange(event) {
    setSelectedEmployeeId(
      event.target.value
    );

    resetForm();
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!employeeId) {
      setMessage(
        "Please select an employee."
      );
      return;
    }

    if (!selectedDate) {
      setMessage(
        "Please select a plan date."
      );
      return;
    }

    if (!form.title.trim()) {
      setMessage(
        "Please enter a plan title."
      );
      return;
    }

    if (editingPlanId) {
      updatePlan(
        editingPlanId,
        {
          employeeId,
          date: selectedDate,
          title: form.title.trim(),
          priorities:
            form.priorities.trim(),
          description:
            form.description.trim(),
          status: form.status,
        }
      );

      setMessage(
        "Plan updated successfully."
      );
    } else {
      addPlan({
        employeeId,
        date: selectedDate,
        title: form.title.trim(),
        priorities:
          form.priorities.trim(),
        description:
          form.description.trim(),
        status: form.status,
        createdBy: user.id,
        createdByName: user.name,
      });

      setMessage(
        "Plan saved successfully."
      );
    }

    setForm(EMPTY_FORM);
    setEditingPlanId(null);
  }

  function editPlan(plan) {
    setSelectedDate(plan.date);

    setForm({
      title: plan.title ?? "",
      priorities:
        plan.priorities ?? "",
      description:
        plan.description ?? "",
      status:
        plan.status ?? "Planned",
    });

    setEditingPlanId(plan.id);
    setMessage("");
  }

  function handleDelete(plan) {
    const confirmed = window.confirm(
      `Delete "${plan.title}"?`
    );

    if (!confirmed) {
      return;
    }

    deletePlan(plan.id);

    if (editingPlanId === plan.id) {
      resetForm();
    }

    setMessage(
      "Plan deleted successfully."
    );
  }

  function useTomorrowFromReport() {
    if (!todayReport?.tomorrowPlan) {
      setMessage(
        "No tomorrow plan was added to today's daily report."
      );
      return;
    }

    setSelectedDate(tomorrow);

    setForm((current) => ({
      ...current,
      description:
        todayReport.tomorrowPlan,
    }));

    setMessage(
      "Tomorrow's plan from the daily report has been added."
    );
  }

  function markCompleted(plan) {
    updatePlan(plan.id, {
      status: "Completed",
    });

    setMessage(
      "Plan marked as completed."
    );
  }

  function markInProgress(plan) {
    updatePlan(plan.id, {
      status: "In Progress",
    });

    setMessage(
      "Plan marked as in progress."
    );
  }

  if (
    !selectedEmployee &&
    employees.length === 0
  ) {
    return (
      <div className="card p-8 text-center">
        <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-white">
          No employees found
        </h2>

        <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
          Add an employee before creating plans.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="card p-5 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
              PRview Employee Portal
            </p>

            <h2 className="mt-1 font-display text-2xl font-semibold text-ink-900 dark:text-white">
              My Plans
            </h2>

            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              Plan tomorrow&apos;s work and track
              future priorities.
            </p>
          </div>

          {selectedEmployee && (
            <div className="rounded-xl bg-ink-50 px-4 py-3 dark:bg-ink-800/60">
              <p className="text-xs text-ink-400">
                Employee
              </p>

              <p className="mt-1 font-semibold text-ink-900 dark:text-white">
                {selectedEmployee.name}
              </p>

              <p className="text-xs text-ink-500 dark:text-ink-400">
                {selectedEmployee.role} ·{" "}
                {selectedEmployee.department}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Admin employee selector */}
      {!isEmployee && (
        <section className="card p-5">
          <label className="label">
            Select employee
          </label>

          <select
            className="input"
            value={selectedEmployeeId}
            onChange={handleEmployeeChange}
          >
            {employees.map((employee) => (
              <option
                key={employee.id}
                value={employee.id}
              >
                {employee.name} —{" "}
                {employee.department}
              </option>
            ))}
          </select>
        </section>
      )}

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs text-ink-400">
            Upcoming Plans
          </p>

          <p className="mt-2 text-2xl font-semibold text-ink-900 dark:text-white">
            {upcomingPlans.length}
          </p>

          <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
            Future work items
          </p>
        </div>

        <div className="card p-5">
          <p className="text-xs text-ink-400">
            In Progress
          </p>

          <p className="mt-2 text-2xl font-semibold text-blue-600 dark:text-blue-400">
            {
              employeePlans.filter(
                (plan) =>
                  plan.status ===
                  "In Progress"
              ).length
            }
          </p>

          <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
            Currently being worked on
          </p>
        </div>

        <div className="card p-5">
          <p className="text-xs text-ink-400">
            Completed
          </p>

          <p className="mt-2 text-2xl font-semibold text-green-600 dark:text-green-400">
            {completedPlans.length}
          </p>

          <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
            Finished planned items
          </p>
        </div>
      </section>

      {/* Create / edit plan */}
      <section className="card p-5 lg:p-6">
        <div className="flex flex-col gap-3 border-b border-ink-100 pb-5 dark:border-ink-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white">
              {editingPlanId
                ? "Edit Plan"
                : "Create New Plan"}
            </h3>

            <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
              Create a clear plan for tomorrow
              or any future working day.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {todayReport?.tomorrowPlan && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={
                  useTomorrowFromReport
                }
              >
                Use Tomorrow&apos;s Report Plan
              </button>
            )}

            {editingPlanId && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </div>

        {message && (
          <div className="mt-5 rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-300">
            {message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-5 space-y-5"
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="label">
                Plan date *
              </label>

              <input
                className="input"
                type="date"
                min={tomorrow}
                value={selectedDate}
                onChange={(event) =>
                  setSelectedDate(
                    event.target.value
                  )
                }
              />
            </div>

            <div>
              <label className="label">
                Status
              </label>

              <select
                className="input"
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="Planned">
                  Planned
                </option>

                <option value="In Progress">
                  In Progress
                </option>

                <option value="Completed">
                  Completed
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">
              Plan title *
            </label>

            <input
              className="input"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Example: Prepare November social media campaign"
            />
          </div>

          <div>
            <label className="label">
              Priorities
            </label>

            <textarea
              className="input min-h-24 resize-y"
              name="priorities"
              value={form.priorities}
              onChange={handleChange}
              placeholder="Example: Finalise creatives, get approval, schedule campaign."
            />
          </div>

          <div>
            <label className="label">
              Description / action plan
            </label>

            <textarea
              className="input min-h-32 resize-y"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe what you intend to accomplish and the steps you will take."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="btn btn-primary"
            >
              {editingPlanId
                ? "Update Plan"
                : "Save Plan"}
            </button>
          </div>
        </form>
      </section>

      {/* Plan list */}
      <section className="card p-5 lg:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white">
              Planned Work
            </h3>

            <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
              All plans for{" "}
              {selectedEmployee?.name}
            </p>
          </div>

          <span className="badge bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
            {employeePlans.length} plans
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {employeePlans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-xl border border-ink-100 p-5 dark:border-ink-800"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold text-ink-900 dark:text-white">
                      {plan.title}
                    </h4>

                    <span
                      className={`badge ${statusClasses(
                        plan.status
                      )}`}
                    >
                      {plan.status}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-ink-400">
                    {formatDate(plan.date)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {plan.status === "Planned" && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() =>
                        markInProgress(plan)
                      }
                    >
                      Start
                    </button>
                  )}

                  {plan.status ===
                    "In Progress" && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() =>
                        markCompleted(plan)
                      }
                    >
                      Complete
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() =>
                      editPlan(plan)
                    }
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() =>
                      handleDelete(plan)
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>

              {plan.priorities && (
                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                    Priorities
                  </p>

                  <p className="mt-1 whitespace-pre-line text-sm text-ink-600 dark:text-ink-300">
                    {plan.priorities}
                  </p>
                </div>
              )}

              {plan.description && (
                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                    Action Plan
                  </p>

                  <p className="mt-1 whitespace-pre-line text-sm text-ink-600 dark:text-ink-300">
                    {plan.description}
                  </p>
                </div>
              )}
            </div>
          ))}

          {employeePlans.length === 0 && (
            <div className="rounded-xl border border-dashed border-ink-200 p-8 text-center dark:border-ink-700">
              <p className="text-sm font-medium text-ink-600 dark:text-ink-300">
                No plans created yet.
              </p>

              <p className="mt-1 text-xs text-ink-400">
                Create tomorrow&apos;s first plan above.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}