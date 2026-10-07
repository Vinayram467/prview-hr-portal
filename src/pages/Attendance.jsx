import { useMemo, useState } from "react";
import { useAuth, ROLES } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import Badge from "../components/ui/Badge";

function localDate(date = new Date()) {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();

  return new Date(d.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10);
}

function parseDateTime(date, time) {
  if (!date || !time) return null;

  const value = String(time);

  // ISO timestamp
  if (value.includes("T")) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  // HH:mm / HH:mm:ss
  const match = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);

  if (match) {
    const result = new Date(`${date}T00:00:00`);

    result.setHours(
      Number(match[1]),
      Number(match[2]),
      Number(match[3] || 0),
      0
    );

    return result;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatTime(value, date) {
  if (!value) return "—";

  const parsed = date
    ? parseDateTime(date, value)
    : new Date(value);

  if (!parsed || Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getMinutesBetween(start, end) {
  if (!start || !end) return 0;

  const startTime =
    start instanceof Date ? start.getTime() : new Date(start).getTime();

  const endTime =
    end instanceof Date ? end.getTime() : new Date(end).getTime();

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    return 0;
  }

  return Math.max(0, Math.round((endTime - startTime) / 60000));
}

function getAttendanceMinutes(record, dayBreaks = []) {
  if (!record?.checkIn) return 0;

  const start = parseDateTime(record.date, record.checkIn);

  if (!start) return 0;

  const end = record.checkOut
    ? parseDateTime(record.date, record.checkOut)
    : new Date();

  if (!end) return 0;

  const totalMinutes = getMinutesBetween(start, end);

  const breakMinutes = dayBreaks.reduce(
    (sum, item) => sum + getBreakMinutes(item),
    0
  );

  return Math.max(0, totalMinutes - breakMinutes);
}

function getBreakMinutes(item) {
  if (!item?.startTime) return 0;

  const start = new Date(item.startTime);

  if (Number.isNaN(start.getTime())) return 0;

  const end = item.endTime
    ? new Date(item.endTime)
    : new Date();

  if (Number.isNaN(end.getTime())) return 0;

  return Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / 60000)
  );
}

function minutesToText(minutes = 0) {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const mins = total % 60;

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;

  return `${hours}h ${mins}m`;
}

function getStatus(record, dayBreaks = []) {
  if (!record?.checkIn) {
    return "Absent";
  }

  const activeBreak = dayBreaks.some(
    (item) => !item.endTime
  );

  if (activeBreak) {
    return "On Break";
  }

  if (!record.checkOut) {
    return "Working";
  }

  return "Completed";
}

