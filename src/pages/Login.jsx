import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, DEMO_ACCOUNTS } from "../context/AuthContext";

export default function Login() {
  const { user, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  if (user) return <Navigate to="/" replace />;

  function handleSubmit(e) {
    e.preventDefault();
    const result = login(username, password);
    if (!result.ok) {
      setError(result.error);
    }
  }

  function fillDemo(account) {
    setUsername(account.username);
    setPassword(account.password);
    setError("");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 dark:bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand-600 text-white font-display text-xl font-semibold">
            T
          </span>
          <h1 className="mt-4 font-display text-2xl font-semibold text-ink-900 dark:text-white">
            TalentFlow HR
          </h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            Sign in to your dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="label">Username</label>
            <input
              className="input"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin"
              required
            />
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                className="input pr-16"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary btn-block">
            Sign in
          </button>
        </form>

        <div className="mt-5 card p-4">
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400 mb-3">
            Demo accounts — click one to autofill
          </p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.username}
                type="button"
                onClick={() => fillDemo(acc)}
                className="rounded-md border border-ink-200 dark:border-ink-700 px-2 py-2 text-xs font-medium text-ink-600 dark:text-ink-300 hover:border-brand-400 hover:text-brand-700 dark:hover:text-brand-400 transition-colors capitalize"
              >
                {acc.username}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-ink-400">
          Demo authentication only — connect a real auth provider before
          production use.
        </p>
      </div>
    </div>
  );
}
