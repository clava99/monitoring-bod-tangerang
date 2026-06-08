import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { ShieldAlert } from "lucide-react";

interface RiskArea {
  area: string;
  par_ratio: number;
  npl_ratio: number;
  lar_ratio: number;
  os_aktif: number;
  os_par: number;
  os_npl: number;
  os_lar: number;
}

interface Props {
  data: RiskArea[];
}

function getRiskColor(npl: number) {
  if (npl > 10) return "#ef4444";
  if (npl > 5)  return "#f59e0b";
  return "#10b981";
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg p-3 text-xs min-w-[180px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-2 h-2 rounded-sm" style={{ background: p.fill }} />
            {p.name}
          </span>
          <span className="font-semibold tabular-nums text-foreground">{p.value?.toFixed(2)}%</span>
        </div>
      ))}
    </div>
  );
};

export default function RiskChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-card-border shadow-sm p-6 flex flex-col items-center justify-center min-h-[260px]">
        <ShieldAlert className="w-8 h-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground text-center">Belum ada data risiko.</p>
        <p className="text-xs text-muted-foreground/70 mt-1 text-center">Import data untuk melihat analisis risiko per area.</p>
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => b.npl_ratio - a.npl_ratio);

  return (
    <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-card-border">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Rasio Risiko per Area
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">PAR · LAR · NPL sebagai % dari OS Aktif</p>
          </div>
          {/* Legend manual */}
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-amber-400 inline-block" /> PAR</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-orange-500 inline-block" /> LAR</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-red-500 inline-block" /> NPL</span>
          </div>
        </div>
        {/* Risk legend */}
        <div className="flex items-center gap-3 mt-2.5 text-[9px] font-medium">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> NPL &lt; 5% Aman</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> NPL 5–10% Waspada</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> NPL &gt; 10% Kritis</span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={sortedData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={14} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
            <XAxis
              dataKey="area"
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={-30}
              textAnchor="end"
              height={44}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="par_ratio" name="PAR" radius={[3, 3, 0, 0]} fill="#fbbf24" />
            <Bar dataKey="lar_ratio" name="LAR" radius={[3, 3, 0, 0]} fill="#f97316" />
            <Bar dataKey="npl_ratio" name="NPL" radius={[3, 3, 0, 0]}>
              {sortedData.map((entry, i) => (
                <Cell key={i} fill={getRiskColor(entry.npl_ratio)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table summary */}
      <div className="border-t border-border overflow-x-auto">
        <table className="w-full text-xs min-w-[360px]">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-2 text-left text-muted-foreground font-medium">Area</th>
              <th className="px-4 py-2 text-right text-muted-foreground font-medium">PAR%</th>
              <th className="px-4 py-2 text-right text-muted-foreground font-medium">LAR%</th>
              <th className="px-4 py-2 text-right text-muted-foreground font-medium">NPL%</th>
              <th className="px-4 py-2 text-right text-muted-foreground font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedData.map(row => {
              const status = row.npl_ratio > 10 ? { label: "Kritis", cls: "text-red-500 font-bold" }
                : row.npl_ratio > 5 ? { label: "Waspada", cls: "text-amber-600 font-semibold" }
                : { label: "Aman", cls: "text-emerald-600 font-semibold" };
              return (
                <tr key={row.area} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2 font-medium text-foreground truncate max-w-[120px]">{row.area}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-amber-600">{row.par_ratio.toFixed(2)}%</td>
                  <td className="px-4 py-2 text-right tabular-nums text-orange-600">{row.lar_ratio.toFixed(2)}%</td>
                  <td className="px-4 py-2 text-right tabular-nums text-red-500">{row.npl_ratio.toFixed(2)}%</td>
                  <td className={`px-4 py-2 text-right ${status.cls}`}>{status.label}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
