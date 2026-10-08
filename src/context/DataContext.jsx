import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  seedEmployees,
  seedAttendance,
  seedLeaves,
  seedPayroll,
  seedTasks,
} from "../data/mockData";

const STORAGE_KEY = "hr-dashboard:data";

export function localDate(date = new Date()) {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();

  return new Date(d.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10);
}

export function localTime(date = new Date()) {
  const d = new Date(date);

  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function localDateTime(date = new Date()) {
  return new Date(date).toISOString();
}

const DEFAULT_STATE = {
  employees: seedEmployees,
  attendance: seedAttendance,
  leaves: seedLeaves,
  payroll: seedPayroll,
  tasks: seedTasks,
  breaks: [],
  reports: [],
  plans: [],
};

function loadInitialState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      const parsed = JSON.parse(stored);

      return {
        ...DEFAULT_STATE,
        ...parsed,

        employees: Array.isArray(parsed.employees)
          ? parsed.employees
          : DEFAULT_STATE.employees,

        attendance: Array.isArray(parsed.attendance)
          ? parsed.attendance
          : DEFAULT_STATE.attendance,

        leaves: Array.isArray(parsed.leaves)
          ? parsed.leaves
          : DEFAULT_STATE.leaves,

        payroll: Array.isArray(parsed.payroll)
          ? parsed.payroll
          : DEFAULT_STATE.payroll,

        tasks: Array.isArray(parsed.tasks)
          ? parsed.tasks
          : DEFAULT_STATE.tasks,

        breaks: Array.isArray(parsed.breaks)
          ? parsed.breaks
          : [],

        reports: Array.isArray(parsed.reports)
          ? parsed.reports
          : [],

        plans: Array.isArray(parsed.plans)
          ? parsed.plans
          : [],
      };
    }
  } catch {
    // Fall back to demo data if localStorage is corrupted.
  }

  return DEFAULT_STATE;
}

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [state, setState] = useState(loadInitialState);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state)
    );
  }, [state]);

  function addEmployee(employee) {
    const id = `emp-${Date.now()}`;
    const record = {
      ...employee,
      id,
    };

    setState((s) => ({
      ...s,
      employees: [
        ...s.employees,
        record,
      ],
    }));

    return record;
  }

  function updateEmployee(id, patch) {
    setState((s) => ({
      ...s,
      employees: s.employees.map(
        (employee) =>
          employee.id === id
            ? {
                ...employee,
                ...patch,
              }
            : employee
      ),
    }));
  }

  function deleteEmployee(id) {
    setState((s) => ({
      ...s,

      employees: s.employees.filter(
        (employee) => employee.id !== id
      ),

      attendance: s.attendance.filter(
        (record) => record.employeeId !== id
      ),

      breaks: s.breaks.filter(
        (record) => record.employeeId !== id
      ),

      tasks: s.tasks.filter(
        (task) => task.employeeId !== id
      ),

      leaves: s.leaves.filter(
        (leave) => leave.employeeId !== id
      ),

      payroll: s.payroll.filter(
        (pay) => pay.employeeId !== id
      ),

      reports: s.reports.filter(
        (report) => report.employeeId !== id
      ),

      plans: s.plans.filter(
        (plan) => plan.employeeId !== id
      ),
    }));
  }

  function checkIn(employeeId) {
    if (!employeeId) return false;

    const today = localDate();
    const time = localTime();

    let success = false;

    setState((s) => {
      const existing = s.attendance.find(
        (record) =>
          record.employeeId === employeeId &&
          record.date === today
      );

      if (
        existing?.checkIn &&
        !existing?.checkOut
      ) {
        return s;
      }

      if (existing) {
        success = true;

        return {
          ...s,

          attendance: s.attendance.map(
            (record) =>
              record.id === existing.id
                ? {
                    ...record,
                    checkIn: time,
                    checkOut: null,
                    status: "Present",
                  }
                : record
          ),
        };
      }

      const record = {
        id: `att-${employeeId}-${today}`,
        employeeId,
        date: today,
        status: "Present",
        checkIn: time,
        checkOut: null,
      };

      success = true;

      return {
        ...s,
        attendance: [
          record,
          ...s.attendance,
        ],
      };
    });

    return success;
  }

  function checkOut(employeeId) {
    if (!employeeId) return false;

    const today = localDate();
    const time = localTime();

    let success = false;

    setState((s) => {
      const attendanceRecord =
        s.attendance.find(
          (record) =>
            record.employeeId === employeeId &&
            record.date === today
        );

      if (!attendanceRecord?.checkIn) {
        return s;
      }

      if (attendanceRecord.checkOut) {
        return s;
      }

      const activeBreak = s.breaks.some(
        (item) =>
          item.employeeId === employeeId &&
          item.date === today &&
          !item.endTime
      );

      if (activeBreak) {
        return s;
      }

      success = true;

      return {
        ...s,

        attendance: s.attendance.map(
          (record) =>
            record.id === attendanceRecord.id
              ? {
                  ...record,
                  checkOut: time,
                  status: "Present",
                }
              : record
        ),
      };
    });

    return success;
  }

  function startBreak(
    employeeId,
    reason = "Other",
    location = ""
  ) {
    if (!employeeId) return false;

    const today = localDate();
    const now = new Date();

    let success = false;

    setState((s) => {
      const attendanceRecord =
        s.attendance.find(
          (record) =>
            record.employeeId === employeeId &&
            record.date === today
        );

      if (
        !attendanceRecord?.checkIn ||
        attendanceRecord?.checkOut
      ) {
        return s;
      }

      const activeBreak = s.breaks.some(
        (item) =>
          item.employeeId === employeeId &&
          item.date === today &&
          !item.endTime
      );

      if (activeBreak) {
        return s;
      }

      const record = {
        id: `brk-${employeeId}-${Date.now()}`,
        employeeId,
        date: today,
        reason: reason || "Other",
        location: location || "",
        startTime: now.toISOString(),
        endTime: null,
      };

      success = true;

      return {
        ...s,
        breaks: [
          record,
          ...s.breaks,
        ],
      };
    });

    return success;
  }

  function endBreak(employeeId) {
    if (!employeeId) return false;

    const today = localDate();
    const now = new Date();

    let success = false;

    setState((s) => {
      const activeBreak = s.breaks.find(
        (item) =>
          item.employeeId === employeeId &&
          item.date === today &&
          !item.endTime
      );

      if (!activeBreak) {
        return s;
      }

      success = true;

      return {
        ...s,

        breaks: s.breaks.map(
          (item) =>
            item.id === activeBreak.id
              ? {
                  ...item,
                  endTime: now.toISOString(),
                }
              : item
        ),
      };
    });

    return success;
  }

  function requestLeave(leave) {
    const id = `lv-${Date.now()}`;

    const record = {
      ...leave,
      id,
      status: "Pending",
      appliedOn: localDate(),
    };

    setState((s) => ({
      ...s,

      leaves: [
        record,
        ...s.leaves,
      ],
    }));

    return record;
  }

  function updateLeaveStatus(id, status) {
    setState((s) => ({
      ...s,

      leaves: s.leaves.map(
        (leave) =>
          leave.id === id
            ? {
                ...leave,
                status,
              }
            : leave
      ),
    }));
  }

  function updatePayroll(id, patch) {
    setState((s) => ({
      ...s,

      payroll: s.payroll.map((pay) => {
        if (pay.id !== id) {
          return pay;
        }

        const merged = {
          ...pay,
          ...patch,
        };

        merged.netPay =
          Number(merged.baseSalary || 0) +
          Number(merged.bonus || 0) -
          Number(merged.deductions || 0);

        return merged;
      }),
    }));
  }

  function addTask(task) {
    const id = `tsk-${Date.now()}`;

    const record = {
      ...task,
      id,
      status: "To Do",
      createdOn: localDate(),
    };

    setState((s) => ({
      ...s,

      tasks: [
        record,
        ...s.tasks,
      ],
    }));

    return record;
  }

  function updateTask(id, patch) {
    setState((s) => ({
      ...s,

      tasks: s.tasks.map(
        (task) =>
          task.id === id
            ? {
                ...task,
                ...patch,
              }
            : task
      ),
    }));
  }

  function deleteTask(id) {
    setState((s) => ({
      ...s,

      tasks: s.tasks.filter(
        (task) => task.id !== id
      ),
    }));
  }

  function updateTaskStatus(id, status) {
    setState((s) => ({
      ...s,

      tasks: s.tasks.map(
        (task) =>
          task.id === id
            ? {
                ...task,
                status,
              }
            : task
      ),
    }));
  }

  function addDailyReport(report) {
    const today = localDate();

    const existing = state.reports?.find(
      (item) =>
        item.employeeId === report.employeeId &&
        item.date === report.date
    );

    if (existing) {
      updateDailyReport(existing.id, {
        ...report,
        updatedAt: new Date().toISOString(),
      });

      return existing;
    }

    const record = {
      ...report,

      id: `report-${Date.now()}`,

      date: report.date || today,

      createdAt: new Date().toISOString(),

      updatedAt: new Date().toISOString(),
    };

    setState((s) => ({
      ...s,

      reports: [
        record,
        ...s.reports,
      ],
    }));

    return record;
  }

  function updateDailyReport(id, patch) {
    setState((s) => ({
      ...s,

      reports: s.reports.map(
        (report) =>
          report.id === id
            ? {
                ...report,
                ...patch,
                updatedAt:
                  new Date().toISOString(),
              }
            : report
      ),
    }));
  }

  function addPlan(plan) {
    const existing = state.plans?.find(
      (item) =>
        item.employeeId === plan.employeeId &&
        item.date === plan.date
    );

    if (existing) {
      updatePlan(existing.id, {
        ...plan,
        updatedAt: new Date().toISOString(),
      });

      return existing;
    }

    const record = {
      ...plan,

      id: `plan-${Date.now()}`,

      date: plan.date || localDate(),

      status: plan.status || "Planned",

      createdAt: new Date().toISOString(),

      updatedAt: new Date().toISOString(),
    };

    setState((s) => ({
      ...s,

      plans: [
        record,
        ...s.plans,
      ],
    }));

    return record;
  }

  function updatePlan(id, patch) {
    setState((s) => ({
      ...s,

      plans: s.plans.map(
        (plan) =>
          plan.id === id
            ? {
                ...plan,
                ...patch,
                updatedAt:
                  new Date().toISOString(),
              }
            : plan
      ),
    }));
  }

  function deletePlan(id) {
    setState((s) => ({
      ...s,

      plans: s.plans.filter(
        (plan) => plan.id !== id
      ),
    }));
  }

  function resetDemoData() {
    setState({
      employees: [...seedEmployees],
      attendance: [...seedAttendance],
      leaves: [...seedLeaves],
      payroll: [...seedPayroll],
      tasks: [...seedTasks],
      breaks: [],
      reports: [],
      plans: [],
    });
  }

  return (
    <DataContext.Provider
      value={{
        ...state,

        addEmployee,
        updateEmployee,
        deleteEmployee,

        checkIn,
        checkOut,

        startBreak,
        endBreak,

        requestLeave,
        updateLeaveStatus,

        updatePayroll,

        addTask,
        updateTask,
        deleteTask,
        updateTaskStatus,

        addDailyReport,
        updateDailyReport,

        addPlan,
        updatePlan,
        deletePlan,

        resetDemoData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);

  if (!ctx) {
    throw new Error(
      "useData must be used within DataProvider"
    );
  }

  return ctx;
}