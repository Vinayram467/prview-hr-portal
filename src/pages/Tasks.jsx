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
};

export default function Tasks() {
  const { user } = useAuth();
  const { employees, tasks, addTask, updateTask, deleteTask, updateTaskStatus } = useData();
  const canManage = user.role === ROLES.ADMIN || user.role === ROLES.HR;
  const isSelf = user.role === ROLES.EMPLOYEE;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [employeeFilter, setEmployeeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const rows = useMemo(() => {
    let list = isSelf ? tasks.filter((t) => t.employeeId === user.employeeId) : tasks;
    if (canManage) {
      if (employeeFilter !== "All") list = list.filter((t) => t.employeeId === employeeFilter);
      if (statusFilter !== "All") list = list.filter((t) => t.status === statusFilter);
    }
    return [...list].sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
  }, [tasks, isSelf, canManage, user.employeeId, employeeFilter, statusFilter]);

  function openAdd() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, employeeId: employees[0]?.id ?? "" });
    setModalOpen(true);
  }

  function openEdit(task) {
    setEditingId(task.id);
    setForm(task);
    setModalOpen(true);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (editingId) {
      updateTask(editingId, form);
    } else {
      addTask({ ...form, assignedBy: user.name });
    }
    setModalOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {canManage ? (
          <div className="flex flex-wrap gap-3">
            <select className="input max-w-[200px]" value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}>
              <option value="All">All employees</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <select className="input max-w-[160px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All statuses</option>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        ) : <div />}
        {canManage && <button className="btn-primary" onClick={openAdd}>+ Assign task</button>}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-xs text-ink-400 border-b border-ink-100 dark:border-ink-800">
              <th className="p-4 font-medium">Task</th>
              {!isSelf && <th className="p-4 font-medium">Assigned to</th>}
              <th className="p-4 font-medium">Priority</th>
              <th className="p-4 font-medium">Due date</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => {
              const emp = employees.find((e) => e.id === t.employeeId);
              const overdue = t.status !== "Done" && t.dueDate < new Date().toISOString().slice(0, 10);
              return (
                <tr key={t.id} className="border-b border-ink-50 dark:border-ink-800/60 last:border-0">
                  <td className="p-4">
                    <p className="font-medium text-ink-800 dark:text-ink-100">{t.title}</p>
                    {t.description && (
                      <p className="text-xs text-ink-400 mt-0.5 max-w-[280px] truncate" title={t.description}>
                        {t.description}
                      </p>
                    )}
                  </td>
                  {!isSelf && <td className="p-4 text-ink-600 dark:text-ink-300">{emp?.name ?? "—"}</td>}
                  <td className="p-4"><Badge status={t.priority} /></td>
                  <td className="p-4">
                    <span className={overdue ? "text-red-600 font-medium" : "text-ink-600 dark:text-ink-300"}>
                      {t.dueDate}{overdue ? " (overdue)" : ""}
                    </span>
                  </td>
                  <td className="p-4">
                    {isSelf ? (
                      <select
                        className="input !py-1 !px-2 text-xs max-w-[130px]"
                        value={t.status}
                        onChange={(e) => updateTaskStatus(t.id, e.target.value)}
                      >
                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    ) : (
                      <Badge status={t.status} />
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      {canManage && (
                        <>
                          <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => openEdit(t)}>Edit</button>
                          <button
                            className="btn-ghost !px-2 !py-1 text-xs text-red-600"
                            onClick={() => setConfirmDeleteId(t.id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ink-400 text-sm">No tasks found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit task" : "Assign task"}
        footer={
          <>
            <button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" type="submit" form="task-form">
              {editingId ? "Save changes" : "Assign task"}
            </button>
          </>
        }
      >
        <form id="task-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What needs to get done?"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Assign to</label>
              <select className="input" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
                {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Due date</label>
            <input type="date" className="input" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
        </form>
      </Modal>

      <Modal
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title="Delete this task?"
        footer={
          <>
            <button className="btn-outline" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
            <button
              className="btn-danger"
              onClick={() => {
                deleteTask(confirmDeleteId);
                setConfirmDeleteId(null);
              }}
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-ink-600 dark:text-ink-300">This can't be undone.</p>
      </Modal>
    </div>
  );
}
