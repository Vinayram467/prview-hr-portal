import { useMemo, useState } from "react";
import { useAuth, ROLES } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

const LEAVE_TYPES = ["Annual Leave", "Sick Leave", "Casual Leave", "Unpaid Leave"];

const EMPTY_FORM = {
  type: LEAVE_TYPES[0],
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  reason: "",
};

export default function Leaves() {
  const { user } = useAuth();
  const { employees, leaves, requestLeave, updateLeaveStatus } = useData();
  const isSelf = user.role === ROLES.EMPLOYEE;
  const canReview = user.role === ROLES.ADMIN || user.role === ROLES.HR;

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [statusFilter, setStatusFilter] = useState("All");

  const rows = useMemo(() => {
    let list = isSelf ? leaves.filter((l) => l.employeeId === user.employeeId) : leaves;
    if (!isSelf && statusFilter !== "All") list = list.filter((l) => l.status === statusFilter);
    return [...list].sort((a, b) => (a.appliedOn < b.appliedOn ? 1 : -1));
  }, [leaves, isSelf, user.employeeId, statusFilter]);

  function handleSubmit(e) {
    e.preventDefault();
    requestLeave({ ...form, employeeId: user.employeeId });
    setForm(EMPTY_FORM);
    setModalOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {canReview ? (
          <select className="input max-w-[180px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All statuses</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>
        ) : <div />}
        {isSelf && (
          <button className="btn-primary" onClick={() => setModalOpen(true)}>+ Request leave</button>
        )}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-xs text-ink-400 border-b border-ink-100 dark:border-ink-800">
              {!isSelf && <th className="p-4 font-medium">Employee</th>}
              <th className="p-4 font-medium">Type</th>
              <th className="p-4 font-medium">Dates</th>
              <th className="p-4 font-medium">Reason</th>
              <th className="p-4 font-medium">Status</th>
              {canReview && <th className="p-4 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => {
              const emp = employees.find((e) => e.id === l.employeeId);
              return (
                <tr key={l.id} className="border-b border-ink-50 dark:border-ink-800/60 last:border-0">
                  {!isSelf && <td className="p-4 text-ink-800 dark:text-ink-100">{emp?.name ?? "—"}</td>}
                  <td className="p-4 text-ink-600 dark:text-ink-300">{l.type}</td>
                  <td className="p-4 text-ink-600 dark:text-ink-300">{l.startDate} → {l.endDate}</td>
                  <td className="p-4 text-ink-600 dark:text-ink-300 max-w-[220px] truncate" title={l.reason}>{l.reason}</td>
                  <td className="p-4"><Badge status={l.status} /></td>
                  {canReview && (
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="btn-ghost !px-2 !py-1 text-xs text-brand-700 dark:text-brand-400 disabled:opacity-30"
                          disabled={l.status !== "Pending"}
                          onClick={() => updateLeaveStatus(l.id, "Approved")}
                        >
                          Approve
                        </button>
                        <button
                          className="btn-ghost !px-2 !py-1 text-xs text-red-600 disabled:opacity-30"
                          disabled={l.status !== "Pending"}
                          onClick={() => updateLeaveStatus(l.id, "Rejected")}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ink-400 text-sm">No leave requests found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Request leave"
        footer={
          <>
            <button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" type="submit" form="leave-form">Submit request</button>
          </>
        }
      >
        <form id="leave-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Leave type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {LEAVE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start date</label>
              <input type="date" className="input" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="label">End date</label>
              <input type="date" className="input" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Reason</label>
            <textarea
              className="input"
              rows={3}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Briefly describe the reason for your leave"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
