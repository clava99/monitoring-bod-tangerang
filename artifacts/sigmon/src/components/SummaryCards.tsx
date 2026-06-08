import { TrendingUp, Users, Wallet, CreditCard, AlertTriangle, BarChart3, Target } from "lucide-react";

interface Summary {
  total_unit: number;
  total_noc: number;
  total_os_aktif: number;
  total_lending: number;
  total_os_npl: number;
  avg_pct_rr: number;
  avg_pct_noc: number;
  avg_pct_os: number;
  avg_pct_lending: number;
  period?: string;
}

function formatJuta(val: number) {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}T`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}M`;
  return val.toLocaleString("id-ID", { maximumFractionDigits: 0 });
}

function formatNum(val: number) {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
  return val.toLocaleString("id-ID");
}

function AchievementBar({ pct, label }: { pct: number; label: string }) {
  const clamped = Math.min(pct, 100);
  const color =
    pct >= 100 ? "bg-emerald-500" :
    pct >= 80  ? "bg-amber-400" :
                 "bg-red-500";
  const textColor =
    pct >= 100 ? "text-emerald-600 dark:text-emerald-400" :
    pct >= 80  ? "text-amber-600 dark:text-amber-400" :
                 "text-red-500 dark:text-red-400";

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1">
          <Target className="w-2.5 h-2.5" /> {label}
        </span>
        <span className={`text-[10px] font-bold tabular-nums ${textColor}`}>{pct.toFixed(1)}%</span>
      </div>
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

interface CardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent?: "blue" | "green" | "red" | "amber";
  achievement?: { pct: number; label: string };
}

function StatCard({ label, value, sub, icon, accent = "blue", achievement }: CardProps) {
  const colors: Record<string, string> = {
    blue:  "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    red:   "bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  };
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-foreground mt-1 leading-none">
            {value}
          </p>
          {sub && (
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5">{sub}</p>
          )}
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colors[accent]}`}>
          {icon}
        </div>
      </div>
      {achievement && achievement.pct > 0 && (
        <AchievementBar pct={achievement.pct} label={achievement.label} />
      )}
    </div>
  );
}

export default function SummaryCards({ summary }: { summary: Summary }) {
  const nplRatio = summary.total_os_aktif > 0
    ? ((summary.total_os_npl / summary.total_os_aktif) * 100).toFixed(2)
    : "0.00";

  return (
    <div className="summary-cards-grid">
      <StatCard
        label="Total Unit"
        value={String(summary.total_unit)}
        sub="Unit aktif"
        icon={<BarChart3 className="w-4 h-4" />}
        accent="blue"
      />
      <StatCard
        label="Total NOC"
        value={formatNum(summary.total_noc)}
        sub="Nasabah aktif"
        icon={<Users className="w-4 h-4" />}
        accent="blue"
        achievement={summary.avg_pct_noc > 0 ? { pct: summary.avg_pct_noc, label: "Pencapaian target" } : undefined}
      />
      <StatCard
        label="OS Aktif"
        value={formatJuta(summary.total_os_aktif)}
        sub="Dalam jutaan"
        icon={<Wallet className="w-4 h-4" />}
        accent="blue"
        achievement={summary.avg_pct_os > 0 ? { pct: summary.avg_pct_os, label: "Pencapaian target" } : undefined}
      />
      <StatCard
        label="Total Lending"
        value={formatJuta(summary.total_lending)}
        sub="Dalam jutaan"
        icon={<CreditCard className="w-4 h-4" />}
        accent="green"
        achievement={summary.avg_pct_lending > 0 ? { pct: summary.avg_pct_lending, label: "Pencapaian target" } : undefined}
      />
      <StatCard
        label="OS NPL"
        value={formatJuta(summary.total_os_npl)}
        sub={`${nplRatio}% dari OS`}
        icon={<AlertTriangle className="w-4 h-4" />}
        accent="red"
      />
      <StatCard
        label="Rata-rata % RR"
        value={`${summary.avg_pct_rr.toFixed(1)}%`}
        sub="Tingkat pengembalian"
        icon={<TrendingUp className="w-4 h-4" />}
        accent={summary.avg_pct_rr >= 90 ? "green" : "amber"}
      />
    </div>
  );
}
