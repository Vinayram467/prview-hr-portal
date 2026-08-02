import { useMemo } from "react";
import { useData } from "../context/DataContext";
import { payrollTrend, DEPARTMENTS } from "../data/mockData";
import DepartmentPieChart from "../components/charts/DepartmentPieChart";
import PayrollTrendChart from "../components/charts/PayrollTrendChart";
import AttendanceTrendChart from "../components/charts/AttendanceTrendChart";

export default function Reports() {
  const { employees, attendance, leaves } = useData();

  const deptData = useMemo(() => {
    const byDept = {};
    employees.forEach((e) => { byDept[e.department] = (byDept[e.department] ?? 0) + 1; });
    return Object.entries(byDept).map(([department, count]) => ({ department, count }));
  }, [employees]);

  const attendanceData = useMemo(() => {
    const byDate = {};
    attendance.forEach((a) => {
      if (!byDate[a.date]) byDate[a.date] = { present: 0, total: 0 };
      byDate[a.date].total += 1;
      if (a.status !== "Absent") byDate[a.date].present += 1;
    });
    return Object.entries(byDate)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .slice(-14)
      .map(([date, v]) => ({ date: date.slice(5), rate: Math.round((v.present / v.total) * 100) }));
  }, [attendance]);

  const leavesByType = useMemo(() => {
    const byType = {};
    leaves.forEach((l) => { byType[l.type] = (byType[l.type] ?? 0) + 1; });
    return Object.entries(byType).map(([type, count]) => ({ type, count }));
  }, [leaves]);

  const maxLeaveCount = Math.max(1, ...leavesByType.map((l) => l.count));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-display font-semibold text-ink-900 dark:text-white mb-1">Headcount by department</h3>
          <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">
            {DEPARTMENTS.length} departments · {employees.length} employees
          </p>
          <DepartmentPieChart data={deptData} />
        </div>

        <div className="card p-5">
          <h3 className="font-display font-semibold text-ink-900 dark:text-white mb-1">Attendance rate trend</h3>
          <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">Last 14 working days, company-wide</p>
          <AttendanceTrendChart data={attendanceData} />
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-display font-semibold text-ink-900 dark:text-white mb-1">Payroll cost trend</h3>
        <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">Last 6 months</p>
        <PayrollTrendChart data={payrollTrend} />
      </div>

      <div className="card p-5">
        <h3 className="font-display font-semibold text-ink-900 dark:text-white mb-4">Leave requests by type</h3>
        <div className="space-y-3">
          {leavesByType.map((l) => (
            <div key={l.type} className="flex items-center gap-3">
              <span className="w-32 text-sm text-ink-600 dark:text-ink-300 shrink-0">{l.type}</span>
              <div className="flex-1 h-2.5 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${(l.count / maxLeaveCount) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right text-sm text-ink-500 dark:text-ink-400">{l.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
