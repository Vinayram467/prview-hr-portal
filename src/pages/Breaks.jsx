import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

const todayStr = () => {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
};

function formatTime(time) {
  if (!time) return "—";

  const [hour, minute] = time.split(":");

  const date = new Date();
  date.setHours(Number(hour), Number(minute));

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Breaks() {
  const { user } = useAuth();
  const { attendance, startBreak, endBreak } = useData();

  const today = todayStr();

  const record = attendance.find(
    (item) =>
      item.employeeId === user.employeeId &&
      item.date === today
  );

  const breaks = record?.breaks || [];

  const onBreak =
    record?.workStatus === "On Break";

  function handleStart() {
    startBreak(user.employeeId);
  }

  function handleEnd() {
    endBreak(user.employeeId);
  }

  return (
    <div className="space-y-6">

      <div>
        <h2 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">
          Breaks
        </h2>

        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Manage and review your break time for today.
        </p>
      </div>

      {/* Current status */}

      <section className="card p-6">

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="text-sm text-ink-400">
              Current status
            </p>

            <h3 className="mt-1 text-xl font-semibold text-ink-900 dark:text-white">
              {onBreak
                ? "You're currently on break"
                : "You're working"}
            </h3>

          </div>

          {onBreak ? (
            <button
              className="btn-primary"
              onClick={handleEnd}
            >
              ↩ Back to Work
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={handleStart}
              disabled={
                !record?.checkIn ||
                !!record?.checkOut
              }
            >
              ☕ Start Break
            </button>
          )}

        </div>

      </section>

      {/* Break history */}

      <section className="card p-6">

        <div className="mb-5">

          <h3 className="font-display font-semibold text-ink-900 dark:text-white">
            Today's Break History
          </h3>

          <p className="mt-1 text-xs text-ink-400">
            {breaks.length} break
            {breaks.length === 1 ? "" : "s"} recorded today
          </p>

        </div>

        <div className="space-y-3">

          {breaks.map((item, index) => (

            <div
              key={item.id || index}
              className="flex items-center justify-between rounded-xl border border-ink-100 p-4 dark:border-ink-800"
            >

              <div className="flex items-center gap-3">

                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950">
                  ☕
                </span>

                <div>

                  <p className="text-sm font-medium text-ink-800 dark:text-ink-100">
                    Break {index + 1}
                  </p>

                  <p className="text-xs text-ink-400">
                    {formatTime(item.start)}
                    {" → "}
                    {item.end
                      ? formatTime(item.end)
                      : "In progress"}
                  </p>

                </div>

              </div>

              <span className="text-sm font-semibold text-ink-700 dark:text-ink-200">
                {item.end ? "Completed" : "Active"}
              </span>

            </div>

          ))}

          {breaks.length === 0 && (
            <div className="rounded-xl bg-ink-50 p-8 text-center dark:bg-ink-800/50">

              <p className="text-sm text-ink-400">
                No breaks recorded today.
              </p>

            </div>
          )}

        </div>

      </section>

    </div>
  );
}