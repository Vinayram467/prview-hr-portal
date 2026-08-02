export default function StatCard({ label, value, delta, icon }) {
  const isPositive = typeof delta === "number" && delta >= 0;
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400">{label}</p>
          <p className="mt-2 font-display text-2xl font-semibold text-ink-900 dark:text-white">
            {value}
          </p>
        </div>
        {icon && (
          <div className="rounded-md bg-brand-50 dark:bg-brand-950 p-2 text-brand-600 dark:text-brand-400">
            {icon}
          </div>
        )}
      </div>
      {typeof delta === "number" && (
        <p
          className={`mt-3 text-xs font-medium ${
            isPositive ? "text-brand-600 dark:text-brand-400" : "text-red-600"
          }`}
        >
          {isPositive ? "▲" : "▼"} {Math.abs(delta)}% vs last month
        </p>
      )}
    </div>
  );
}
