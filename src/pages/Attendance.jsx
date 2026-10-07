import { useMemo, useState } from "react";
import { useAuth, ROLES } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import Badge from "../components/ui/Badge";

function localDate() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function timeToMinutes(time) {
  if (!time) return null;

  const [hours, minutes] = time.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function minutesBetween(start, end) {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  if (startMinutes === null || endMinutes === null) {
    return 0;
  }

  let difference = endMinutes - startMinutes;

  // Handles crossing midnight.
  if (difference < 0) {
    difference += 24 * 60;
  }

  return difference;
}

function formatDuration(totalMinutes) {
  if (!totalMinutes || totalMinutes <= 0) {
    return "0m";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

function formatTime(time) {
  if (!time) return "—";

  const [hour, minute] = time.split(":");
  const date = new Date();

  date.setHours(Number(hour), Number(minute), 0, 0);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getBreakMinutes(breaks, employeeId, date) {
  return breaks
    .filter(
      (item) =>
        item.employeeId === employeeId &&
        item.date === date
    )
    .reduce((total, item) => {
      if (!item.start) return total;

      const end = item.end || currentTime();

      return total + minutesBetween(item.start, end);
    }, 0);
}

function currentTime() {
  const now = new Date();

  return now.toTimeString().slice(0, 5);
}

function getWorkingMinutes(record, breaks) {
  if (!record?.checkIn) {
    return 0;
  }

  const endTime = record.checkOut || currentTime();

  const totalMinutes = minutesBetween(
    record.checkIn,
    endTime
  );

  const breakMinutes = getBreakMinutes(
    breaks,
    record.employeeId,
    record.date
  );

  return Math.max(totalMinutes - breakMinutes, 0);
}

function getActiveBreak(breaks, employeeId, date) {
  return breaks.find(
    (item) =>
      item.employeeId === employeeId &&
      item.date === date &&
      item.start &&
      !item.end
  );
}

function getEmployeeStatus(record, activeBreak) {
  if (!record?.checkIn) {
    return "Not Started";
  }

  if (activeBreak) {
    return "On Break";
  }

  if (record.checkOut) {
    return "Completed";
  }

  return "Working";
}

function StatusPill({ status }) {
  const styles = {
    Working:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    "On Break":
      "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    Completed:
      "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    "Not Started":
      "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[status] || styles["Not Started"]
      }`}
    >
      {status}
    </span>
  );
}

export default function Attendance() {
  const { user } = useAuth();

  const {
    employees = [],
    attendance = [],
    breaks = [],
    checkIn,
    checkOut,
  } = useData();

  const [employeeFilter, setEmployeeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const isSelf = user.role === ROLES.EMPLOYEE;
  const today = localDate();

  const myRecord = isSelf
    ? attendance.find(
        (record) =>
          record.employeeId === user.employeeId &&
          record.date === today
      )
    : null;

  const myActiveBreak = isSelf
    ? getActiveBreak(
        breaks,
        user.employeeId,
        today
      )
    : null;

  const myBreakMinutes = isSelf
    ? getBreakMinutes(
        breaks,
        user.employeeId,
        today
      )
    : 0;

  const myWorkingMinutes = isSelf
    ? getWorkingMinutes(myRecord, breaks)
    : 0;

  const myStatus = isSelf
    ? getEmployeeStatus(
        myRecord,
        myActiveBreak
      )
    : null;

  const rows = useMemo(() => {
    let list = isSelf
      ? attendance.filter(
          (record) =>
            record.employeeId === user.employeeId
        )
      : attendance;

    if (!isSelf) {
      if (employeeFilter !== "All") {
        list = list.filter(
          (record) =>
            record.employeeId === employeeFilter
        );
      }

      if (statusFilter !== "All") {
        list = list.filter(
          (record) =>
            getEmployeeStatus(
              record,
              getActiveBreak(
                breaks,
                record.employeeId,
                record.date
              )
            ) === statusFilter
        );
      }
    }

    return [...list]
      .sort((a, b) => {
        if (a.date !== b.date) {
          return a.date < b.date ? 1 : -1;
        }

        if (!a.checkIn) return 1;
        if (!b.checkIn) return -1;

        return a.checkIn.localeCompare(b.checkIn);
      })
      .slice(0, 100);
  }, [
    attendance,
    breaks,
    isSelf,
    user.employeeId,
    employeeFilter,
    statusFilter,
  ]);

  function handleCheckOut() {
    if (myActiveBreak) {
      return;
    }

    checkOut(user.employeeId);
  }

  return (
    <div className="space-y-5">
      {isSelf && (
        <>
          {/* Today's Attendance */}
          <section className="card p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-ink-500 dark:text-ink-400">
                  Today, {today}
                </p>

                <h2 className="mt-1 font-display text-xl font-semibold text-ink-900 dark:text-white">
                  {myStatus}
                </h2>

                <p className="mt-1 text-sm text-ink-400">
                  {myRecord?.checkIn
                    ? `Started at ${formatTime(
                        myRecord.checkIn
                      )}`
                    : "You haven't checked in yet"}
                </p>

                {myRecord?.checkOut && (
                  <p className="mt-1 text-xs text-ink-400">
                    Checked out at{" "}
                    {formatTime(myRecord.checkOut)}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                {!myRecord?.checkIn && (
                  <button
                    className="btn-primary"
                    onClick={() =>
                      checkIn(user.employeeId)
                    }
                  >
                    ✓ Clock In
                  </button>
                )}

                {myRecord?.checkIn &&
                  !myRecord?.checkOut && (
                    <button
                      className="btn-outline"
                      disabled={!!myActiveBreak}
                      onClick={handleCheckOut}
                    >
                      {myActiveBreak
                        ? "End break first"
                        : "Clock Out"}
                    </button>
                  )}

                {myRecord?.checkOut && (
                  <span className="rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    Workday completed ✓
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Today's Work Summary */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="card p-5">
              <p className="text-sm text-ink-500 dark:text-ink-400">
                Login
              </p>

              <p className="mt-2 text-xl font-semibold text-ink-900 dark:text-white">
                {formatTime(myRecord?.checkIn)}
              </p>
            </div>

            <div className="card p-5">
              <p className="text-sm text-ink-500 dark:text-ink-400">
                Break Time
              </p>

              <p className="mt-2 text-xl font-semibold text-amber-600">
                {formatDuration(myBreakMinutes)}
              </p>
            </div>

            <div className="card p-5">
              <p className="text-sm text-ink-500 dark:text-ink-400">
                Working Time
              </p>

              <p className="mt-2 text-xl font-semibold text-emerald-600">
                {formatDuration(myWorkingMinutes)}
              </p>
            </div>
          </section>

          {/* Current Break */}
          {myActiveBreak && (
            <section className="card border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900 dark:bg-amber-950/30">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
                    Currently on break
                  </p>

                  <p className="mt-1 font-semibold text-ink-900 dark:text-white">
                    {myActiveBreak.reason || "Break"}
                  </p>

                  {myActiveBreak.location && (
                    <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                      Location: {myActiveBreak.location}
                    </p>
                  )}
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xs text-ink-400">
                    Started
                  </p>

                  <p className="font-semibold text-amber-700 dark:text-amber-300">
                    {formatTime(myActiveBreak.start)}
                  </p>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* Admin / HR Filters */}
      {!isSelf && (
        <div className="flex flex-wrap gap-3">
          <select
            className="input max-w-[240px]"
            value={employeeFilter}
            onChange={(e) =>
              setEmployeeFilter(e.target.value)
            }
          >
            <option value="All">
              All employees
            </option>

            {employees.map((employee) => (
              <option
                key={employee.id}
                value={employee.id}
              >
                {employee.name}
              </option>
            ))}
          </select>

          <select
            className="input max-w-[200px]"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
          >
            <option value="All">
              All statuses
            </option>
            <option value="Working">
              Working
            </option>
            <option value="On Break">
              On Break
            </option>
            <option value="Completed">
              Completed
            </option>
            <option value="Not Started">
              Not Started
            </option>
          </select>
        </div>
      )}

      {/* Attendance History */}
      <div className="card overflow-x-auto">
        <div className="border-b border-ink-100 p-5 dark:border-ink-800">
          <h3 className="font-display font-semibold text-ink-900 dark:text-white">
            {isSelf
              ? "My Attendance History"
              : "Employee Attendance"}
          </h3>

          <p className="mt-1 text-xs text-ink-400">
            Login, logout, breaks and actual working time
          </p>
        </div>

        <table className="w-full min-w-[1000px] text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs text-ink-400 dark:border-ink-800">
              {!isSelf && (
                <th className="p-4 font-medium">
                  Employee
                </th>
              )}

              <th className="p-4 font-medium">
                Date
              </th>

              <th className="p-4 font-medium">
                Login
              </th>

              <th className="p-4 font-medium">
                Logout
              </th>

              <th className="p-4 font-medium">
                Break
              </th>

              <th className="p-4 font-medium">
                Working
              </th>

              <th className="p-4 font-medium">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((record) => {
              const employee = employees.find(
                (item) =>
                  item.id === record.employeeId
              );

              const activeBreak =
                getActiveBreak(
                  breaks,
                  record.employeeId,
                  record.date
                );

              const breakMinutes =
                getBreakMinutes(
                  breaks,
                  record.employeeId,
                  record.date
                );

              const workingMinutes =
                getWorkingMinutes(
                  record,
                  breaks
                );

              const status =
                getEmployeeStatus(
                  record,
                  activeBreak
                );

              return (
                <tr
                  key={record.id}
                  className="border-b border-ink-50 last:border-0 dark:border-ink-800/60"
                >
                  {!isSelf && (
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                          {employee?.name?.[0] ||
                            "?"}
                        </span>

                        <div>
                          <p className="font-medium text-ink-800 dark:text-ink-100">
                            {employee?.name ||
                              "Unknown"}
                          </p>

                          <p className="text-xs text-ink-400">
                            {employee?.role || ""}
                          </p>
                        </div>
                      </div>
                    </td>
                  )}

                  <td className="p-4 text-ink-600 dark:text-ink-300">
                    {record.date}
                  </td>

                  <td className="p-4 text-ink-600 dark:text-ink-300">
                    {formatTime(record.checkIn)}
                  </td>

                  <td className="p-4 text-ink-600 dark:text-ink-300">
                    {formatTime(record.checkOut)}
                  </td>

                  <td className="p-4">
                    <span className="font-medium text-amber-600 dark:text-amber-400">
                      {formatDuration(
                        breakMinutes
                      )}
                    </span>

                    {activeBreak && (
                      <span className="ml-2 text-xs text-amber-500">
                        Active
                      </span>
                    )}
                  </td>

                  <td className="p-4">
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {formatDuration(
                        workingMinutes
                      )}
                    </span>
                  </td>

                  <td className="p-4">
                    {status === "Not Started" ? (
                      <StatusPill
                        status={status}
                      />
                    ) : (
                      <StatusPill
                        status={status}
                      />
                    )}
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={isSelf ? 6 : 7}
                  className="p-10 text-center text-sm text-ink-400"
                >
                  No attendance records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}