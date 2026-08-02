const STYLES = {
  Present: "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300",
  Active: "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300",
  Approved: "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300",
  Paid: "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300",
  Done: "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300",
  Late: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  Pending: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  "On Leave": "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  "In Progress": "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  Medium: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  Absent: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  Rejected: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  High: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  Inactive: "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300",
  "To Do": "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300",
  Low: "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300",
};

export default function Badge({ status }) {
  const style = STYLES[status] ?? "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300";
  return <span className={`badge ${style}`}>{status}</span>;
}