function StatusBadge({ status }) {
  const statusMap = {
    Working: {
      label: "Working",
      className:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
    "On Break": {
      label: "On Break",
      className:
        "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    },
    Completed: {
      label: "Completed",
      className:
        "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    },
    Absent: {
      label: "Absent",
      className:
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    },
  };

  const item = statusMap[status] || statusMap.Absent;

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.className}`}
    >
      {item.label}
    </span>
  );
}

function SummaryCard({ label, value, description }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-ink-500 dark:text-ink-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold text-ink-900 dark:text-white">
        {value}
      </p>

      {description && (
        <p className="mt-1 text-xs text-ink-400">
          {description}
        </p>
      )}
    </div>
  );
}

export default function Attendance() {
  const { user } = useAuth();

  const {
    employees,
    attendance,
    breaks,
    checkIn,
    checkOut,
  } = useData();

  const today = localDate();

  const isEmployee = user?.role === ROLES.EMPLOYEE;
  const canManage =
    user?.role === ROLES.ADMIN || user?.role === ROLES.HR;

  const [employeeFilter, setEmployeeFilter] = useState(
    isEmployee ? user.employeeId : "All"
  );

  const [statusFilter, setStatusFilter] = useState("All");

  const myTodayRecord = isEmployee
    ? attendance.find(
        (item) =>
          item.employeeId === user.employeeId &&
          item.date === today
      )
    : null;

  const myTodayBreaks = isEmployee
    ? breaks.filter(
        (item) =>
          item.employeeId === user.employeeId &&
          item.date === today
      )
    : [];

  const activeMyBreak = myTodayBreaks.find(
    (item) => !item.endTime
  );

  const myTodayWorkingMinutes = myTodayRecord
    ? getAttendanceMinutes(
        myTodayRecord,
        myTodayBreaks
      )
    : 0;

  const myTodayBreakMinutes = myTodayBreaks.reduce(
    (sum, item) => sum + getBreakMinutes(item),
    0
  );

  const myTodayStatus = getStatus(
    myTodayRecord,
    myTodayBreaks
  );

  const rows = useMemo(() => {
    let list = [...attendance];

    if (isEmployee) {
      list = list.filter(
        (item) => item.employeeId === user.employeeId
      );
    } else if (employeeFilter !== "All") {
      list = list.filter(
        (item) => item.employeeId === employeeFilter
      );
    }

    list = list.filter((item) => {
      const dayBreaks = breaks.filter(
        (breakItem) =>
          breakItem.employeeId === item.employeeId &&
          breakItem.date === item.date
      );

      const status = getStatus(item, dayBreaks);

      if (statusFilter === "All") {
        return true;
      }

      return status === statusFilter;
    });

    return list
      .sort((a, b) => {
        if (a.date !== b.date) {
          return a.date < b.date ? 1 : -1;
        }

        const aTime = parseDateTime(a.date, a.checkIn);
        const bTime = parseDateTime(b.date, b.checkIn);

        return (
          (bTime?.getTime() || 0) -
          (aTime?.getTime() || 0)
        );
      })
      .slice(0, 100);
  }, [
    attendance,
    breaks,
    employeeFilter,
    isEmployee,
    statusFilter,
    user.employeeId,
  ]);

  const todayAttendance = attendance.filter(
    (item) => item.date === today
  );

  const presentToday = todayAttendance.filter(
    (item) => item.checkIn
  ).length;

  const currentlyWorking = employees.filter((employee) => {
    const record = todayAttendance.find(
      (item) => item.employeeId === employee.id
    );

    if (!record?.checkIn || record.checkOut) {
      return false;
    }

    const activeBreak = breaks.some(
      (item) =>
        item.employeeId === employee.id &&
        item.date === today &&
        !item.endTime
    );

    return !activeBreak;
  }).length;

  const currentlyOnBreak = employees.filter((employee) =>
    breaks.some(
      (item) =>
        item.employeeId === employee.id &&
        item.date === today &&
        !item.endTime
    )
  ).length;

  const completedToday = todayAttendance.filter(
    (item) => item.checkIn && item.checkOut
  ).length;

  function handleCheckIn() {
    if (!user.employeeId) return;

    checkIn(user.employeeId);
  }

  function handleCheckOut() {
    if (!user.employeeId) return;

    if (activeMyBreak) {
      return;
    }

    checkOut(user.employeeId);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
          PRview Attendance
        </p>

        <h1 className="mt-1 font-display text-2xl font-semibold text-ink-900 dark:text-white">
          Attendance
        </h1>

        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Track clock-in, clock-out, breaks and actual working time.
        </p>
      </div>

      {/* Employee attendance control */}
      {isEmployee && (
        <section className="card overflow-hidden p-5">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-ink-500 dark:text-ink-400">
                Today's attendance
              </p>

              <h2 className="mt-1 text-xl font-semibold text-ink-900 dark:text-white">
                {myTodayStatus === "Absent" &&
                  "You haven't checked in yet"}

                {myTodayStatus === "Working" &&
                  `Started at ${formatTime(
                    myTodayRecord?.checkIn,
                    today
                  )}`}

                {myTodayStatus === "On Break" &&
                  "You are currently on break"}

                {myTodayStatus === "Completed" &&
                  "Workday completed"}
              </h2>

              <p className="mt-1 text-xs text-ink-400">
                {formatDate(today)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={myTodayStatus} />

              {!myTodayRecord?.checkIn && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleCheckIn}
                >
                  ✓ Clock In
                </button>
              )}

              {myTodayRecord?.checkIn &&
                !myTodayRecord?.checkOut &&
                !activeMyBreak && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleCheckOut}
                  >
                    Clock Out
                  </button>
                )}

              {activeMyBreak && (
                <span className="rounded-lg bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                  End your break before clocking out
                </span>
              )}

              {myTodayRecord?.checkOut && (
                <span className="rounded-lg bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  Workday completed ✓
                </span>
              )}
            </div>
          </div>

          {/* Today's metrics */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <p className="text-xs text-ink-400">
                Login
              </p>

              <p className="mt-1 font-semibold text-ink-900 dark:text-white">
                {formatTime(
                  myTodayRecord?.checkIn,
                  today
                )}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <p className="text-xs text-ink-400">
                Logout
              </p>

              <p className="mt-1 font-semibold text-ink-900 dark:text-white">
                {formatTime(
                  myTodayRecord?.checkOut,
                  today
                )}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <p className="text-xs text-ink-400">
                Working Time
              </p>

              <p className="mt-1 font-semibold text-ink-900 dark:text-white">
                {minutesToText(myTodayWorkingMinutes)}
              </p>
            </div>
          </div>

          {/* Active break */}
          {activeMyBreak && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                    Current Break
                  </p>

                  <p className="mt-1 font-semibold text-amber-900 dark:text-amber-200">
                    {activeMyBreak.reason || "Break"}
                  </p>

                  {activeMyBreak.location && (
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                      Location: {activeMyBreak.location}
                    </p>
                  )}
                </div>

                <div className="text-sm text-amber-700 dark:text-amber-300">
                  Started at{" "}
                  {formatTime(activeMyBreak.startTime)}
                </div>
              </div>
            </div>
          )}

          {/* Break summary */}
          <div className="mt-4">
            <p className="text-xs text-ink-400">
              Break time today
            </p>

            <p className="mt-1 text-sm font-semibold text-ink-800 dark:text-ink-100">
              {minutesToText(myTodayBreakMinutes)}
            </p>
          </div>
        </section>
      )}

      {/* Admin summary */}
      {canManage && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            label="Employees"
            value={employees.length}
            description="Team members"
          />

          <SummaryCard
            label="Present Today"
            value={presentToday}
            description={`of ${employees.length} employees`}
          />

          <SummaryCard
            label="Working"
            value={currentlyWorking}
            description="Currently active"
          />

          <SummaryCard
            label="On Break"
            value={currentlyOnBreak}
            description="Currently on break"
          />

          <SummaryCard
            label="Completed"
            value={completedToday}
            description="Clocked out today"
          />
        </div>
      )}

      {/* Admin filters */}
      {canManage && (
        <div className="flex flex-wrap gap-3">
          <select
            className="input max-w-[240px]"
            value={employeeFilter}
            onChange={(event) =>
              setEmployeeFilter(event.target.value)
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
            className="input max-w-[180px]"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
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

            <option value="Absent">
              Absent
            </option>
          </select>
        </div>
      )}

      {/* Attendance history */}
      <section className="card overflow-hidden">
        <div className="border-b border-ink-100 p-5 dark:border-ink-800">
          <h2 className="font-display font-semibold text-ink-900 dark:text-white">
            {isEmployee
              ? "My Attendance History"
              : "Employee Attendance"}
          </h2>

          <p className="mt-1 text-xs text-ink-400">
            Working time is calculated after deducting recorded breaks.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-400 dark:border-ink-800">
                {!isEmployee && (
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

                const dayBreaks = breaks.filter(
                  (item) =>
                    item.employeeId ===
                      record.employeeId &&
                    item.date === record.date
                );

                const breakMinutes =
                  dayBreaks.reduce(
                    (sum, item) =>
                      sum + getBreakMinutes(item),
                    0
                  );

                const workingMinutes =
                  getAttendanceMinutes(
                    record,
                    dayBreaks
                  );

                const status = getStatus(
                  record,
                  dayBreaks
                );

                return (
                  <tr
                    key={record.id}
                    className="border-b border-ink-50 last:border-0 dark:border-ink-800/60"
                  >
                    {!isEmployee && (
                      <td className="p-4 font-medium text-ink-800 dark:text-ink-100">
                        {employee?.name || "—"}
                      </td>
                    )}

                    <td className="p-4 text-ink-600 dark:text-ink-300">
                      {formatDate(record.date)}
                    </td>

                    <td className="p-4 text-ink-600 dark:text-ink-300">
                      {formatTime(
                        record.checkIn,
                        record.date
                      )}
                    </td>

                    <td className="p-4 text-ink-600 dark:text-ink-300">
                      {formatTime(
                        record.checkOut,
                        record.date
                      )}
                    </td>

                    <td className="p-4 text-ink-600 dark:text-ink-300">
                      {minutesToText(breakMinutes)}
                    </td>

                    <td className="p-4 font-semibold text-ink-800 dark:text-ink-100">
                      {minutesToText(
                        workingMinutes
                      )}
                    </td>

                    <td className="p-4">
                      <StatusBadge status={status} />
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={isEmployee ? 6 : 7}
                    className="p-10 text-center text-sm text-ink-400"
                  >
                    No attendance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Today's break details for admin */}
      {canManage && (
        <section className="card overflow-hidden">
          <div className="border-b border-ink-100 p-5 dark:border-ink-800">
            <h2 className="font-display font-semibold text-ink-900 dark:text-white">
              Today's Break Activity
            </h2>

            <p className="mt-1 text-xs text-ink-400">
              Current and completed breaks for today.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs text-ink-400 dark:border-ink-800">
                  <th className="p-4 font-medium">
                    Employee
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
                {breaks
                  .filter(
                    (item) => item.date === today
                  )
                  .sort(
                    (a, b) =>
                      new Date(
                        b.startTime || 0
                      ).getTime() -
                      new Date(
                        a.startTime || 0
                      ).getTime()
                  )
                  .map((item) => {
                    const employee =
                      employees.find(
                        (employeeItem) =>
                          employeeItem.id ===
                          item.employeeId
                      );

                    const active = !item.endTime;

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-ink-50 last:border-0 dark:border-ink-800/60"
                      >
                        <td className="p-4 font-medium text-ink-800 dark:text-ink-100">
                          {employee?.name || "—"}
                        </td>

                        <td className="p-4 text-ink-600 dark:text-ink-300">
                          {item.reason || "—"}
                        </td>

                        <td className="p-4 text-ink-600 dark:text-ink-300">
                          {item.location || "—"}
                        </td>

                        <td className="p-4 text-ink-600 dark:text-ink-300">
                          {formatTime(
                            item.startTime
                          )}
                        </td>

                        <td className="p-4 text-ink-600 dark:text-ink-300">
                          {formatTime(
                            item.endTime
                          )}
                        </td>

                        <td className="p-4 font-semibold text-ink-800 dark:text-ink-100">
                          {minutesToText(
                            getBreakMinutes(item)
                          )}
                        </td>

                        <td className="p-4">
                          {active ? (
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                              Active
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                              Completed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                {breaks.filter(
                  (item) => item.date === today
                ).length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-10 text-center text-sm text-ink-400"
                    >
                      No break activity recorded today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}