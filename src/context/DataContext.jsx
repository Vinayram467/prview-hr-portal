import { createContext, useContext, useState, useEffect } from "react";
import {
  seedEmployees,
  seedAttendance,
  seedLeaves,
  seedPayroll,
  seedTasks,
} from "../data/mockData";

const STORAGE_KEY = "hr-dashboard:data";

const DEFAULT_STATE = {
  employees: seedEmployees,
  attendance: seedAttendance,
  leaves: seedLeaves,
  payroll: seedPayroll,
  tasks: seedTasks,
  reports: [],
};

function getLocalDate() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentTime() {
  const date = new Date();

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function timeToMinutes(time) {
  if (!time) return 0;

  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function calculateBreakMinutes(record) {
  if (!record?.breaks?.length) return 0;

  return record.breaks.reduce((total, breakItem) => {
    if (!breakItem.start) return total;

    const start = timeToMinutes(breakItem.start);

    const end = breakItem.end
      ? timeToMinutes(breakItem.end)
      : timeToMinutes(getCurrentTime());

    return total + Math.max(0, end - start);
  }, 0);
}

function calculateWorkingMinutes(record) {
  if (!record?.checkIn) return 0;

  const start = timeToMinutes(record.checkIn);

  const end = record.checkOut
    ? timeToMinutes(record.checkOut)
    : timeToMinutes(getCurrentTime());

  const totalMinutes = Math.max(0, end - start);

  return Math.max(0, totalMinutes - calculateBreakMinutes(record));
}

function loadInitialState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      const parsed = JSON.parse(stored);

      return {
        ...DEFAULT_STATE,
        ...parsed,
        reports: parsed.reports ?? [],
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

  // ---------------------------------------------------------
  // Employees
  // ---------------------------------------------------------

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
    }));
  }

  // ---------------------------------------------------------
  // Attendance
  // ---------------------------------------------------------

  function checkIn(employeeId) {
    const today = getLocalDate();
    const time = getCurrentTime();

    setState((s) => {
      const existing = s.attendance.find(
        (attendance) =>
          attendance.employeeId === employeeId &&
          attendance.date === today
      );

      if (existing) {
        return {
          ...s,
          attendance: s.attendance.map((attendance) =>
            attendance.id === existing.id
              ? {
                  ...attendance,
                  checkIn: time,
                  checkOut: null,
                  status: "Present",
                  workStatus: "Working",
                  breaks: attendance.breaks ?? [],
                }
              : attendance
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
        workStatus: "Working",
        breaks: [],
      };

      return {
        ...s,
        attendance: [record, ...s.attendance],
      };
    });
  }

  function checkOut(employeeId) {
    const today = getLocalDate();
    const time = getCurrentTime();

    setState((s) => ({
      ...s,
      attendance: s.attendance.map((attendance) => {
        if (
          attendance.employeeId !== employeeId ||
          attendance.date !== today
        ) {
          return attendance;
        }

        let breaks = attendance.breaks ?? [];

        const openBreak = breaks.find((breakItem) => !breakItem.end);

        if (openBreak) {
          breaks = breaks.map((breakItem) =>
            breakItem.id === openBreak.id
              ? {
                  ...breakItem,
                  end: time,
                }
              : breakItem
          );
        }

        return {
          ...attendance,
          checkOut: time,
          workStatus: "Completed",
          breaks,
        };
      }),
    }));
  }

  function startBreak(employeeId) {
    const today = getLocalDate();
    const time = getCurrentTime();

    setState((s) => ({
      ...s,
      attendance: s.attendance.map((attendance) => {
        if (
          attendance.employeeId !== employeeId ||
          attendance.date !== today ||
          !attendance.checkIn ||
          attendance.checkOut
        ) {
          return attendance;
        }

        const breaks = attendance.breaks ?? [];

        const alreadyOnBreak = breaks.some(
          (breakItem) => !breakItem.end
        );

        if (alreadyOnBreak) {
          return attendance;
        }

        return {
          ...attendance,
          workStatus: "On Break",
          breaks: [
            ...breaks,
            {
              id: `break-${Date.now()}`,
              start: time,
              end: null,
            },
          ],
        };
      }),
    }));
  }

  function endBreak(employeeId) {
    const today = getLocalDate();
    const time = getCurrentTime();

    setState((s) => ({
      ...s,
      attendance: s.attendance.map((attendance) => {
        if (
          attendance.employeeId !== employeeId ||
          attendance.date !== today
        ) {
          return attendance;
        }

        const breaks = attendance.breaks ?? [];

        const openBreak = breaks.find(
          (breakItem) => !breakItem.end
        );

        if (!openBreak) {
          return attendance;
        }

        return {
          ...attendance,
          workStatus: attendance.checkOut
            ? "Completed"
            : "Working",
          breaks: breaks.map((breakItem) =>
            breakItem.id === openBreak.id
              ? {
                  ...breakItem,
                  end: time,
                }
              : breakItem
          ),
        };
      }),
    }));
  }

  // ---------------------------------------------------------
  // Leaves
  // ---------------------------------------------------------

  function requestLeave(leave) {
    const id = `lv-${Date.now()}`;

    const record = {
      ...leave,
      id,
      status: "Pending",
      appliedOn: getLocalDate(),
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

  // ---------------------------------------------------------
  // Payroll
  // ---------------------------------------------------------

  function updatePayroll(id, patch) {
    setState((s) => ({
      ...s,
      payroll: s.payroll.map((payroll) => {
        if (payroll.id !== id) return payroll;

        const merged = {
          ...payroll,
          ...patch,
        };

        merged.netPay =
          merged.baseSalary +
          merged.bonus -
          merged.deductions;

        return merged;
      }),
    }));
  }

  // ---------------------------------------------------------
  // Tasks
  // ---------------------------------------------------------

  function addTask(task) {
    const id = `tsk-${Date.now()}`;

    const record = {
      ...task,
      id,
      status: task.status ?? "To Do",
      progress: task.progress ?? 0,
      createdOn: getLocalDate(),
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
              progress:
                status === "Done"
                  ? 100
                  : status === "In Progress"
                  ? Math.max(task.progress ?? 0, 1)
                  : 0,
            }
          : task
      ),
    }));
  }

  // ---------------------------------------------------------
  // Daily Reports
  // ---------------------------------------------------------

  function addDailyReport(report) {
    const id = `report-${Date.now()}`;

    const record = {
      ...report,
      id,
      createdAt: new Date().toISOString(),
    };

    setState((s) => ({
      ...s,
      reports: [record, ...(s.reports ?? [])],
    }));
  }

  function updateDailyReport(id, patch) {
    setState((s) => ({
      ...s,
      reports: (s.reports ?? []).map((report) =>
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

  // ---------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------

  function resetDemoData() {
    setState({
      ...DEFAULT_STATE,
      reports: [],
    });
  }

  return (
    <DataContext.Provider
      value={{
        ...state,

        reports: state.reports ?? [],

        addEmployee,
        updateEmployee,
        deleteEmployee,

        checkIn,
        checkOut,
        startBreak,
        endBreak,

        calculateBreakMinutes,
        calculateWorkingMinutes,

        requestLeave,
        updateLeaveStatus,

        updatePayroll,

        addTask,
        updateTask,
        deleteTask,
        updateTaskStatus,

        addDailyReport,
        updateDailyReport,

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