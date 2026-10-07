import { createContext, useContext, useState, useEffect } from "react";
import {
  seedEmployees,
  seedAttendance,
  seedLeaves,
  seedPayroll,
  seedTasks,
} from "../data/mockData";

const STORAGE_KEY = "hr-dashboard:data";

function localDate() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function localTime() {
  return new Date().toTimeString().slice(0, 5);
}

const DEFAULT_STATE = {
  employees: seedEmployees,
  attendance: seedAttendance,
  leaves: seedLeaves,
  payroll: seedPayroll,
  tasks: seedTasks,
  breaks: [],
  reports: [],
};

function loadInitialState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      const parsed = JSON.parse(stored);

      return {
        ...DEFAULT_STATE,
        ...parsed,
        breaks: Array.isArray(parsed.breaks) ? parsed.breaks : [],
        reports: Array.isArray(parsed.reports) ? parsed.reports : [],
      };
    }
  } catch {
    // Fall back to demo data.
  }

  return DEFAULT_STATE;
}

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [state, setState] = useState(loadInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // =========================================================
  // EMPLOYEES
  // =========================================================

  function addEmployee(employee) {
    const id = `emp-${Date.now()}`;

    setState((s) => ({
      ...s,
      employees: [
        ...s.employees,
        {
          ...employee,
          id,
        },
      ],
    }));
  }

  function updateEmployee(id, patch) {
    setState((s) => ({
      ...s,
      employees: s.employees.map((employee) =>
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
      employees: s.employees.filter((employee) => employee.id !== id),
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
    }));
  }

  // =========================================================
  // ATTENDANCE
  // =========================================================

  function checkIn(employeeId) {
    const today = localDate();
    const time = localTime();

    setState((s) => {
      const existing = s.attendance.find(
        (record) =>
          record.employeeId === employeeId &&
          record.date === today
      );

      if (existing) {
        return {
          ...s,
          attendance: s.attendance.map((record) =>
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

      return {
        ...s,
        attendance: [record, ...s.attendance],
      };
    });
  }

  function checkOut(employeeId) {
    const today = localDate();
    const time = localTime();

    setState((s) => ({
      ...s,
      attendance: s.attendance.map((record) =>
        record.employeeId === employeeId &&
        record.date === today
          ? {
              ...record,
              checkOut: time,
              status: "Present",
            }
          : record
      ),
    }));
  }

  // =========================================================
  // BREAKS
  // =========================================================

  function startBreak(employeeId, reason, location) {
    const today = localDate();
    const time = localTime();

    setState((s) => {
      const attendanceRecord = s.attendance.find(
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

      const activeBreak = s.breaks.find(
        (record) =>
          record.employeeId === employeeId &&
          record.date === today &&
          !record.endTime
      );

      if (activeBreak) {
        return s;
      }

      const breakRecord = {
        id: `break-${employeeId}-${Date.now()}`,
        employeeId,
        date: today,
        startTime: time,
        endTime: null,
        reason: reason || "Other",
        location: location || "",
      };

      return {
        ...s,
        breaks: [breakRecord, ...s.breaks],
      };
    });
  }

  function endBreak(employeeId) {
    const today = localDate();
    const time = localTime();

    setState((s) => ({
      ...s,
      breaks: s.breaks.map((record) =>
        record.employeeId === employeeId &&
        record.date === today &&
        !record.endTime
          ? {
              ...record,
              endTime: time,
            }
          : record
      ),
    }));
  }

  // =========================================================
  // LEAVES
  // =========================================================

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
      leaves: [record, ...s.leaves],
    }));
  }

  function updateLeaveStatus(id, status) {
    setState((s) => ({
      ...s,
      leaves: s.leaves.map((leave) =>
        leave.id === id
          ? {
              ...leave,
              status,
            }
          : leave
      ),
    }));
  }

  // =========================================================
  // PAYROLL
  // =========================================================

  function updatePayroll(id, patch) {
    setState((s) => ({
      ...s,
      payroll: s.payroll.map((pay) => {
        if (pay.id !== id) return pay;

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

  // =========================================================
  // TASKS
  // =========================================================

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
      tasks: [record, ...s.tasks],
    }));
  }

  function updateTask(id, patch) {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((task) =>
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
      tasks: s.tasks.filter((task) => task.id !== id),
    }));
  }

  function updateTaskStatus(id, status) {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              status,
            }
          : task
      ),
    }));
  }

  // =========================================================
  // DAILY REPORTS
  // =========================================================

  function addDailyReport(report) {
    const id = `report-${Date.now()}`;

    const record = {
      ...report,
      id,
      submittedAt: new Date().toISOString(),
    };

    setState((s) => ({
      ...s,
      reports: [record, ...s.reports],
    }));
  }

  function updateDailyReport(id, patch) {
    setState((s) => ({
      ...s,
      reports: s.reports.map((report) =>
        report.id === id
          ? {
              ...report,
              ...patch,
              updatedAt: new Date().toISOString(),
            }
          : report
      ),
    }));
  }

  // =========================================================
  // RESET
  // =========================================================

  function resetDemoData() {
    setState({
      ...DEFAULT_STATE,
      breaks: [],
      reports: [],
    });
  }

  return (
    <DataContext.Provider
      value={{
        ...state,

        // Employees
        addEmployee,
        updateEmployee,
        deleteEmployee,

        // Attendance
        checkIn,
        checkOut,

        // Breaks
        startBreak,
        endBreak,

        // Leaves
        requestLeave,
        updateLeaveStatus,

        // Payroll
        updatePayroll,

        // Tasks
        addTask,
        updateTask,
        deleteTask,
        updateTaskStatus,

        // Reports
        addDailyReport,
        updateDailyReport,

        // Demo
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