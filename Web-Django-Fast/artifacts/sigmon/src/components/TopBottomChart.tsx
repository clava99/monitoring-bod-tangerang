import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList
} from "recharts";

interface Item { unit: string; value: number; region?: string; }
interface Props { title: string; items: Item[]; variant: "top" | "bottom"; }

function shortUnit(name: string) {
  return name.replace(/^M\.[A-Z0-9]+- /, "").slice(0, 16);
}
function formatVal(v: number) {
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}M`;
  return v.toFixed(1);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-lg shadow-lg p-2.5 text-xs max-w-[200px]">
      <p className="font-semibold text-foreground mb-1 leading-tight">{label}</p>
      <p className="text-muted-foreground">
        Nilai: <span className="font-medium text-foreground">
          {payload[0].value.toLocaleString("id-ID", { maximumFractionDigits: 1 })}
        </span>
      </p>
    </div>
  );
};

export default function TopBottomChart({ title, items, variant }: Props) {
  const barColor   = variant === "top" ? "#3b82f6" : "#ef4444";
  const badgeCls   = variant === "top" ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-500";
  const badgeLabel = variant === "top" ? "TERBAIK" : "PERLU PERHATIAN";

  const data = items.map(item => ({
    name: shortUnit(item.unit),
    value: item.value,
  }));

  return (
    /* w-full ensures the card fills its grid cell on all screen sizes */
    <div className="w-full bg-card rounded-xl border border-card-border shadow-sm p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h3 className="text-xs sm:text-sm font-semibold text-foreground leading-tight">{title}</h3>
        <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${badgeCls}`}>
          {badgeLabel}
        </span>
      </div>

      {/* ResponsiveContainer reads parent width — always 100% */}
      <ResponsiveContainer width="100%" height={185}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 0, right: 50, top: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false} tickLine={false}
            tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}M` : String(v)}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={88}
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false} tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {data.map((_, i) => (
              <Cell key={i} fill={barColor} fillOpacity={1 - i * 0.1} />
            ))}
            <LabelList
              dataKey="value"
              position="right"
              style={{ fontSize: 11, fill: "#64748b" }}
              formatter={formatVal}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
