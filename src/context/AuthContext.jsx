import { createContext, useContext, useState, useEffect } from "react";
import { seedEmployees, DEMO_EMPLOYEE_ID } from "../data/mockData";

export const ROLES = {
  ADMIN: "admin",
  HR: "hr",
  EMPLOYEE: "employee",
};

// Demo credentials only — replace this with a real auth API before
// shipping. Never store real passwords in plain text like this.
export const DEMO_ACCOUNTS = [
  {
    username: "admin",
    password: "admin123",
    profile: { id: "user-admin", name: "Sara Mostafa", role: ROLES.ADMIN, employeeId: null },
  },
  {
    username: "hr",
    password: "hr123",
    profile: { id: "user-hr", name: "Ahmed Samir", role: ROLES.HR, employeeId: "emp-006" },
  },
  {
    username: "employee",
    password: "employee123",
    profile: {
      id: "user-employee",
      name: seedEmployees.find((e) => e.id === DEMO_EMPLOYEE_ID)?.name ?? "Youssef Karim",
      role: ROLES.EMPLOYEE,
      employeeId: DEMO_EMPLOYEE_ID,
    },
  },
];

const STORAGE_KEY = "hr-dashboard:auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  // Returns { ok: true } on success or { ok: false, error } on failure.
  // Wire this up to a real API call (fetch/axios) when you connect a backend —
  // the rest of the app only cares about the shape of `user`, not where it came from.
  function login(username, password) {
    const account = DEMO_ACCOUNTS.find(
      (a) => a.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (!account || account.password !== password) {
      return { ok: false, error: "Incorrect username or password." };
    }
    setUser(account.profile);
    return { ok: true };
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
