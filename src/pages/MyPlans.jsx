import { useState } from "react";

export default function MyPlans() {
  const [plans, setPlans] = useState([
    {
      id: 1,
      text: "Complete today's assigned tasks",
      done: false,
    },
    {
      id: 2,
      text: "Prepare tomorrow's content plan",
      done: false,
    },
  ]);

  const [newPlan, setNewPlan] = useState("");

  function addPlan(e) {
    e.preventDefault();

    if (!newPlan.trim()) return;

    setPlans([
      ...plans,
      {
        id: Date.now(),
        text: newPlan.trim(),
        done: false,
      },
    ]);

    setNewPlan("");
  }

  function togglePlan(id) {
    setPlans(
      plans.map((plan) =>
        plan.id === id
          ? {
              ...plan,
              done: !plan.done,
            }
          : plan
      )
    );
  }

  function removePlan(id) {
    setPlans(
      plans.filter((plan) => plan.id !== id)
    );
  }

  return (
    <div className="space-y-6">

      <div>
        <h2 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">
          My Plans
        </h2>

        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Plan what you want to accomplish next.
        </p>
      </div>

      <section className="card p-6">

        <form
          onSubmit={addPlan}
          className="flex flex-col gap-3 sm:flex-row"
        >

          <input
            className="input flex-1"
            placeholder="Add a plan..."
            value={newPlan}
            onChange={(e) =>
              setNewPlan(e.target.value)
            }
          />

          <button
            type="submit"
            className="btn-primary"
          >
            Add Plan
          </button>

        </form>

      </section>

      <section className="card p-6">

        <div className="mb-5">

          <h3 className="font-display font-semibold text-ink-900 dark:text-white">
            Tomorrow / Future Plans
          </h3>

        </div>

        <div className="space-y-3">

          {plans.map((plan) => (

            <div
              key={plan.id}
              className="flex items-center gap-3 rounded-xl border border-ink-100 p-4 dark:border-ink-800"
            >

              <input
                type="checkbox"
                checked={plan.done}
                onChange={() =>
                  togglePlan(plan.id)
                }
                className="h-4 w-4 accent-brand-600"
              />

              <span
                className={`flex-1 text-sm ${
                  plan.done
                    ? "text-ink-400 line-through"
                    : "text-ink-800 dark:text-ink-100"
                }`}
              >
                {plan.text}
              </span>

              <button
                type="button"
                onClick={() =>
                  removePlan(plan.id)
                }
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>

            </div>

          ))}

        </div>

      </section>

    </div>
  );
}