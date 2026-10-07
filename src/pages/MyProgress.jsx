import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

export default function MyProgress() {
  const { user } = useAuth();
  const { tasks } = useData();

  const myTasks = tasks.filter(
    (task) => task.employeeId === user.employeeId
  );

  const progress = useMemo(() => {

    if (!myTasks.length) return 0;

    const total = myTasks.reduce(
      (sum, task) =>
        sum +
        (typeof task.progress === "number"
          ? task.progress
          : task.status === "Done"
          ? 100
          : task.status === "In Progress"
          ? 50
          : 0),
      0
    );

    return Math.round(
      total / myTasks.length
    );

  }, [myTasks]);

  const completed = myTasks.filter(
    (task) => task.status === "Done"
  ).length;

  const pending = myTasks.length - completed;

  return (
    <div className="space-y-6">

      <div>
        <h2 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">
          My Progress
        </h2>

        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Review your current task performance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="card p-5">
          <p className="text-sm text-ink-400">
            Overall Progress
          </p>

          <p className="mt-2 text-3xl font-semibold text-ink-900 dark:text-white">
            {progress}%
          </p>
        </div>

        <div className="card p-5">
          <p className="text-sm text-ink-400">
            Completed
          </p>

          <p className="mt-2 text-3xl font-semibold text-emerald-600">
            {completed}
          </p>
        </div>

        <div className="card p-5">
          <p className="text-sm text-ink-400">
            Pending
          </p>

          <p className="mt-2 text-3xl font-semibold text-amber-600">
            {pending}
          </p>
        </div>

      </div>

      <section className="card p-6">

        <div className="mb-5 flex items-center justify-between">

          <div>
            <h3 className="font-display font-semibold text-ink-900 dark:text-white">
              Task Progress
            </h3>

            <p className="mt-1 text-xs text-ink-400">
              Current progress on your assigned work.
            </p>
          </div>

          <span className="text-lg font-semibold text-brand-600">
            {progress}%
          </span>

        </div>

        <div className="h-3 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">

          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

      </section>

      <section className="card overflow-hidden">

        <div className="border-b border-ink-100 p-5 dark:border-ink-800">

          <h3 className="font-display font-semibold text-ink-900 dark:text-white">
            Task Breakdown
          </h3>

        </div>

        <div className="divide-y divide-ink-100 dark:divide-ink-800">

          {myTasks.map((task) => {

            const taskProgress =
              typeof task.progress === "number"
                ? task.progress
                : task.status === "Done"
                ? 100
                : task.status === "In Progress"
                ? 50
                : 0;

            return (
              <div
                key={task.id}
                className="p-5"
              >

                <div className="flex items-center justify-between gap-4">

                  <div>
                    <p className="text-sm font-medium text-ink-800 dark:text-ink-100">
                      {task.title}
                    </p>

                    <p className="mt-1 text-xs text-ink-400">
                      {task.status}
                    </p>
                  </div>

                  <span className="text-sm font-semibold text-brand-600">
                    {taskProgress}%
                  </span>

                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">

                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{
                      width: `${taskProgress}%`,
                    }}
                  />

                </div>

              </div>
            );
          })}

          {!myTasks.length && (
            <p className="p-8 text-center text-sm text-ink-400">
              No tasks assigned yet.
            </p>
          )}

        </div>

      </section>

    </div>
  );
}