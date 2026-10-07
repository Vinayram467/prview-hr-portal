import {
  useMemo,
  useState,
} from "react";

import {
  useAuth,
  ROLES,
} from "../context/AuthContext";

import {
  useData,
} from "../context/DataContext";

import Badge from "../components/ui/Badge";


function todayStr() {

  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      now.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function formatTime(time) {

  if (!time) {
    return "—";
  }

  const [
    hours,
    minutes,
  ] = time.split(":");


  const date =
    new Date();

  date.setHours(
    Number(hours),
    Number(minutes)
  );


  return date.toLocaleTimeString(
    [],
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}


function formatDuration(
  minutes
) {

  if (
    minutes === null ||
    minutes === undefined ||
    minutes <= 0
  ) {
    return "0m";
  }


  const hours =
    Math.floor(
      minutes / 60
    );

  const remaining =
    minutes % 60;


  if (hours === 0) {
    return `${remaining}m`;
  }


  return `${hours}h ${remaining}m`;
}


function getBreakMinutes(
  record
) {

  if (
    !record?.breaks?.length
  ) {
    return 0;
  }


  const now =
    new Date();

  const currentMinutes =
    now.getHours() * 60 +
    now.getMinutes();


  return record.breaks.reduce(
    (
      total,
      breakItem
    ) => {

      if (!breakItem.start) {
        return total;
      }


      const [
        startHour,
        startMinute,
      ] =
        breakItem.start
          .split(":")
          .map(Number);


      const start =
        startHour * 60 +
        startMinute;


      let end;


      if (breakItem.end) {

        const [
          endHour,
          endMinute,
        ] =
          breakItem.end
            .split(":")
            .map(Number);


        end =
          endHour * 60 +
          endMinute;

      } else {

        end =
          currentMinutes;
      }


      return (
        total +
        Math.max(
          0,
          end - start
        )
      );
    },
    0
  );
}


function getWorkingMinutes(
  record
) {

  if (!record?.checkIn) {
    return 0;
  }


  const [
    startHour,
    startMinute,
  ] =
    record.checkIn
      .split(":")
      .map(Number);


  const start =
    startHour * 60 +
    startMinute;


  let end;


  if (record.checkOut) {

    const [
      endHour,
      endMinute,
    ] =
      record.checkOut
        .split(":")
        .map(Number);


    end =
      endHour * 60 +
      endMinute;

  } else {

    const now =
      new Date();

    end =
      now.getHours() * 60 +
      now.getMinutes();
  }


  const elapsed =
    Math.max(
      0,
      end - start
    );


  const breakMinutes =
    getBreakMinutes(
      record
    );


  return Math.max(
    0,
    elapsed - breakMinutes
  );
}


export default function Attendance() {

  const {
    user,
  } = useAuth();


  const {
    employees,
    attendance,
    checkIn,
    checkOut,
    startBreak,
    endBreak,
  } = useData();


  const [
    employeeFilter,
    setEmployeeFilter,
  ] = useState("All");


  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");


  const isEmployee =
    user?.role ===
    ROLES.EMPLOYEE;


  const today =
    todayStr();


  const myRecord =
    isEmployee
      ? attendance.find(
          (record) =>
            record.employeeId ===
              user.employeeId &&
            record.date === today
        )
      : null;


  // ====================================================
  // ATTENDANCE LIST
  // ====================================================

  const rows =
    useMemo(() => {

      let list =
        isEmployee
          ? attendance.filter(
              (record) =>
                record.employeeId ===
                user.employeeId
            )
          : attendance;


      if (!isEmployee) {

        if (
          employeeFilter !==
          "All"
        ) {

          list =
            list.filter(
              (record) =>
                record.employeeId ===
                employeeFilter
            );
        }


        if (
          statusFilter !==
          "All"
        ) {

          list =
            list.filter(
              (record) =>
                record.status ===
                statusFilter
            );
        }
      }


      return [
        ...list,
      ]
        .sort(
          (a, b) =>
            a.date < b.date
              ? 1
              : -1
        )
        .slice(0, 60);

    }, [
      attendance,
      isEmployee,
      user.employeeId,
      employeeFilter,
      statusFilter,
    ]);


  const isWorking =
    myRecord?.checkIn &&
    !myRecord?.checkOut &&
    myRecord?.workStatus !==
      "On Break";


  const isOnBreak =
    myRecord?.workStatus ===
    "On Break";


  const isCompleted =
    !!myRecord?.checkOut;


  const breakMinutes =
    getBreakMinutes(
      myRecord
    );


  const workingMinutes =
    getWorkingMinutes(
      myRecord
    );


  return (

    <div className="space-y-6">


      {/* ==================================================
          EMPLOYEE TODAY
         ================================================== */}

      {isEmployee && (

        <>

          {/* Main attendance card */}

          <section className="card p-6">

            <div className="flex flex-col gap-6">

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="text-sm text-ink-400">
                    Today · {today}
                  </p>

                  <h2 className="mt-1 font-display text-2xl font-semibold text-ink-900 dark:text-white">

                    {isOnBreak
                      ? "You're on break"
                      : isWorking
                      ? "You're currently working"
                      : isCompleted
                      ? "Workday completed"
                      : "You haven't checked in yet"}

                  </h2>

                </div>


                <span
                  className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${
                    isOnBreak
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      : isWorking
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : isCompleted
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300"
                  }`}
                >

                  {isOnBreak
                    ? "On Break"
                    : isWorking
                    ? "Working"
                    : isCompleted
                    ? "Completed"
                    : "Not Started"}

                </span>

              </div>


              {/* Metrics */}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                <div className="rounded-xl bg-ink-50 p-4 dark:bg-ink-800/60">

                  <p className="text-xs text-ink-400">
                    Login time
                  </p>

                  <p className="mt-1 text-xl font-semibold text-ink-900 dark:text-white">
                    {formatTime(
                      myRecord?.checkIn
                    )}
                  </p>

                </div>


                <div className="rounded-xl bg-ink-50 p-4 dark:bg-ink-800/60">

                  <p className="text-xs text-ink-400">
                    Logout time
                  </p>

                  <p className="mt-1 text-xl font-semibold text-ink-900 dark:text-white">
                    {formatTime(
                      myRecord?.checkOut
                    )}
                  </p>

                </div>


                <div className="rounded-xl bg-ink-50 p-4 dark:bg-ink-800/60">

                  <p className="text-xs text-ink-400">
                    Working time
                  </p>

                  <p className="mt-1 text-xl font-semibold text-ink-900 dark:text-white">
                    {formatDuration(
                      workingMinutes
                    )}
                  </p>

                </div>

              </div>


              {/* Break information */}

              <div className="rounded-xl border border-ink-100 p-4 dark:border-ink-800">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <p className="text-xs text-ink-400">
                      Total break time
                    </p>

                    <p className="mt-1 text-lg font-semibold text-ink-900 dark:text-white">
                      {formatDuration(
                        breakMinutes
                      )}
                    </p>

                  </div>


                  <div className="flex flex-wrap gap-3">

                    {/* Clock in */}

                    {!myRecord?.checkIn && (

                      <button
                        className="btn-primary"
                        onClick={() =>
                          checkIn(
                            user.employeeId
                          )
                        }
                      >
                        ✓ Clock In
                      </button>

                    )}


                    {/* Start break */}

                    {isWorking && (

                      <button
                        className="btn-primary"
                        onClick={() =>
                          startBreak(
                            user.employeeId
                          )
                        }
                      >
                        ☕ Start Break
                      </button>

                    )}


                    {/* End break */}

                    {isOnBreak && (

                      <button
                        className="btn-primary"
                        onClick={() =>
                          endBreak(
                            user.employeeId
                          )
                        }
                      >
                        ↩ Back to Work
                      </button>

                    )}


                    {/* Clock out */}

                    {isWorking && (

                      <button
                        className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:bg-ink-900 dark:text-red-400 dark:hover:bg-red-950"
                        onClick={() =>
                          checkOut(
                            user.employeeId
                          )
                        }
                      >
                        Clock Out
                      </button>

                    )}


                    {/* Completed */}

                    {isCompleted && (

                      <span className="rounded-lg bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        ✓ Workday completed
                      </span>

                    )}

                  </div>

                </div>

              </div>

            </div>

          </section>


          {/* =================================================
              BREAK HISTORY
             ================================================= */}

          <section className="card p-6">

            <div className="mb-5">

              <h3 className="font-display font-semibold text-ink-900 dark:text-white">
                Today's Breaks
              </h3>

              <p className="mt-1 text-xs text-ink-400">
                Your break history for today.
              </p>

            </div>


            <div className="space-y-3">

              {myRecord?.breaks?.map(
                (
                  breakItem,
                  index
                ) => {

                  const start =
                    breakItem.start;

                  const end =
                    breakItem.end;


                  let duration =
                    0;


                  if (start) {

                    const [
                      sh,
                      sm,
                    ] =
                      start
                        .split(":")
                        .map(Number);


                    const startMinutes =
                      sh * 60 + sm;


                    let endMinutes;


                    if (end) {

                      const [
                        eh,
                        em,
                      ] =
                        end
                          .split(":")
                          .map(Number);


                      endMinutes =
                        eh * 60 + em;

                    } else {

                      const now =
                        new Date();

                      endMinutes =
                        now.getHours() *
                          60 +
                        now.getMinutes();
                    }


                    duration =
                      Math.max(
                        0,
                        endMinutes -
                          startMinutes
                      );
                  }


                  return (

                    <div
                      key={
                        breakItem.id ||
                        index
                      }
                      className="flex flex-col gap-3 rounded-xl border border-ink-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-ink-800"
                    >

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950">
                          ☕
                        </div>

                        <div>

                          <p className="text-sm font-medium text-ink-800 dark:text-ink-100">
                            Break{" "}
                            {index + 1}
                          </p>

                          <p className="text-xs text-ink-400">

                            {formatTime(
                              breakItem.start
                            )}

                            {" → "}

                            {breakItem.end
                              ? formatTime(
                                  breakItem.end
                                )
                              : "In progress"}

                          </p>

                        </div>

                      </div>


                      <span className="text-sm font-semibold text-ink-700 dark:text-ink-200">

                        {formatDuration(
                          duration
                        )}

                      </span>

                    </div>

                  );
                }
              )}


              {!myRecord?.breaks
                ?.length && (

                <div className="rounded-xl bg-ink-50 p-8 text-center dark:bg-ink-800/50">

                  <p className="text-sm text-ink-400">
                    No breaks recorded today.
                  </p>

                </div>

              )}

            </div>

          </section>

        </>

      )}


      {/* ==================================================
          ADMIN / HR FILTERS
         ================================================== */}

      {!isEmployee && (

        <div className="flex flex-wrap gap-3">

          <select
            className="input max-w-[220px]"
            value={
              employeeFilter
            }
            onChange={(e) =>
              setEmployeeFilter(
                e.target.value
              )
            }
          >

            <option value="All">
              All employees
            </option>

            {employees.map(
              (employee) => (

                <option
                  key={employee.id}
                  value={employee.id}
                >
                  {employee.name}
                </option>

              )
            )}

          </select>


          <select
            className="input max-w-[180px]"
            value={
              statusFilter
            }
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
          >

            <option value="All">
              All statuses
            </option>

            <option value="Present">
              Present
            </option>

            <option value="Late">
              Late
            </option>

            <option value="Absent">
              Absent
            </option>

          </select>

        </div>

      )}


      {/* ==================================================
          ATTENDANCE HISTORY
         ================================================== */}

      <section className="card overflow-hidden">

        <div className="border-b border-ink-100 p-5 dark:border-ink-800">

          <h3 className="font-display font-semibold text-ink-900 dark:text-white">

            {isEmployee
              ? "Attendance History"
              : "Employee Attendance"}

          </h3>

          <p className="mt-1 text-xs text-ink-400">

            {isEmployee
              ? "Your recent attendance records."
              : "Attendance and working hours across employees."}

          </p>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full min-w-[900px] text-sm">

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

              {rows.map(
                (record) => {

                  const employee =
                    employees.find(
                      (item) =>
                        item.id ===
                        record.employeeId
                    );


                  const breaks =
                    getBreakMinutes(
                      record
                    );


                  const working =
                    getWorkingMinutes(
                      record
                    );


                  return (

                    <tr
                      key={record.id}
                      className="border-b border-ink-50 last:border-0 dark:border-ink-800/60"
                    >

                      {!isEmployee && (

                        <td className="p-4 text-ink-800 dark:text-ink-100">

                          {employee?.name ||
                            "—"}

                        </td>

                      )}


                      <td className="p-4 text-ink-600 dark:text-ink-300">
                        {record.date}
                      </td>


                      <td className="p-4 font-medium text-ink-700 dark:text-ink-200">
                        {formatTime(
                          record.checkIn
                        )}
                      </td>


                      <td className="p-4 font-medium text-ink-700 dark:text-ink-200">
                        {formatTime(
                          record.checkOut
                        )}
                      </td>


                      <td className="p-4 text-ink-600 dark:text-ink-300">
                        {formatDuration(
                          breaks
                        )}
                      </td>


                      <td className="p-4 text-ink-600 dark:text-ink-300">
                        {formatDuration(
                          working
                        )}
                      </td>


                      <td className="p-4">

                        <Badge
                          status={
                            record.workStatus ===
                            "Completed"
                              ? "Present"
                              : record.workStatus ===
                                "Working"
                              ? "Present"
                              : record.status
                          }
                        />

                      </td>

                    </tr>

                  );

                }
              )}


              {rows.length === 0 && (

                <tr>

                  <td
                    colSpan={
                      isEmployee
                        ? 6
                        : 7
                    }
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

    </div>

  );
}