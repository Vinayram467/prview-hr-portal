import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function AttendanceTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-ink-100 dark:text-ink-800" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="currentColor" className="text-ink-400" />
        <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-ink-400" unit="%" />
        <Tooltip
          contentStyle={{
            background: "var(--tooltip-bg, #fff)",
            border: "1px solid #E5E7EB",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Line
          type="monotone"
          dataKey="rate"
          stroke="#7C3AED"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
