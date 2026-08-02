// ============================================
// Demo data only. Replace with real API calls
// when you connect this template to a backend.
// ============================================

export const DEPARTMENTS = [
  "Engineering",
  "Sales",
  "Marketing",
  "Finance",
  "Human Resources",
];

export const seedEmployees = [
  { id: "emp-001", name: "Laila Hassan", role: "Frontend Engineer", department: "Engineering", email: "laila.hassan@talentflow.io", phone: "+20 100 111 2233", joinDate: "2022-03-14", status: "Active", salary: 32000, avatarColor: "#7C3AED" },
  { id: "emp-002", name: "Omar Adel", role: "Backend Engineer", department: "Engineering", email: "omar.adel@talentflow.io", phone: "+20 100 222 3344", joinDate: "2021-11-02", status: "Active", salary: 34000, avatarColor: "#A78BFA" },
  { id: "emp-003", name: "Nour Ibrahim", role: "Sales Lead", department: "Sales", email: "nour.ibrahim@talentflow.io", phone: "+20 101 333 4455", joinDate: "2020-06-21", status: "Active", salary: 28000, avatarColor: "#116552" },
  { id: "emp-004", name: "Youssef Karim", role: "Marketing Specialist", department: "Marketing", email: "youssef.karim@talentflow.io", phone: "+20 101 444 5566", joinDate: "2023-01-09", status: "Active", salary: 21000, avatarColor: "#828C99" },
  { id: "emp-005", name: "Mariam Adly", role: "Financial Analyst", department: "Finance", email: "mariam.adly@talentflow.io", phone: "+20 102 555 6677", joinDate: "2022-08-30", status: "Active", salary: 26000, avatarColor: "#414954" },
  { id: "emp-006", name: "Ahmed Samir", role: "HR Generalist", department: "Human Resources", email: "ahmed.samir@talentflow.io", phone: "+20 102 666 7788", joinDate: "2021-04-17", status: "Active", salary: 22000, avatarColor: "#4C1D95" },
  { id: "emp-007", name: "Farida Tarek", role: "Product Designer", department: "Engineering", email: "farida.tarek@talentflow.io", phone: "+20 103 777 8899", joinDate: "2023-05-25", status: "On Leave", salary: 30000, avatarColor: "#C4B5FD" },
  { id: "emp-008", name: "Karim Fathy", role: "Account Executive", department: "Sales", email: "karim.fathy@talentflow.io", phone: "+20 103 888 9900", joinDate: "2022-12-11", status: "Active", salary: 24000, avatarColor: "#4F5966" },
];

// The demo "Employee" login is tied to this record.
export const DEMO_EMPLOYEE_ID = "emp-004";

