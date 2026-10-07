import { useEffect, useMemo, useState } from "react";
import { useAuth, ROLES } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import Badge from "../components/ui/Badge";

const todayStr = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();

  return new Date(d.getTime() - offset * 60 * 1000)
    .toISOString()
    .slice(0, 10);
};

function timeToMinutes(time) {
  if (!time) return null;

  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function durationMinutes(startTime, endTime) {
  const start = timeToMinutes(startTime);

  if (start === null) return 0;

  if (!endTime) {
    const now = new Date();

    return Math.max(
      0,
      now.getHours() * 60 +
        now.getMinutes() -
        start
    );
  }

  const end = timeToMinutes(endTime);

  if (end === null) return 0;

  return Math.max(0, end - start);
}

function formatDuration(minutes) {
  if (!minutes || minutes < 1) {
    return "0 min";
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }

  return `${mins}m`;
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

const BREAK_REASONS = [
  "Lunch",
  "Tea / Coffee",
  "Personal",
  "Meeting",
  "Prayer",
  "Other",
];

export default function Breaks() {
  const { user } = useAuth();

  const {
    employees = [],
    attendance = [],
    breaks = [],
    startBreak,
    endBreak,
  } = useData();

  const isEmployee = user.role === ROLES.EMPLOYEE;

  const today = todayStr();

  const [reason, setReason] = useState("Lunch");
  const [location, setLocation] = useState("");

  const [employeeFilter, setEmployeeFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState(today);

  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((value) => value + 1);
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  const employeeId = isEmployee
    ? user.employeeId
    : employeeFilter;

  const todayAttendance = attendance.find(
    (record) =>
      record.employeeId === user.employeeId &&
      record.date === today
  );

  const activeBreak = breaks.find(
    (record) =>
      record.employeeId === user.employeeId &&
      record.date === today &&
      !record.endTime
  );

  const myTodayBreaks = breaks.filter(
    (record) =>
      record.employeeId === user.employeeId &&
      record.date === today
  );

  const myTotalBreakMinutes = myTodayBreaks.reduce(
    (total, record) =>
      total +
      durationMinutes(
        record.startTime,
        record.endTime
      ),
    0
  );

  const filteredBreaks = useMemo(() => {
    let list = [...breaks];

    if (employeeFilter !== "All") {
      list = list.filter(
        (record) =>
          record.employeeId === employeeFilter
      );
    }

    if (dateFilter) {
      list = list.filter(
        (record) => record.date === dateFilter
      );
    }

    return list.sort((a, b) => {
      if (a.startTime === b.startTime) return 0;

      return a.startTime < b.startTime ? 1 : -1;
    });
  }, [
    breaks,
    employeeFilter,
    dateFilter,
  ]);

  function handleStartBreak() {
    if (!location.trim()) {
      return;
    }

    startBreak(
      user.employeeId,
      reason,
      location.trim()
    );

    setLocation("");
  }

  function handleEndBreak() {
    endBreak(user.employeeId);
  }

  const currentlyOnBreakCount = breaks.filter(
    (record) =>
      record.date === today &&
      !record.endTime
  ).length;

  return (
    <div className="space-y-6">
      {/* Employee controls */}
      {isEmployee && (
        <>
          <div className="card p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-ink-500 dark:text-ink-400">
                  Today's break management
                </p>

                <h2 className="mt-1 font-display text-xl font-semibold text-ink-900 dark:text-white">
                  {activeBreak
                    ? "You are currently on break"
                    : "You are currently working"}
                </h2>

                <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                  Total break time today:{" "}
                  <span className="font-medium">
                    {formatDuration(myTotalBreakMinutes)}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Badge
                  status={
                    activeBreak
                      ? "On Break"
                      : todayAttendance?.checkIn
                        ? "Working"
                        : "Not Started"
                  }
                />
              </div>
            </div>

            {!todayAttendance?.checkIn && (
              <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                You need to check in before starting a break.
              </div>
            )}

            {todayAttendance?.checkOut && (
              <div className="mt-5 rounded-lg border border-ink-200 bg-ink-50 p-4 text-sm text-ink-600 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300">
                Your attendance has already been completed for today.
              </div>
            )}

            {!activeBreak &&
              todayAttendance?.checkIn &&
              !todayAttendance?.checkOut && (
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ink-600 dark:text-ink-300">
                      Break reason
                    </label>

                    <select
                      className="input w-full"
                      value={reason}
                      onChange={(e) =>
                        setReason(e.target.value)
                      }
                    >
                      {BREAK_REASONS.map(
                        (item) => (
                          <option
                            key={item}
                            value={item}
                          >
                            {item}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ink-600 dark:text-ink-300">
                      Where are you going?
                    </label>

                    <input
                      className="input w-full"
                      value={location}
                      onChange={(e) =>
                        setLocation(e.target.value)
                      }
                      placeholder="e.g. Cafeteria, outside office"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      className="btn-primary w-full"
                      disabled={!location.trim()}
                      onClick={handleStartBreak}
                    >
                      Start Break
                    </button>
                  </div>
                </div>
              )}

            {activeBreak && (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/30">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Started
                    </p>

                    <p className="mt-1 font-semibold text-amber-950 dark:text-amber-100">
                      {formatTime(
                        activeBreak.startTime
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Reason
                    </p>

                    <p className="mt-1 font-semibold text-amber-950 dark:text-amber-100">
                      {activeBreak.reason}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Location
                    </p>

                    <p className="mt-1 font-semibold text-amber-950 dark:text-amber-100">
                      {activeBreak.location ||
                        "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-4">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    Current duration:{" "}
                    <strong>
                      {formatDuration(
                        durationMinutes(
                          activeBreak.startTime,
                          null
                        )
                      )}
                    </strong>
                  </p>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleEndBreak}
                  >
                    Back to Work
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Employee break history */}
          <div className="card overflow-hidden">
            <div className="border-b border-ink-100 p-5 dark:border-ink-800">
              <h3 className="font-display font-semibold text-ink-900 dark:text-white">
                Today's Break History
              </h3>

              <p className="mt-1 text-xs text-ink-400">
                Every break you record today.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left text-xs text-ink-400 dark:border-ink-800">
                    <th className="p-4 font-medium">
                      Reason
                    </th>
                    <th className="p-4 font-medium">
                      Location
                    </th>
                    <th className="p-4 font-medium">
                      Start
                    </th>
                    <th className="p-4 font-medium">
                      End
                    </th>
                    <th className="p-4 font-medium">
                      Duration
                    </th>
                    <th className="p-4 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {myTodayBreaks.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-ink-50 last:border-0 dark:border-ink-800/60"
                    >
                      <td className="p-4 font-medium text-ink-800 dark:text-ink-100">
                        {record.reason}
                      </td>

                      <td className="p-4 text-ink-600 dark:text-ink-300">
                        {record.location || "—"}
                      </td>

                      <td className="p-4 text-ink-600 dark:text-ink-300">
                        {formatTime(
                          record.startTime
                        )}
                      </td>

                      <td className="p-4 text-ink-600 dark:text-ink-300">
                        {formatTime(
                          record.endTime
                        )}
                      </td>

                      <td className="p-4 text-ink-600 dark:text-ink-300">
                        {formatDuration(
                          durationMinutes(
                            record.startTime,
                            record.endTime
                          )
                        )}
                      </td>

                      <td className="p-4">
                        <Badge
                          status={
                            record.endTime
                              ? "Completed"
                              : "On Break"
                          }
                        />
                      </td>
                    </tr>
                  ))}

                  {myTodayBreaks.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-sm text-ink-400"
                      >
                        No breaks recorded today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Admin / HR */}
      {!isEmployee && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="card p-5">
              <p className="text-sm text-ink-500 dark:text-ink-400">
                Employees currently on break
              </p>

              <p className="mt-2 text-2xl font-semibold text-ink-900 dark:text-white">
                {currentlyOnBreakCount}
              </p>
            </div>

            <div className="card p-5">
              <p className="text-sm text-ink-500 dark:text-ink-400">
                Break records today
              </p>

              <p className="mt-2 text-2xl font-semibold text-ink-900 dark:text-white">
                {
                  breaks.filter(
                    (record) =>
                      record.date === today
                  ).length
                }
              </p>
            </div>

            <div className="card p-5">
              <p className="text-sm text-ink-500 dark:text-ink-400">
                Total break time today
              </p>

              <p className="mt-2 text-2xl font-semibold text-ink-900 dark:text-white">
                {formatDuration(
                  breaks
                    .filter(
                      (record) =>
                        record.date === today
                    )
                    .reduce(
                      (total, record) =>
                        total +
                        durationMinutes(
                          record.startTime,
                          record.endTime
                        ),
                      0
                    )
                )}
              </p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-ink-100 p-5 dark:border-ink-800 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-display font-semibold text-ink-900 dark:text-white">
                  Employee Break Monitoring
                </h3>

                <p className="mt-1 text-xs text-ink-400">
                  Review where employees went and how long they were away.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <select
                  className="input min-w-[200px]"
                  value={employeeFilter}
                  onChange={(e) =>
                    setEmployeeFilter(
                      e.target.value
                    )
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

                <input
                  type="date"
                  className="input"
                  value={dateFilter}
                  onChange={(e) =>
                    setDateFilter(
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left text-xs text-ink-400 dark:border-ink-800">
                    <th className="p-4 font-medium">
                      Employee
                    </th>
                    <th className="p-4 font-medium">
                      Date
                    </th>
                    <th className="p-4 font-medium">
                      Reason
                    </th>
                    <th className="p-4 font-medium">
                      Location
                    </th>
                    <th className="p-4 font-medium">
                      Start
                    </th>
                    <th className="p-4 font-medium">
                      End
                    </th>
                    <th className="p-4 font-medium">
                      Duration
                    </th>
                    <th className="p-4 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBreaks.map((record) => {
                    const employee =
                      employees.find(
                        (item) =>
                          item.id ===
                          record.employeeId
                      );

                    const active =
                      !record.endTime;

                    return (
                      <tr
                        key={record.id}
                        className="border-b border-ink-50 last:border-0 dark:border-ink-800/60"
                      >
                        <td className="p-4 font-medium text-ink-800 dark:text-ink-100">
                          {employee?.name ||
                            "Unknown"}
                        </td>

                        <td className="p-4 text-ink-600 dark:text-ink-300">
                          {record.date}
                        </td>

                        <td className="p-4 text-ink-600 dark:text-ink-300">
                          {record.reason}
                        </td>

                        <td className="p-4 text-ink-600 dark:text-ink-300">
                          {record.location ||
                            "—"}
                        </td>

                        <td className="p-4 text-ink-600 dark:text-ink-300">
                          {formatTime(
                            record.startTime
                          )}
                        </td>

                        <td className="p-4 text-ink-600 dark:text-ink-300">
                          {formatTime(
                            record.endTime
                          )}
                        </td>

                        <td className="p-4 font-medium text-ink-700 dark:text-ink-200">
                          {formatDuration(
                            durationMinutes(
                              record.startTime,
                              record.endTime
                            )
                          )}
                        </td>

                        <td className="p-4">
                          <Badge
                            status={
                              active
                                ? "On Break"
                                : "Completed"
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}

                  {filteredBreaks.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-10 text-center text-sm text-ink-400"
                      >
                        No break records found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}