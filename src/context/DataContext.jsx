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

/* =========================================================
   DATE / TIME HELPERS
========================================================= */

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

/* =========================================================
   DEFAULT DATA
========================================================= */

const DEFAULT_STATE = {
  employees: seedEmployees,
  attendance: seedAttendance,
  leaves: seedLeaves,
  payroll: seedPayroll,
  tasks: seedTasks,
  breaks: [],
  reports: [],
};

/* =========================================================
   LOAD DATA
========================================================= */

function loadInitialState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      const parsed = JSON.parse(stored);

      return {
        ...DEFAULT_STATE,
        ...parsed,

        // Make sure new arrays exist even if an older
        // localStorage version did not have them.
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
      };
    }
  } catch {
    // Fall back to demo data if localStorage is corrupted.
  }

  return DEFAULT_STATE;
}

const DataContext = createContext(null);

/* =========================================================
   PROVIDER
========================================================= */

export function DataProvider({ children }) {
  const [state, setState] = useState(loadInitialState);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state)
    );
  }, [state]);

  /* =======================================================
     EMPLOYEES
  ======================================================= */

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
    }));
  }

  /* =======================================================
     ATTENDANCE
  ======================================================= */

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

      // Already checked in and not checked out.
      if (
        existing?.checkIn &&
        !existing?.checkOut
      ) {
        return s;
      }

      // If a previous record exists for today,
      // do not create a duplicate record.
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

      /*
       * IMPORTANT:
       * Never allow checkout while an active break exists.
       * The employee must end the break first.
       */
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

  /* =======================================================
     BREAKS
  ======================================================= */

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

      /*
       * Employee must be clocked in.
       */
      if (
        !attendanceRecord?.checkIn ||
        attendanceRecord?.checkOut
      ) {
        return s;
      }

      /*
       * Do not allow another break while
       * an existing break is active.
       */
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

  /* =======================================================
     LEAVES
  ======================================================= */

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

  /* =======================================================
     PAYROLL
  ======================================================= */

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

  /* =======================================================
     TASKS
  ======================================================= */

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

  /* =======================================================
     DAILY REPORTS
  ======================================================= */

  function addDailyReport(report) {
    const today = localDate();

    const existing = state.reports?.find(
      (item) =>
        item.employeeId === report.employeeId &&
        item.date === report.date
    );

    /*
     * One report per employee per date.
     */
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

  /* =======================================================
     RESET DEMO DATA
  ======================================================= */

  function resetDemoData() {
    setState({
      employees: [...seedEmployees],
      attendance: [...seedAttendance],
      leaves: [...seedLeaves],
      payroll: [...seedPayroll],
      tasks: [...seedTasks],
      breaks: [],
      reports: [],
    });
  }

  /* =======================================================
     PROVIDER
  ======================================================= */

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

        // Utilities
        resetDemoData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

/* =========================================================
   HOOK
========================================================= */

export function useData() {
  const ctx = useContext(DataContext);

  if (!ctx) {
    throw new Error(
      "useData must be used within DataProvider"
    );
  }

  return ctx;
}