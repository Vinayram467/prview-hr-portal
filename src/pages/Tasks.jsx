import { useMemo, useState } from "react";
import { useAuth, ROLES } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

const STATUSES = ["To Do", "In Progress", "Done"];
const PRIORITIES = ["Low", "Medium", "High"];

const EMPTY_FORM = {
  title: "",
  description: "",
  employeeId: "",
  priority: "Medium",
  dueDate: new Date().toISOString().slice(0, 10),
  progress: 0,
};

export default function Tasks() {
  const { user } = useAuth();

  const {
    employees,
    tasks,
    addTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
  } = useData();

  const canManage =
    user.role === ROLES.ADMIN ||
    user.role === ROLES.HR;

  const isEmployee =
    user.role === ROLES.EMPLOYEE;

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [employeeFilter, setEmployeeFilter] =
    useState("All");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [confirmDeleteId, setConfirmDeleteId] =
    useState(null);


  // ============================================
  // TASK LIST
  // ============================================

  const rows = useMemo(() => {
    let list = isEmployee
      ? tasks.filter(
          (task) =>
            task.employeeId === user.employeeId
        )
      : tasks;

    if (canManage) {
      if (employeeFilter !== "All") {
        list = list.filter(
          (task) =>
            task.employeeId === employeeFilter
        );
      }

      if (statusFilter !== "All") {
        list = list.filter(
          (task) =>
            task.status === statusFilter
        );
      }
    }

    return [...list].sort((a, b) =>
      a.dueDate < b.dueDate ? -1 : 1
    );
  }, [
    tasks,
    isEmployee,
    canManage,
    user.employeeId,
    employeeFilter,
    statusFilter,
  ]);


  // ============================================
  // ADD TASK
  // ============================================

  function openAdd() {
    setEditingId(null);

    // Employee automatically becomes
    // the owner of their own task.
    if (isEmployee) {
      setForm({
        ...EMPTY_FORM,
        employeeId: user.employeeId,
        progress: 0,
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        employeeId:
          employees[0]?.id ?? "",
        progress: 0,
      });
    }

    setModalOpen(true);
  }


  // ============================================
  // EDIT TASK
  // ============================================

  function openEdit(task) {
    setEditingId(task.id);

    setForm({
      title: task.title || "",
      description:
        task.description || "",
      employeeId:
        task.employeeId || "",
      priority:
        task.priority || "Medium",
      dueDate:
        task.dueDate ||
        new Date()
          .toISOString()
          .slice(0, 10),
      progress:
        typeof task.progress === "number"
          ? task.progress
          : task.status === "Done"
          ? 100
          : 0,
    });

    setModalOpen(true);
  }


  // ============================================
  // SAVE TASK
  // ============================================

  function handleSubmit(e) {
    e.preventDefault();

    let progress = Number(
      form.progress || 0
    );

    let status = "To Do";

    if (progress >= 100) {
      progress = 100;
      status = "Done";
    } else if (progress > 0) {
      status = "In Progress";
    }

    // ------------------------------------------
    // EDIT EXISTING TASK
    // ------------------------------------------

    if (editingId) {
      const existingTask = tasks.find(
        (task) =>
          task.id === editingId
      );

      // Employee can only edit
      // their own task.
      if (
        isEmployee &&
        existingTask?.employeeId !==
          user.employeeId
      ) {
        setModalOpen(false);
        return;
      }

      updateTask(editingId, {
        title: form.title,
        description: form.description,
        priority: form.priority,
        dueDate: form.dueDate,
        progress,
        status,
      });

      setModalOpen(false);
      return;
    }


    // ------------------------------------------
    // CREATE NEW TASK
    // ------------------------------------------

    const employeeId = isEmployee
      ? user.employeeId
      : form.employeeId;

    addTask({
      title: form.title,
      description: form.description,
      employeeId,
      assignedBy: isEmployee
        ? user.name
        : user.name,
      priority: form.priority,
      dueDate: form.dueDate,
      progress,
      status,
    });

    setModalOpen(false);
  }


  // ============================================
  // UPDATE PROGRESS
  // ============================================

  function handleProgressChange(
    task,
    value
  ) {
    const progress = Number(value);

    let status = "To Do";

    if (progress >= 100) {
      status = "Done";
    } else if (progress > 0) {
      status = "In Progress";
    }

    updateTask(task.id, {
      progress,
      status,
    });
  }


  // ============================================
  // DELETE
  // ============================================

  function handleDelete() {
    if (!confirmDeleteId) {
      return;
    }

    const task = tasks.find(
      (item) =>
        item.id === confirmDeleteId
    );

    // Employee can only delete
    // their own task.
    if (
      isEmployee &&
      task?.employeeId !== user.employeeId
    ) {
      setConfirmDeleteId(null);
      return;
    }

    deleteTask(confirmDeleteId);

    setConfirmDeleteId(null);
  }


  // ============================================
  // UI
  // ============================================

  return (
    <div className="space-y-5">

      {/* ========================================
          HEADER
         ======================================== */}

      <div className="flex flex-wrap items-center justify-between gap-3">

        <div>
          <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-white">
            {isEmployee
              ? "My Tasks"
              : "Tasks"}
          </h2>

          <p className="text-sm text-ink-400 mt-1">
            {isEmployee
              ? "Add and manage your daily work."
              : "Manage and assign employee tasks."}
          </p>
        </div>


        <div className="flex flex-wrap gap-3">

          {/* ADMIN FILTERS */}

          {canManage && (
            <>
              <select
                className="input max-w-[200px]"
                value={employeeFilter}
                onChange={(e) =>
                  setEmployeeFilter(
                    e.target.value
                  )
                }
              >
                <option value="All">
                  All employees
                </option>

                {employees.map((employee) => (
                  <option
                    key={employee.id}
                    value={employee.id}
                  >
                    {employee.name}
                  </option>
                ))}
              </select>


              <select
                className="input max-w-[160px]"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
              >
                <option value="All">
                  All statuses
                </option>

                {STATUSES.map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                ))}
              </select>
            </>
          )}


          {/* ADD TASK */}

          <button
            className="btn-primary"
            onClick={openAdd}
          >
            + {isEmployee
              ? "Add Task"
              : "Assign Task"}
          </button>

        </div>
      </div>


      {/* ========================================
          TASK CARDS
         ======================================== */}

      <div className="space-y-3">

        {rows.map((task) => {

          const employee =
            employees.find(
              (e) =>
                e.id === task.employeeId
            );

          const progress =
            typeof task.progress ===
            "number"
              ? task.progress
              : task.status === "Done"
              ? 100
              : task.status ===
                "In Progress"
              ? 50
              : 0;

          const overdue =
            task.status !== "Done" &&
            task.dueDate <
              new Date()
                .toISOString()
                .slice(0, 10);

          const canEdit =
            canManage ||
            (
              isEmployee &&
              task.employeeId ===
                user.employeeId
            );


          return (
            <div
              key={task.id}
              className="card p-5"
            >

              {/* TOP */}

              <div className="flex flex-wrap items-start justify-between gap-4">

                <div className="min-w-0">

                  <h3 className="font-medium text-ink-900 dark:text-white text-base">
                    {task.title}
                  </h3>

                  {task.description && (
                    <p className="text-sm text-ink-400 mt-1">
                      {task.description}
                    </p>
                  )}

                  {!isEmployee && (
                    <p className="text-xs text-ink-400 mt-2">
                      Assigned to:{" "}
                      <span className="font-medium">
                        {employee?.name ??
                          "Unknown"}
                      </span>
                    </p>
                  )}

                </div>


                <div className="flex items-center gap-2">

                  <Badge
                    status={
                      task.priority
                    }
                  />

                  <Badge
                    status={
                      task.status
                    }
                  />

                </div>

              </div>


              {/* INFO */}

              <div className="flex flex-wrap gap-5 mt-4 text-xs text-ink-500">

                <div>
                  <span className="text-ink-400">
                    Due:
                  </span>{" "}
                  <span
                    className={
                      overdue
                        ? "text-red-600 font-medium"
                        : ""
                    }
                  >
                    {task.dueDate}
                  </span>

                  {overdue && (
                    <span className="text-red-600 ml-1">
                      (Overdue)
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-ink-400">
                    Completion:
                  </span>{" "}
                  <strong>
                    {progress}%
                  </strong>
                </div>

              </div>


              {/* PROGRESS */}

              <div className="mt-4">

                <div className="flex items-center justify-between mb-2">

                  <span className="text-xs font-medium text-ink-500">
                    Progress
                  </span>

                  <span className="text-xs font-semibold text-brand-600">
                    {progress}%
                  </span>

                </div>


                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progress}
                  onChange={(e) =>
                    handleProgressChange(
                      task,
                      e.target.value
                    )
                  }
                  className="w-full accent-brand-600"
                />


                <div className="h-2 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden mt-2">

                  <div
                    className="h-full bg-brand-600 rounded-full transition-all duration-300"
                    style={{
                      width: `${progress}%`,
                    }}
                  />

                </div>

              </div>


              {/* ACTIONS */}

              {canEdit && (
                <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-ink-100 dark:border-ink-800">

                  <button
                    className="btn-ghost !px-3 !py-1.5 text-xs"
                    onClick={() =>
                      openEdit(task)
                    }
                  >
                    Edit
                  </button>


                  <button
                    className="btn-ghost !px-3 !py-1.5 text-xs text-red-600"
                    onClick={() =>
                      setConfirmDeleteId(
                        task.id
                      )
                    }
                  >
                    Delete
                  </button>

                </div>
              )}

            </div>
          );
        })}


        {/* EMPTY */}

        {rows.length === 0 && (
          <div className="card p-10 text-center">

            <div className="text-4xl mb-3">
              ✓
            </div>

            <h3 className="font-medium text-ink-800 dark:text-white">
              No tasks yet
            </h3>

            <p className="text-sm text-ink-400 mt-1">
              Add your first task to start
              tracking your work.
            </p>

            <button
              className="btn-primary mt-4"
              onClick={openAdd}
            >
              + Add Task
            </button>

          </div>
        )}

      </div>


      {/* ========================================
          ADD / EDIT MODAL
         ======================================== */}

      <Modal
        open={modalOpen}
        onClose={() =>
          setModalOpen(false)
        }
        title={
          editingId
            ? "Edit Task"
            : isEmployee
            ? "Add My Task"
            : "Assign Task"
        }
        footer={
          <>
            <button
              className="btn-outline"
              onClick={() =>
                setModalOpen(false)
              }
            >
              Cancel
            </button>

            <button
              className="btn-primary"
              type="submit"
              form="task-form"
            >
              {editingId
                ? "Save Changes"
                : isEmployee
                ? "Add Task"
                : "Assign Task"}
            </button>
          </>
        }
      >

        <form
          id="task-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          {/* TITLE */}

          <div>
            <label className="label">
              Task Title
            </label>

            <input
              className="input"
              required
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value,
                })
              }
              placeholder="e.g. Create Instagram campaign"
            />
          </div>


          {/* DESCRIPTION */}

          <div>
            <label className="label">
              Description
            </label>

            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description:
                    e.target.value,
                })
              }
              placeholder="Describe what needs to be completed..."
            />
          </div>


          {/* ADMIN ASSIGNMENT */}

          {canManage && (
            <div>
              <label className="label">
                Assign To
              </label>

              <select
                className="input"
                value={form.employeeId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    employeeId:
                      e.target.value,
                  })
                }
                required
              >

                {employees.map(
                  (employee) => (
                    <option
                      key={employee.id}
                      value={employee.id}
                    >
                      {employee.name}
                    </option>
                  )
                )}

              </select>
            </div>
          )}


          {/* PRIORITY + DUE DATE */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <div>
              <label className="label">
                Priority
              </label>

              <select
                className="input"
                value={form.priority}
                onChange={(e) =>
                  setForm({
                    ...form,
                    priority:
                      e.target.value,
                  })
                }
              >

                {PRIORITIES.map(
                  (priority) => (
                    <option
                      key={priority}
                      value={priority}
                    >
                      {priority}
                    </option>
                  )
                )}

              </select>
            </div>


            <div>
              <label className="label">
                Due Date
              </label>

              <input
                type="date"
                className="input"
                required
                value={form.dueDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    dueDate:
                      e.target.value,
                  })
                }
              />
            </div>

          </div>


          {/* PROGRESS */}

          <div>

            <div className="flex items-center justify-between">

              <label className="label mb-0">
                Completion
              </label>

              <span className="text-sm font-semibold text-brand-600">
                {form.progress}%
              </span>

            </div>


            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={form.progress}
              onChange={(e) =>
                setForm({
                  ...form,
                  progress:
                    Number(
                      e.target.value
                    ),
                })
              }
              className="w-full accent-brand-600 mt-3"
            />

          </div>

        </form>

      </Modal>


      {/* ========================================
          DELETE CONFIRMATION
         ======================================== */}

      <Modal
        open={!!confirmDeleteId}
        onClose={() =>
          setConfirmDeleteId(null)
        }
        title="Delete this task?"
        footer={
          <>
            <button
              className="btn-outline"
              onClick={() =>
                setConfirmDeleteId(null)
              }
            >
              Cancel
            </button>

            <button
              className="btn-danger"
              onClick={handleDelete}
            >
              Delete
            </button>
          </>
        }
      >

        <p className="text-sm text-ink-600 dark:text-ink-300">
          This task will be permanently
          removed from your task list.
        </p>

      </Modal>

    </div>
  );
}