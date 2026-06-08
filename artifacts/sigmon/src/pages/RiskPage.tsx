import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import RiskChart from "@/components/RiskChart";
import AlertPanel from "@/components/AlertPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SkeletonChart } from "@/components/SkeletonLoader";
import { RefreshCw, Filter, ShieldAlert } from "lucide-react";

export default function RiskPage() {
  const [risk, setRisk] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [region, setRegion] = useState("");
  const [area, setArea] = useState("");
  const [period, setPeriod] = useState("");

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    const params: Record<string, string> = {};
    if (region) params.region = region;
    if (area) params.area = area;
    if (period) params.period = period;
    try {
      const [r, a, f] = await Promise.all([
        api.dashboard.risk(params),
        api.dashboard.alerts(params),
        filters ? Promise.resolve(filters) : api.dashboard.filters(),
      ]);
      setRisk(r);
      setAlerts(a);
      if (!filters) setFilters(f);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [region, area, period]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const selectCls = "border border-border rounded-lg px-2.5 py-1.5 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/20";
  const critical = alerts.filter(a => a.severity === "critical").length;
  const warning = alerts.filter(a => a.severity === "warning").length;

  return (
    <div className="bg-background min-h-screen">
      <Sidebar />
      <main className="lg:ml-60 min-h-screen pt-14 lg:pt-0 max-w-full overflow-x-hidden">

        {/* Header */}
        <div className="border-b border-border bg-card sticky top-0 z-10 px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0 pl-1 lg:pl-0">
              <h1 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                Analisis Risiko
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                PAR · LAR · NPL per Area — {period || "Semua Periode"}
                {alerts.length > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-bold">
                    ⚠ {critical} kritis · {warning} perhatian
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <ThemeToggle variant="header" />
              <button onClick={() => fetchAll(true)} disabled={refreshing}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-60">
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
          {/* Filters */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <select value={region} onChange={e => { setRegion(e.target.value); setArea(""); }} className={selectCls}>
              <option value="">Semua Region</option>
              {filters?.regions?.map((r: string) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={area} onChange={e => setArea(e.target.value)} className={selectCls}>
              <option value="">Semua Area</option>
              {filters?.areas?.map((a: string) => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={period} onChange={e => setPeriod(e.target.value)} className={selectCls}>
              <option value="">Semua Periode</option>
              {filters?.periods?.map((p: string) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="p-4 sm:p-5 lg:p-6 space-y-5">
          {loading ? (
            <><SkeletonChart /><SkeletonChart /></>
          ) : (
            <>
              {/* Risk summary cards */}
              {risk.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {
                      label: "Area Kritis (NPL > 10%)",
                      value: risk.filter(r => r.npl_ratio > 10).length,
                      cls: "border-red-200 dark:border-red-900/50 text-red-500",
                    },
                    {
                      label: "Area Waspada (NPL 5–10%)",
                      value: risk.filter(r => r.npl_ratio > 5 && r.npl_ratio <= 10).length,
                      cls: "border-amber-200 dark:border-amber-900/50 text-amber-600",
                    },
                    {
                      label: "Area Aman (NPL < 5%)",
                      value: risk.filter(r => r.npl_ratio <= 5).length,
                      cls: "border-emerald-200 dark:border-emerald-900/50 text-emerald-600",
                    },
                    {
                      label: "Total Area Terpantau",
                      value: risk.length,
                      cls: "border-blue-200 dark:border-blue-900/50 text-blue-600",
                    },
                  ].map(card => (
                    <div key={card.label} className={`bg-card rounded-xl border-2 ${card.cls.split(" ").filter(c => c.startsWith("border")).join(" ")} p-4`}>
                      <p className={`text-2xl font-bold ${card.cls.split(" ").filter(c => !c.startsWith("border")).join(" ")}`}>{card.value}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{card.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Risk chart */}
              <RiskChart data={risk} />

              {/* Alert panel */}
              {alerts.length > 0 && <AlertPanel alerts={alerts} />}

              {risk.length === 0 && alerts.length === 0 && (
                <div className="bg-card rounded-xl border border-card-border p-12 text-center">
                  <ShieldAlert className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Belum ada data risiko.</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Import data terlebih dahulu untuk melihat analisis risiko.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
