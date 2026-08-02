import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function PayrollTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-ink-100 dark:text-ink-800" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="currentColor" className="text-ink-400" />
        <YAxis
          tick={{ fontSize: 11 }}
          stroke="currentColor"
          className="text-ink-400"
          tickFormatter={(v) => `${Math.round(v / 1000)}k`}
        />
        <Tooltip
          contentStyle={{ borderRadius: 8, fontSize: 12 }}
          formatter={(v) => [`EGP ${v.toLocaleString()}`, "Payroll cost"]}
        />
        <Bar dataKey="cost" fill="#7C3AED" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
