import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";

interface TrendPoint {
  period: string;
  total_noc: number;
  total_os_aktif: number;
  total_lending: number;
  avg_pct_rr: number;
  avg_pct_noc: number;
  avg_pct_os: number;
  avg_pct_lending: number;
}

interface Props {
  data: TrendPoint[];
}

const METRICS = [
  { key: "avg_pct_noc",     label: "% Pencapaian NOC",     color: "#3b82f6", unit: "%" },
  { key: "avg_pct_os",      label: "% Pencapaian OS",       color: "#10b981", unit: "%" },
  { key: "avg_pct_lending", label: "% Pencapaian Lending",  color: "#f59e0b", unit: "%" },
  { key: "avg_pct_rr",      label: "% RR",                  color: "#8b5cf6", unit: "%" },
  { key: "total_noc",       label: "Total NOC",             color: "#06b6d4", unit: "" },
  { key: "total_os_aktif",  label: "OS Aktif (Juta)",       color: "#f97316", unit: "Jt" },
  { key: "total_lending",   label: "Lending (Juta)",        color: "#ec4899", unit: "Jt" },
];

function shortPeriod(p: string) {
  const months: Record<string, string> = {
    januari: "Jan", februari: "Feb", maret: "Mar", april: "Apr",
    mei: "Mei", juni: "Jun", juli: "Jul", agustus: "Agu",
    september: "Sep", oktober: "Okt", november: "Nov", desember: "Des",
  };
  const lower = p.toLowerCase();
  for (const [id, short] of Object.entries(months)) {
    if (lower.includes(id)) {
      const year = p.match(/\d{4}/)?.[0]?.slice(2) || "";
      return `${short}'${year}`;
    }
  }
  return p.length > 8 ? p.slice(0, 8) : p;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg p-3 text-xs min-w-[160px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-semibold tabular-nums text-foreground">{p.value?.toFixed(1)}{p.unit}</span>
        </div>
      ))}
    </div>
  );
};

export default function TrendChart({ data }: Props) {
  const [selected, setSelected] = useState<string[]>(["avg_pct_noc", "avg_pct_lending", "avg_pct_rr"]);

  const toggle = (key: string) => {
    setSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const chartData = data.map(d => ({ ...d, _period: shortPeriod(d.period) }));

  if (!data || data.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-card-border shadow-sm p-6 flex flex-col items-center justify-center min-h-[260px]">
        <TrendingUp className="w-8 h-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground text-center">Belum ada data tren.</p>
        <p className="text-xs text-muted-foreground/70 mt-1 text-center">Import data dari beberapa periode untuk melihat tren.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-card-border">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Tren Performa Antar Periode
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{data.length} periode tersedia</p>
          </div>
        </div>
        {/* Metric toggles */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {METRICS.map(m => (
            <button
              key={m.key}
              onClick={() => toggle(m.key)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium border transition-all ${
                selected.includes(m.key)
                  ? "border-transparent text-white"
                  : "border-border text-muted-foreground bg-muted/40 hover:bg-muted"
              }`}
              style={selected.includes(m.key) ? { background: m.color } : {}}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: selected.includes(m.key) ? "rgba(255,255,255,0.7)" : m.color }}
              />
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4 sm:p-5">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
            <XAxis
              dataKey="_period"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {METRICS.filter(m => selected.includes(m.key)).map(m => (
              <Line
                key={m.key}
                type="monotone"
                dataKey={m.key}
                name={m.label}
                stroke={m.color}
                strokeWidth={2}
                dot={{ r: 3, fill: m.color, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
