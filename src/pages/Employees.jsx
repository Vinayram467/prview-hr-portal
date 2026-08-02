import { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { useAuth, ROLES } from "../context/AuthContext";
import { DEPARTMENTS } from "../data/mockData";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

const EMPTY_FORM = {
  name: "",
  role: "",
  department: DEPARTMENTS[0],
  email: "",
  phone: "",
  joinDate: new Date().toISOString().slice(0, 10),
  status: "Active",
  salary: 20000,
  avatarColor: "#7C3AED",
};

export default function Employees() {
  const { user } = useAuth();
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useData();
  const canDelete = user.role === ROLES.ADMIN;

  const [query, setQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const matchesQuery =
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.role.toLowerCase().includes(query.toLowerCase());
      const matchesDept = deptFilter === "All" || e.department === deptFilter;
      return matchesQuery && matchesDept;
    });
  }, [employees, query, deptFilter]);

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(emp) {
    setEditingId(emp.id);
    setForm(emp);
    setModalOpen(true);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (editingId) {
      updateEmployee(editingId, form);
    } else {
      addEmployee(form);
    }
    setModalOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <input
            className="input max-w-xs"
            placeholder="Search by name or role..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select className="input max-w-[180px]" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="All">All departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <button className="btn-primary" onClick={openAdd}>+ Add employee</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-xs text-ink-400 border-b border-ink-100 dark:border-ink-800">
              <th className="p-4 font-medium">Employee</th>
              <th className="p-4 font-medium">Department</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Join date</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => (
              <tr key={emp.id} className="border-b border-ink-50 dark:border-ink-800/60 last:border-0">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-full text-white text-xs font-semibold"
                      style={{ backgroundColor: emp.avatarColor }}
                    >
                      {emp.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                    <div>
                      <p className="font-medium text-ink-800 dark:text-ink-100">{emp.name}</p>
                      <p className="text-xs text-ink-400">{emp.role}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-ink-600 dark:text-ink-300">{emp.department}</td>
                <td className="p-4 text-ink-600 dark:text-ink-300">{emp.email}</td>
                <td className="p-4 text-ink-600 dark:text-ink-300">{emp.joinDate}</td>
                <td className="p-4"><Badge status={emp.status} /></td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => openEdit(emp)}>Edit</button>
                    {canDelete && (
                      <button
                        className="btn-ghost !px-2 !py-1 text-xs text-red-600"
                        onClick={() => setConfirmDeleteId(emp.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ink-400 text-sm">
                  No employees match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit employee" : "Add employee"}
        footer={
          <>
            <button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" type="submit" form="employee-form">
              {editingId ? "Save changes" : "Add employee"}
            </button>
          </>
        }
      >
        <form id="employee-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Full name</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Job title</label>
              <input className="input" required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Department</label>
              <select className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option>Active</option>
                <option>On Leave</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Join date</label>
              <input type="date" className="input" value={form.joinDate} onChange={(e) => setForm({ ...form, joinDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Base salary (EGP)</label>
              <input type="number" className="input" value={form.salary} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })} />
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title="Remove employee?"
        footer={
          <>
            <button className="btn-outline" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
            <button
              className="btn-danger"
              onClick={() => {
                deleteEmployee(confirmDeleteId);
                setConfirmDeleteId(null);
              }}
            >
              Remove
            </button>
          </>
        }
      >
        <p className="text-sm text-ink-600 dark:text-ink-300">
          This removes the employee record from this demo dataset. This can't be undone.
        </p>
      </Modal>
    </div>
  );
}
