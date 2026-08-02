import { useMemo } from "react";
import { useAuth, ROLES } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import AttendanceTrendChart from "../components/charts/AttendanceTrendChart";
import DepartmentPieChart from "../components/charts/DepartmentPieChart";
import { payrollTrend } from "../data/mockData";

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function Dashboard() {
  const { user } = useAuth();
  const { employees, attendance, leaves, payroll, tasks } = useData();

  if (user.role === ROLES.EMPLOYEE) {
    return <EmployeeDashboard employeeId={user.employeeId} data={{ employees, attendance, leaves, payroll, tasks }} />;
  }
  return <AdminDashboard data={{ employees, attendance, leaves, payroll }} />;
}

function AdminDashboard({ data }) {
  const { employees, attendance, leaves, payroll } = data;
  const today = todayStr();

  const presentToday = attendance.filter((a) => a.date === today && a.status !== "Absent").length;
  const onLeave = employees.filter((e) => e.status === "On Leave").length;
  const pendingLeaves = leaves.filter((l) => l.status === "Pending").length;
  const monthlyPayroll = payroll.reduce((sum, p) => sum + p.netPay, 0);

  const trendData = useMemo(() => {
    const byDate = {};
    attendance.forEach((a) => {
      if (!byDate[a.date]) byDate[a.date] = { present: 0, total: 0 };
      byDate[a.date].total += 1;
      if (a.status !== "Absent") byDate[a.date].present += 1;
    });
    return Object.entries(byDate)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .slice(-14)
      .map(([date, v]) => ({
        date: date.slice(5),
        rate: Math.round((v.present / v.total) * 100),
      }));
  }, [attendance]);

  const deptData = useMemo(() => {
    const byDept = {};
    employees.forEach((e) => {
      byDept[e.department] = (byDept[e.department] ?? 0) + 1;
    });
    return Object.entries(byDept).map(([department, count]) => ({ department, count }));
  }, [employees]);

  const recentLeaves = [...leaves]
    .sort((a, b) => (a.appliedOn > b.appliedOn ? -1 : 1))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value={employees.length} delta={4} />
        <StatCard label="Present Today" value={`${presentToday}/${employees.length}`} delta={2} />
        <StatCard label="On Leave" value={onLeave} delta={-1} />
        <StatCard label="Monthly Payroll" value={`EGP ${monthlyPayroll.toLocaleString()}`} delta={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-display font-semibold text-ink-900 dark:text-white mb-1">
            Attendance rate
          </h3>
          <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">Last 14 working days</p>
          <AttendanceTrendChart data={trendData} />
        </div>
        <div className="card p-5">
          <h3 className="font-display font-semibold text-ink-900 dark:text-white mb-1">
            Headcount by department
          </h3>
          <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">{employees.length} total</p>
          <DepartmentPieChart data={deptData} />
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-display font-semibold text-ink-900 dark:text-white mb-4">
          Recent leave requests
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-400 border-b border-ink-100 dark:border-ink-800">
                <th className="pb-2 font-medium">Employee</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">Dates</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentLeaves.map((l) => {
                const emp = employees.find((e) => e.id === l.employeeId);
                return (
                  <tr key={l.id} className="border-b border-ink-50 dark:border-ink-800/60 last:border-0">
                    <td className="py-2.5 text-ink-800 dark:text-ink-100">{emp?.name ?? "—"}</td>
                    <td className="py-2.5 text-ink-600 dark:text-ink-300">{l.type}</td>
                    <td className="py-2.5 text-ink-600 dark:text-ink-300">
                      {l.startDate} → {l.endDate}
                    </td>
                    <td className="py-2.5">
                      <Badge status={l.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EmployeeDashboard({ employeeId, data }) {
  const { employees, attendance, leaves, payroll, tasks } = data;
  const me = employees.find((e) => e.id === employeeId);
  const today = todayStr();
  const todayRecord = attendance.find((a) => a.employeeId === employeeId && a.date === today);
  const myLeaves = leaves.filter((l) => l.employeeId === employeeId);
  const pendingLeaves = myLeaves.filter((l) => l.status === "Pending").length;
  const approvedThisYear = myLeaves.filter((l) => l.status === "Approved").length;
  const myPayslip = payroll.find((p) => p.employeeId === employeeId);
  const myTasks = tasks.filter((t) => t.employeeId === employeeId);
  const openTasks = myTasks.filter((t) => t.status !== "Done").length;

  return (
    <div className="space-y-6">
      <div className="card p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-ink-500 dark:text-ink-400">Welcome back,</p>
          <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-white">
            {me?.name}
          </h2>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-0.5">
            {me?.role} · {me?.department}
          </p>
        </div>
        <Badge status={todayRecord?.status ?? "Absent"} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Today's status" value={todayRecord?.checkIn ? `In at ${todayRecord.checkIn}` : "Not checked in"} />
        <StatCard label="Open tasks" value={openTasks} />
        <StatCard label="Pending leave requests" value={pendingLeaves} />
        <StatCard label="Approved leaves (all time)" value={approvedThisYear} />
      </div>

      <div className="card p-5">
        <h3 className="font-display font-semibold text-ink-900 dark:text-white mb-4">
          Latest payslip — {myPayslip?.month}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-ink-400 text-xs">Base salary</p>
            <p className="font-semibold text-ink-900 dark:text-white mt-1">
              EGP {myPayslip?.baseSalary.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-ink-400 text-xs">Bonus</p>
            <p className="font-semibold text-brand-600 mt-1">+ EGP {myPayslip?.bonus.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-ink-400 text-xs">Deductions</p>
            <p className="font-semibold text-red-600 mt-1">- EGP {myPayslip?.deductions.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-ink-400 text-xs">Net pay</p>
            <p className="font-semibold text-ink-900 dark:text-white mt-1">
              EGP {myPayslip?.netPay.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-display font-semibold text-ink-900 dark:text-white mb-4">
          Your recent leave requests
        </h3>
        {myLeaves.length === 0 ? (
          <p className="text-sm text-ink-400">No leave requests yet.</p>
        ) : (
          <ul className="space-y-3">
            {myLeaves.slice(0, 5).map((l) => (
              <li key={l.id} className="flex items-center justify-between text-sm">
                <span className="text-ink-700 dark:text-ink-200">
                  {l.type} — {l.startDate} → {l.endDate}
                </span>
                <Badge status={l.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
