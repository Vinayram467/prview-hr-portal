import { useState } from "react";
import { useAuth, ROLES } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

export default function Payroll() {
  const { user } = useAuth();
  const { employees, payroll, updatePayroll } = useData();
  const canEdit = user.role === ROLES.ADMIN;

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ bonus: 0, deductions: 0 });

  const rows =
    user.role === ROLES.EMPLOYEE
      ? payroll.filter((p) => p.employeeId === user.employeeId)
      : payroll;

  const total = rows.reduce((sum, p) => sum + p.netPay, 0);

  function openEdit(p) {
    setEditing(p);
    setForm({ bonus: p.bonus, deductions: p.deductions });
  }

  function handleSubmit(e) {
    e.preventDefault();
    updatePayroll(editing.id, form);
    setEditing(null);
  }

  return (
    <div className="space-y-5">
      <div className="card p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-ink-500 dark:text-ink-400">
            {user.role === ROLES.EMPLOYEE ? "Your latest payslip" : "Total payroll this cycle"}
          </p>
          <p className="font-display text-2xl font-semibold text-ink-900 dark:text-white mt-1">
            EGP {total.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[680px]">
          <thead>
            <tr className="text-left text-xs text-ink-400 border-b border-ink-100 dark:border-ink-800">
              {user.role !== ROLES.EMPLOYEE && <th className="p-4 font-medium">Employee</th>}
              <th className="p-4 font-medium">Month</th>
              <th className="p-4 font-medium">Base</th>
              <th className="p-4 font-medium">Bonus</th>
              <th className="p-4 font-medium">Deductions</th>
              <th className="p-4 font-medium">Net pay</th>
              <th className="p-4 font-medium">Status</th>
              {canEdit && <th className="p-4 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const emp = employees.find((e) => e.id === p.employeeId);
              return (
                <tr key={p.id} className="border-b border-ink-50 dark:border-ink-800/60 last:border-0">
                  {user.role !== ROLES.EMPLOYEE && (
                    <td className="p-4 text-ink-800 dark:text-ink-100">{emp?.name ?? "—"}</td>
                  )}
                  <td className="p-4 text-ink-600 dark:text-ink-300">{p.month}</td>
                  <td className="p-4 text-ink-600 dark:text-ink-300">EGP {p.baseSalary.toLocaleString()}</td>
                  <td className="p-4 text-brand-600 dark:text-brand-400">+ EGP {p.bonus.toLocaleString()}</td>
                  <td className="p-4 text-red-600">- EGP {p.deductions.toLocaleString()}</td>
                  <td className="p-4 font-semibold text-ink-900 dark:text-white">EGP {p.netPay.toLocaleString()}</td>
                  <td className="p-4"><Badge status={p.status} /></td>
                  {canEdit && (
                    <td className="p-4 text-right">
                      <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => openEdit(p)}>Edit</button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={`Adjust payroll — ${employees.find((e) => e.id === editing?.employeeId)?.name ?? ""}`}
        footer={
          <>
            <button className="btn-outline" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn-primary" type="submit" form="payroll-form">Save</button>
          </>
        }
      >
        <form id="payroll-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Bonus (EGP)</label>
            <input type="number" className="input" value={form.bonus} onChange={(e) => setForm({ ...form, bonus: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Deductions (EGP)</label>
            <input type="number" className="input" value={form.deductions} onChange={(e) => setForm({ ...form, deductions: Number(e.target.value) })} />
          </div>
          {editing && (
            <p className="text-xs text-ink-400">
              New net pay: EGP {(editing.baseSalary + form.bonus - form.deductions).toLocaleString()}
            </p>
          )}
        </form>
      </Modal>
    </div>
  );
}
