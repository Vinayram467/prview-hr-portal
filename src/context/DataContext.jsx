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
};

function loadInitialState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults so older saved data (from before a new field
      // like `tasks` existed) doesn't crash the app with `undefined`.
      return { ...DEFAULT_STATE, ...parsed };
    }
  } catch {
    // fall through to seed data
  }
  return DEFAULT_STATE;
}

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [state, setState] = useState(loadInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // ---- Employees ----
  function addEmployee(employee) {
    const id = `emp-${Date.now()}`;
    setState((s) => ({ ...s, employees: [...s.employees, { ...employee, id }] }));
  }
  function updateEmployee(id, patch) {
    setState((s) => ({
      ...s,
      employees: s.employees.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }
  function deleteEmployee(id) {
    setState((s) => ({ ...s, employees: s.employees.filter((e) => e.id !== id) }));
  }

  // ---- Attendance ----
  function checkIn(employeeId) {
    const today = new Date().toISOString().slice(0, 10);
    const time = new Date().toTimeString().slice(0, 5);
    setState((s) => {
      const existing = s.attendance.find(
        (a) => a.employeeId === employeeId && a.date === today
      );
      if (existing) {
        return {
          ...s,
          attendance: s.attendance.map((a) =>
            a.id === existing.id ? { ...a, checkIn: time, status: "Present" } : a
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
      return { ...s, attendance: [record, ...s.attendance] };
    });
  }
  function checkOut(employeeId) {
    const today = new Date().toISOString().slice(0, 10);
    const time = new Date().toTimeString().slice(0, 5);
    setState((s) => ({
      ...s,
      attendance: s.attendance.map((a) =>
        a.employeeId === employeeId && a.date === today ? { ...a, checkOut: time } : a
      ),
    }));
  }

  // ---- Leaves ----
  function requestLeave(leave) {
    const id = `lv-${Date.now()}`;
    const record = {
      ...leave,
      id,
      status: "Pending",
      appliedOn: new Date().toISOString().slice(0, 10),
    };
    setState((s) => ({ ...s, leaves: [record, ...s.leaves] }));
  }
  function updateLeaveStatus(id, status) {
    setState((s) => ({
      ...s,
      leaves: s.leaves.map((l) => (l.id === id ? { ...l, status } : l)),
    }));
  }

  // ---- Payroll ----
  function updatePayroll(id, patch) {
    setState((s) => ({
      ...s,
      payroll: s.payroll.map((p) => {
        if (p.id !== id) return p;
        const merged = { ...p, ...patch };
        merged.netPay = merged.baseSalary + merged.bonus - merged.deductions;
        return merged;
      }),
    }));
  }

  // ---- Tasks ----
  function addTask(task) {
    const id = `tsk-${Date.now()}`;
    const record = { ...task, id, status: "To Do", createdOn: new Date().toISOString().slice(0, 10) };
    setState((s) => ({ ...s, tasks: [record, ...s.tasks] }));
  }
  function updateTask(id, patch) {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }
  function deleteTask(id) {
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
  }
  function updateTaskStatus(id, status) {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
    }));
  }

  function resetDemoData() {
    setState(DEFAULT_STATE);
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
        requestLeave,
        updateLeaveStatus,
        updatePayroll,
        addTask,
        updateTask,
        deleteTask,
        updateTaskStatus,
        resetDemoData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