function lastNDates(n) {
  const dates = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

const STATUS_CYCLE = ["Present", "Present", "Present", "Present", "Late", "Present", "Absent"];

export const seedAttendance = (() => {
  const days = lastNDates(14);
  const records = [];
  seedEmployees.forEach((emp, empIdx) => {
    days.forEach((date, dayIdx) => {
      const dow = new Date(date).getDay();
      if (dow === 5 || dow === 6) return; // skip Fri/Sat weekend
      const status = STATUS_CYCLE[(empIdx + dayIdx) % STATUS_CYCLE.length];
      records.push({
        id: `att-${emp.id}-${date}`,
        employeeId: emp.id,
        date,
        status,
        checkIn: status === "Absent" ? null : status === "Late" ? "10:15" : "09:02",
        checkOut: status === "Absent" ? null : "18:05",
      });
    });
  });
  return records;
})();

export const seedLeaves = [
  { id: "lv-001", employeeId: "emp-007", type: "Sick Leave", startDate: "2026-07-28", endDate: "2026-08-03", reason: "Recovering from flu", status: "Approved", appliedOn: "2026-07-25" },
  { id: "lv-002", employeeId: "emp-004", type: "Annual Leave", startDate: "2026-08-10", endDate: "2026-08-12", reason: "Family trip", status: "Pending", appliedOn: "2026-08-01" },
  { id: "lv-003", employeeId: "emp-002", type: "Casual Leave", startDate: "2026-08-05", endDate: "2026-08-05", reason: "Personal errand", status: "Pending", appliedOn: "2026-07-30" },
  { id: "lv-004", employeeId: "emp-003", type: "Annual Leave", startDate: "2026-06-15", endDate: "2026-06-20", reason: "Vacation", status: "Approved", appliedOn: "2026-06-01" },
  { id: "lv-005", employeeId: "emp-008", type: "Sick Leave", startDate: "2026-07-10", endDate: "2026-07-11", reason: "Doctor's appointment", status: "Rejected", appliedOn: "2026-07-08" },
];

const currentMonthLabel = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

export const seedPayroll = seedEmployees.map((emp) => {
  const bonus = Math.round(emp.salary * 0.05);
  const deductions = Math.round(emp.salary * 0.11); // taxes/insurance
  return {
    id: `pay-${emp.id}`,
    employeeId: emp.id,
    month: currentMonthLabel,
    baseSalary: emp.salary,
    bonus,
    deductions,
    netPay: emp.salary + bonus - deductions,
    status: "Paid",
  };
});

export const payrollTrend = [
  { month: "Mar", cost: 191000 },
  { month: "Apr", cost: 196000 },
  { month: "May", cost: 198500 },
  { month: "Jun", cost: 201000 },
  { month: "Jul", cost: 205400 },
  { month: "Aug", cost: 207000 },
];

function inDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export const seedTasks = [
  { id: "tsk-001", title: "Prepare Q3 performance reviews", description: "Draft review forms for the engineering team ahead of the cycle.", employeeId: "emp-001", assignedBy: "Nora Ahmed", priority: "High", status: "In Progress", dueDate: inDays(3), createdOn: inDays(-4) },
  { id: "tsk-002", title: "Fix onboarding checklist bug", description: "New hires aren't receiving the welcome email on day one.", employeeId: "emp-002", assignedBy: "Ahmed Samir", priority: "High", status: "To Do", dueDate: inDays(2), createdOn: inDays(-1) },
  { id: "tsk-003", title: "Update sales pipeline dashboard", description: "Add the new enterprise deal stage to the CRM view.", employeeId: "emp-003", assignedBy: "Nora Ahmed", priority: "Medium", status: "To Do", dueDate: inDays(5), createdOn: inDays(-2) },
  { id: "tsk-004", title: "Design social campaign assets", description: "Instagram and LinkedIn creatives for the August product launch.", employeeId: "emp-004", assignedBy: "Ahmed Samir", priority: "Medium", status: "In Progress", dueDate: inDays(4), createdOn: inDays(-3) },
  { id: "tsk-005", title: "Reconcile July expense reports", description: "Cross-check submitted receipts against the finance ledger.", employeeId: "emp-005", assignedBy: "Nora Ahmed", priority: "Low", status: "Done", dueDate: inDays(-2), createdOn: inDays(-9) },
  { id: "tsk-006", title: "Schedule benefits enrollment session", description: "Book a room and send calendar invites to all departments.", employeeId: "emp-006", assignedBy: "Nora Ahmed", priority: "Medium", status: "Done", dueDate: inDays(-1), createdOn: inDays(-6) },
  { id: "tsk-007", title: "Redesign employee profile page", description: "Apply the new component library to the profile screen.", employeeId: "emp-007", assignedBy: "Ahmed Samir", priority: "Low", status: "To Do", dueDate: inDays(7), createdOn: inDays(-1) },
  { id: "tsk-008", title: "Follow up with enterprise leads", description: "Send proposal follow-ups to the three leads from last week's demo.", employeeId: "emp-008", assignedBy: "Nora Ahmed", priority: "High", status: "In Progress", dueDate: inDays(1), createdOn: inDays(-5) },
  { id: "tsk-009", title: "Plan Q4 hiring budget", description: "Draft headcount requests per department for next quarter.", employeeId: "emp-006", assignedBy: "Nora Ahmed", priority: "Low", status: "To Do", dueDate: inDays(10), createdOn: inDays(0) },
];
