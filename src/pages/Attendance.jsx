import { useMemo, useState } from "react";
import { useAuth, ROLES } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import Badge from "../components/ui/Badge";

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function Attendance() {
  const { user } = useAuth();
  const { employees, attendance, checkIn, checkOut } = useData();
  const [employeeFilter, setEmployeeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const isSelf = user.role === ROLES.EMPLOYEE;
  const today = todayStr();
  const myRecord = isSelf
    ? attendance.find((a) => a.employeeId === user.employeeId && a.date === today)
    : null;

  const rows = useMemo(() => {
    let list = isSelf ? attendance.filter((a) => a.employeeId === user.employeeId) : attendance;
    if (!isSelf) {
      if (employeeFilter !== "All") list = list.filter((a) => a.employeeId === employeeFilter);
      if (statusFilter !== "All") list = list.filter((a) => a.status === statusFilter);
    }
    return [...list].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 60);
  }, [attendance, isSelf, user.employeeId, employeeFilter, statusFilter]);

  return (
    <div className="space-y-5">
      {isSelf && (
        <div className="card p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-ink-500 dark:text-ink-400">Today, {today}</p>
            <p className="font-display text-lg font-semibold text-ink-900 dark:text-white mt-1">
              {myRecord?.checkIn
                ? `Checked in at ${myRecord.checkIn}${myRecord.checkOut ? ` · out at ${myRecord.checkOut}` : ""}`
                : "You haven't checked in yet"}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              className="btn-primary"
              disabled={!!myRecord?.checkIn}
              onClick={() => checkIn(user.employeeId)}
            >
              Check in
            </button>
            <button
              className="btn-outline"
              disabled={!myRecord?.checkIn || !!myRecord?.checkOut}
              onClick={() => checkOut(user.employeeId)}
            >
              Check out
            </button>
          </div>
        </div>
      )}

      {!isSelf && (
        <div className="flex flex-wrap gap-3">
          <select className="input max-w-[220px]" value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}>
            <option value="All">All employees</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <select className="input max-w-[180px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All statuses</option>
            <option>Present</option>
            <option>Late</option>
            <option>Absent</option>
          </select>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-left text-xs text-ink-400 border-b border-ink-100 dark:border-ink-800">
              {!isSelf && <th className="p-4 font-medium">Employee</th>}
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Check in</th>
              <th className="p-4 font-medium">Check out</th>
              <th className="p-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const emp = employees.find((e) => e.id === r.employeeId);
              return (
                <tr key={r.id} className="border-b border-ink-50 dark:border-ink-800/60 last:border-0">
                  {!isSelf && <td className="p-4 text-ink-800 dark:text-ink-100">{emp?.name ?? "—"}</td>}
                  <td className="p-4 text-ink-600 dark:text-ink-300">{r.date}</td>
                  <td className="p-4 text-ink-600 dark:text-ink-300">{r.checkIn ?? "—"}</td>
                  <td className="p-4 text-ink-600 dark:text-ink-300">{r.checkOut ?? "—"}</td>
                  <td className="p-4"><Badge status={r.status} /></td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-ink-400 text-sm">No records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
