import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const ROLE_LABEL = {
  admin: "Administrator",
  hr: "HR",
  employee: "Employee",
};

export default function Topbar({ onMenuClick, title }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-ink-100 dark:border-ink-800 bg-white/90 dark:bg-ink-900/90 backdrop-blur px-4 lg:px-8">
      
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          className="btn-ghost !px-2 lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          ☰
        </button>

        <div>
          <h1 className="font-display text-lg font-semibold text-ink-900 dark:text-white">
            {title}
          </h1>

          <p className="hidden sm:block text-xs text-ink-400">
            {isAdmin ? "PRview Admin Portal" : "PRview Employee Portal"}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Theme */}
        <button
          onClick={toggleTheme}
          className="btn-ghost !px-2"
          aria-label="Toggle dark mode"
          title="Toggle dark mode"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        {/* User */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-ink-50 dark:hover:bg-ink-800"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
              {user?.name?.[0] ?? "U"}
            </span>

            <span className="hidden sm:block text-left">
              <span className="block text-sm font-medium text-ink-800 dark:text-ink-100">
                {user?.name}
              </span>

              <span className="block text-xs text-ink-400">
                {ROLE_LABEL[user?.role] || "User"}
              </span>
            </span>

            <span className="hidden sm:block text-xs text-ink-400">
              ▾
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 card p-1.5">
              <button
                onClick={logout}
                className="w-full rounded-md px-3 py-2 text-left text-sm text-ink-600 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}