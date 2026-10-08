import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import {
  seedEmployees,
  DEMO_EMPLOYEE_ID,
} from "../data/mockData";

export const ROLES = {
  ADMIN: "admin",
  EMPLOYEE: "employee",
};

// Demo credentials only.
// These will be replaced by real authentication when the backend is connected.
export const DEMO_ACCOUNTS = [
  {
    username: "admin",
    password: "admin123",
    profile: {
      id: "user-admin",
      name: "Nora Ahmed",
      role: ROLES.ADMIN,
      employeeId: null,
    },
  },
  {
    username: "employee",
    password: "employee123",
    profile: {
      id: "user-employee",
      name:
        seedEmployees.find(
          (employee) =>
            employee.id === DEMO_EMPLOYEE_ID
        )?.name ?? "Youssef Karim",
      role: ROLES.EMPLOYEE,
      employeeId: DEMO_EMPLOYEE_ID,
    },
  },
];

const STORAGE_KEY = "hr-dashboard:auth";

const VALID_ROLES = [
  ROLES.ADMIN,
  ROLES.EMPLOYEE,
];

const AuthContext = createContext(null);

function loadStoredUser() {
  try {
    const stored = localStorage.getItem(
      STORAGE_KEY
    );

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored);

    // Automatically invalidate old HR sessions
    // or any unknown role.
    if (
      !parsed ||
      !VALID_ROLES.includes(parsed.role)
    ) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(
    loadStoredUser
  );

  useEffect(() => {
    if (user) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(user)
      );
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  function login(username, password) {
    const account = DEMO_ACCOUNTS.find(
      (item) =>
        item.username.toLowerCase() ===
        username.trim().toLowerCase()
    );

    if (
      !account ||
      account.password !== password
    ) {
      return {
        ok: false,
        error:
          "Incorrect username or password.",
      };
    }

    setUser(account.profile);

    return {
      ok: true,
    };
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return context;
}