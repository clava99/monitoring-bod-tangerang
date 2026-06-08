import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { api } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft, Users, Wallet, CreditCard, TrendingUp, AlertTriangle,
  BarChart3, Target, ShieldAlert, UserCheck,
} from "lucide-react";

function fmt(v?: number | null, dec = 1) {
  if (v == null) return "—";
  return v.toLocaleString("id-ID", { maximumFractionDigits: dec });
}
function fmtJt(v?: number | null) {
  if (v == null) return "—";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}T`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}M`;
  return fmt(v);
}
function fmtPct(v?: number | null) {
  if (v == null) return "—";
  return `${(v * 100).toFixed(1)}%`;
}
function pctColor(v?: number | null, scale = 1) {
  if (v == null) return "text-muted-foreground";
  const pct = v * scale;
  if (pct >= 100) return "text-emerald-600 dark:text-emerald-400";
  if (pct >= 80) return "text-amber-600 dark:text-amber-400";
  return "text-red-500 dark:text-red-400";
}
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

function KpiCard({ label, value, sub, icon, accent = "blue" }: {
  label: string; value: string; sub?: string; icon: React.ReactNode; accent?: string;
}) {
  const colors: Record<string, string> = {
    blue:  "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    red:   "bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
    violet:"bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
  };
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-xl font-bold text-foreground mt-1 leading-none">{value}</p>
          {sub && <p className="text-[10px] text-muted-foreground mt-1.5">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colors[accent] || colors.blue}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function AchievRow({ label, actual, target, gap, pct }: {
  label: string; actual?: number | null; target?: number | null; gap?: number | null; pct?: number | null;
}) {
  const pctVal = pct != null ? pct * 100 : null;
  const color = pctVal == null ? "" : pctVal >= 100 ? "text-emerald-600" : pctVal >= 80 ? "text-amber-600" : "text-red-500";
  return (
    <tr className="border-b border-border hover:bg-muted/20 transition-colors">
      <td className="px-4 py-2.5 text-xs font-medium text-foreground">{label}</td>
      <td className="px-4 py-2.5 text-xs text-right tabular-nums">{fmt(actual, 0)}</td>
      <td className="px-4 py-2.5 text-xs text-right tabular-nums text-muted-foreground">{fmt(target, 0)}</td>
      <td className={`px-4 py-2.5 text-xs text-right tabular-nums ${gap != null && gap < 0 ? "text-red-500" : "text-emerald-600"}`}>
        {gap != null ? (gap >= 0 ? `+${fmt(gap, 0)}` : fmt(gap, 0)) : "—"}
      </td>
      <td className={`px-4 py-2.5 text-xs text-right tabular-nums font-semibold ${color}`}>
        {pctVal != null ? `${pctVal.toFixed(1)}%` : "—"}
      </td>
    </tr>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg p-3 text-xs min-w-[140px]">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-3 py-0.5">
          <span className="text-muted-foreground">{p.name}</span>
          <span className="font-semibold tabular-nums">{p.value?.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
};

export default function UnitDetail() {
  const params = useParams<{ id: string }>();
  const unitId = Number(params.id);
  const [unit, setUnit] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.units.get(unitId);
        setUnit(data);
        if (data?.unit) {
          const hist = await api.dashboard.unitHistory(data.unit);
          setHistory(hist.sort((a: any, b: any) => (a.period || "").localeCompare(b.period || "")));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [unitId]);

  const nplRatio = unit?.os_aktif && unit?.os_npl
    ? ((unit.os_npl / unit.os_aktif) * 100)
    : 0;

  const chartData = history.map(h => ({
    _p: shortPeriod(h.period || ""),
    noc: h.noc,
    pct_rr: h.pct_rr != null ? h.pct_rr * 100 : null,
    lending: h.lending,
    os_aktif: h.os_aktif,
    pct_lending: h.pct_lending != null ? h.pct_lending * 100 : null,
  }));

  return (
    <div className="bg-background min-h-screen">
      <Sidebar />
      <main className="lg:ml-60 min-h-screen pt-14 lg:pt-0">
        {/* Header */}
        <div className="border-b border-border bg-card sticky top-0 z-10 px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/units">
                <a className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0">
                  <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                </a>
              </Link>
              <div className="min-w-0">
                <h1 className="text-sm font-semibold text-foreground truncate">
                  {loading ? "Memuat..." : (unit?.unit?.replace(/^M\.[A-Z0-9]+- /, "") || "Unit Tidak Ditemukan")}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {unit ? [unit.region, unit.area, unit.period].filter(Boolean).join(" · ") : ""}
                </p>
              </div>
            </div>
            <ThemeToggle variant="header" />
          </div>
        </div>

        {loading ? (
          <div className="p-6 flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Memuat data unit...</p>
            </div>
          </div>
        ) : !unit ? (
          <div className="p-6 text-center">
            <p className="text-muted-foreground">Unit tidak ditemukan.</p>
            <Link href="/units"><a className="text-primary text-sm mt-2 inline-block hover:underline">← Kembali ke Data Unit</a></Link>
          </div>
        ) : (
          <div className="p-4 sm:p-5 lg:p-6 space-y-5">

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiCard label="NOC" value={fmt(unit.noc, 0)} sub="Nasabah aktif" icon={<Users className="w-4 h-4" />} accent="blue" />
              <KpiCard label="OS Aktif" value={fmtJt(unit.os_aktif)} sub="Dalam jutaan" icon={<Wallet className="w-4 h-4" />} accent="blue" />
              <KpiCard label="Lending" value={fmtJt(unit.lending)} sub="Dalam jutaan" icon={<CreditCard className="w-4 h-4" />} accent="green" />
              <KpiCard label="% RR" value={fmtPct(unit.pct_rr)} sub="Tingkat pengembalian" icon={<TrendingUp className="w-4 h-4" />} accent={unit.pct_rr != null && unit.pct_rr * 100 >= 90 ? "green" : "amber"} />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiCard label="OS NPL" value={fmtJt(unit.os_npl)} sub={`${nplRatio.toFixed(2)}% dari OS`} icon={<AlertTriangle className="w-4 h-4" />} accent="red" />
              <KpiCard label="OS PAR" value={fmtJt(unit.os_par)} sub="Portfolio at Risk" icon={<ShieldAlert className="w-4 h-4" />} accent="amber" />
              <KpiCard label="OS LAR" value={fmtJt(unit.os_lar)} sub="Loan at Risk" icon={<ShieldAlert className="w-4 h-4" />} accent="amber" />
              <KpiCard label="Account Officer" value={unit.ao != null ? String(unit.ao) : "—"} sub="Jumlah AO" icon={<UserCheck className="w-4 h-4" />} accent="violet" />
            </div>

            {/* Pencapaian vs Target */}
            <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
              <div className="px-4 sm:px-5 py-3 border-b border-card-border">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" /> Pencapaian vs Target
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Periode: {unit.period || "—"}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[400px]">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-4 py-2 text-left text-muted-foreground font-medium">Metrik</th>
                      <th className="px-4 py-2 text-right text-muted-foreground font-medium">Aktual</th>
                      <th className="px-4 py-2 text-right text-muted-foreground font-medium">Target</th>
                      <th className="px-4 py-2 text-right text-muted-foreground font-medium">Gap</th>
                      <th className="px-4 py-2 text-right text-muted-foreground font-medium">% Capai</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AchievRow label="NOC (Nasabah)" actual={unit.noc} target={unit.target_noc} gap={unit.gap_noc} pct={unit.pct_noc} />
                    <AchievRow label="OS Aktif (Juta)" actual={unit.os_aktif} target={unit.target_os} gap={unit.gap_os} pct={unit.pct_os} />
                    <AchievRow label="Lending (Juta)" actual={unit.lending} target={unit.target_lending} gap={unit.gap_lending} pct={unit.pct_lending} />
                  </tbody>
                </table>
              </div>
            </div>

            {/* Historical Trend */}
            {history.length > 1 && (
              <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
                <div className="px-4 sm:px-5 py-3 border-b border-card-border">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" /> Historis Performa Unit
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{history.length} periode ditemukan</p>
                </div>
                <div className="p-4 sm:p-5">
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                      <XAxis dataKey="_p" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="pct_rr" name="% RR" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="pct_lending" name="% Capai Lending" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="noc" name="NOC" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Risk Detail */}
            <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
              <div className="px-4 sm:px-5 py-3 border-b border-card-border">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500" /> Detail Risiko
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-border">
                {[
                  { label: "NOA PAR", value: fmt(unit.noa_par, 0), sub: "Akun PAR" },
                  { label: "OS PAR", value: fmtJt(unit.os_par), sub: "Outstanding PAR" },
                  { label: "NOA NPL", value: fmt(unit.noa_npl, 0), sub: "Akun NPL" },
                  { label: "OS NPL", value: fmtJt(unit.os_npl), sub: "Outstanding NPL" },
                  { label: "NOA LAR", value: fmt(unit.noa_lar, 0), sub: "Akun LAR" },
                  { label: "OS LAR", value: fmtJt(unit.os_lar), sub: "Outstanding LAR" },
                  { label: "OS 3R", value: fmtJt(unit.os_3r), sub: "Restrukturisasi" },
                  { label: "% OS NPL", value: unit.pct_os_npl != null ? `${(unit.pct_os_npl * 100).toFixed(2)}%` : "—", sub: "Rasio NPL" },
                ].map(item => (
                  <div key={item.label} className="p-4">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{item.label}</p>
                    <p className="text-base font-bold text-foreground mt-1">{item.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
