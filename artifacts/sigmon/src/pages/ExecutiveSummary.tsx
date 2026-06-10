import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Printer, Download, RefreshCw, TrendingUp, TrendingDown, Minus, AlertTriangle, Target, Shield } from "lucide-react";

function fmtJt(v?: number | null) {
  if (v == null) return "—";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}T`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}M`;
  return v.toLocaleString("id-ID", { maximumFractionDigits: 1 });
}
function fmt(v?: number | null, dec = 1) {
  if (v == null) return "—";
  return v.toLocaleString("id-ID", { maximumFractionDigits: dec });
}
function pctBadge(pct: number) {
  if (pct >= 100) return { cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400", icon: <TrendingUp className="w-3 h-3" /> };
  if (pct >= 80) return { cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400", icon: <Minus className="w-3 h-3" /> };
  return { cls: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400", icon: <TrendingDown className="w-3 h-3" /> };
}

export default function ExecutiveSummary() {
  const [summary, setSummary] = useState<any>(null);
  const [topBottom, setTopBottom] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [risk, setRisk] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>(null);
  const [period, setPeriod] = useState("");
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    const params: Record<string, string> = {};
    if (region) params.region = region;
    if (period) params.period = period;
    try {
      const [s, tb, a, r, f] = await Promise.all([
        api.dashboard.summary(params),
        api.dashboard.topBottom({ ...params, metric: "lending", n: "5" }),
        api.dashboard.alerts(params),
        api.dashboard.risk(params),
        filters ? Promise.resolve(filters) : api.dashboard.filters(),
      ]);
      setSummary(s); setTopBottom(tb); setAlerts(a); setRisk(r);
      if (!filters) setFilters(f);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchAll(); }, [period, region]);

  const handlePrint = () => {
    // Sembunyikan semua elemen sidebar via inline style (prioritas tertinggi)
    const sidebars = Array.from(document.querySelectorAll<HTMLElement>("aside"));
    const toggleBtn = document.querySelector<HTMLElement>(".sidebar-toggle-btn");
    const mainEl = document.querySelector<HTMLElement>("main");

    const prevSidebar = sidebars.map(el => el.style.display);
    const prevBtn = toggleBtn ? toggleBtn.style.display : "";
    const prevMargin = mainEl ? mainEl.style.marginLeft : "";
    const prevPadding = mainEl ? mainEl.style.paddingTop : "";

    sidebars.forEach(el => { el.style.setProperty("display", "none", "important"); });
    if (toggleBtn) toggleBtn.style.setProperty("display", "none", "important");
    if (mainEl) {
      mainEl.style.setProperty("margin-left", "0", "important");
      mainEl.style.setProperty("padding-top", "0", "important");
    }

    // Tunggu reflow sebelum print
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
        // Pulihkan setelah dialog print ditutup
        setTimeout(() => {
          sidebars.forEach((el, i) => { el.style.display = prevSidebar[i]; });
          if (toggleBtn) toggleBtn.style.display = prevBtn;
          if (mainEl) {
            mainEl.style.marginLeft = prevMargin;
            mainEl.style.paddingTop = prevPadding;
          }
        }, 1000);
      });
    });
  };

  const nplRatio = summary?.total_os_aktif > 0
    ? ((summary.total_os_npl / summary.total_os_aktif) * 100).toFixed(2)
    : "0.00";

  const criticalCount = alerts.filter(a => a.severity === "critical").length;
  const warningCount = alerts.filter(a => a.severity === "warning").length;

  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  const selectClass = "border border-border rounded-lg px-2.5 py-1.5 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <div className="bg-background min-h-screen">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <main className="lg:ml-60 min-h-screen pt-14 lg:pt-0 print:ml-0 print:pt-0">
        {/* Header — hidden on print */}
        <div className="border-b border-border bg-card sticky top-0 z-10 px-4 sm:px-6 py-3 print:hidden">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-sm font-semibold text-foreground">Ringkasan Eksekutif</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Laporan kinerja untuk rapat BOD</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select value={region} onChange={e => setRegion(e.target.value)} className={selectClass}>
                <option value="">Semua Region</option>
                {filters?.regions?.map((r: string) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={period} onChange={e => setPeriod(e.target.value)} className={selectClass}>
                <option value="">Semua Periode</option>
                {filters?.periods?.map((p: string) => <option key={p} value={p}>{p}</option>)}
              </select>
              <ThemeToggle variant="header" />
              <button onClick={() => fetchAll(true)} disabled={refreshing}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-60">
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cetak / PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Printable content */}
        <div ref={printRef} className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">

          {/* Report Header */}
          <div className="border-b-2 border-primary pb-4 print:pb-3">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">SIGMON</h2>
                <p className="text-sm text-muted-foreground">Sistem Informasi Monitoring BOD — Cabang Tangerang</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Ringkasan Eksekutif</p>
                <p className="mt-0.5">{today}</p>
                {period && <p className="mt-0.5 font-medium text-primary">{period}</p>}
                {region && <p className="mt-0.5">{region}</p>}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !summary ? (
            <p className="text-muted-foreground text-center py-12">Tidak ada data. Import data terlebih dahulu.</p>
          ) : (
            <>
              {/* KPI Summary Grid */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <BarChart className="w-4 h-4 text-primary" /> Ringkasan Kinerja Utama
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Total Unit", value: String(summary.total_unit), sub: "Unit aktif", accent: "border-blue-200 dark:border-blue-900/50" },
                    { label: "Total NOC", value: fmt(summary.total_noc, 0), sub: "Nasabah aktif", accent: "border-blue-200 dark:border-blue-900/50" },
                    { label: "OS Aktif", value: fmtJt(summary.total_os_aktif), sub: "Dalam jutaan", accent: "border-blue-200 dark:border-blue-900/50" },
                    { label: "Total Lending", value: fmtJt(summary.total_lending), sub: "Dalam jutaan", accent: "border-emerald-200 dark:border-emerald-900/50" },
                    { label: "OS NPL", value: fmtJt(summary.total_os_npl), sub: `${nplRatio}% dari OS`, accent: "border-red-200 dark:border-red-900/50" },
                    { label: "Rata-rata % RR", value: `${summary.avg_pct_rr.toFixed(1)}%`, sub: "Tingkat pengembalian", accent: summary.avg_pct_rr >= 90 ? "border-emerald-200 dark:border-emerald-900/50" : "border-amber-200 dark:border-amber-900/50" },
                  ].map(item => (
                    <div key={item.label} className={`bg-card rounded-xl border-2 ${item.accent} p-4`}>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{item.label}</p>
                      <p className="text-xl font-bold text-foreground mt-1">{item.value}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{item.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pencapaian Target */}
              {(summary.avg_pct_noc > 0 || summary.avg_pct_os > 0 || summary.avg_pct_lending > 0) && (
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" /> Pencapaian Target Cabang
                  </h3>
                  <div className="bg-card rounded-xl border border-card-border overflow-hidden">
                    <div className="grid grid-cols-3 divide-x divide-border">
                      {[
                        { label: "NOC", pct: summary.avg_pct_noc, desc: "Pencapaian target nasabah" },
                        { label: "OS Aktif", pct: summary.avg_pct_os, desc: "Pencapaian target outstanding" },
                        { label: "Lending", pct: summary.avg_pct_lending, desc: "Pencapaian target lending" },
                      ].map(item => {
                        const badge = pctBadge(item.pct);
                        return (
                          <div key={item.label} className="p-4 text-center">
                            <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                            <p className={`text-2xl font-bold mt-1 ${item.pct >= 100 ? "text-emerald-600" : item.pct >= 80 ? "text-amber-600" : "text-red-500"}`}>
                              {item.pct.toFixed(1)}%
                            </p>
                            <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.cls}`}>
                              {badge.icon}
                              {item.pct >= 100 ? "Tercapai" : item.pct >= 80 ? "Mendekati" : "Di Bawah Target"}
                            </div>
                            <div className="h-1.5 rounded-full bg-muted mt-3 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${item.pct >= 100 ? "bg-emerald-500" : item.pct >= 80 ? "bg-amber-400" : "bg-red-500"}`}
                                style={{ width: `${Math.min(item.pct, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Top / Bottom */}
              {topBottom && (
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <BarChart className="w-4 h-4 text-primary" /> Top 5 & Bottom 5 Unit — Lending
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Top 5 */}
                    <div className="bg-card rounded-xl border border-card-border overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-border bg-emerald-50 dark:bg-emerald-500/10">
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">🏆 Top 5 Terbaik</p>
                      </div>
                      <div className="divide-y divide-border">
                        {topBottom.top5?.map((u: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-700 dark:text-emerald-400 shrink-0">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{u.unit.replace(/^M\.[A-Z0-9]+- /, "")}</p>
                              <p className="text-[10px] text-muted-foreground">{u.area || u.region || "—"}</p>
                            </div>
                            <span className="text-xs font-bold text-emerald-600 tabular-nums">{fmtJt(u.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Bottom 5 */}
                    <div className="bg-card rounded-xl border border-card-border overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-border bg-red-50 dark:bg-red-500/10">
                        <p className="text-xs font-bold text-red-700 dark:text-red-400">⚠️ Bottom 5 — Perlu Perhatian</p>
                      </div>
                      <div className="divide-y divide-border">
                        {topBottom.bottom5?.map((u: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                            <span className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-[10px] font-bold text-red-700 dark:text-red-400 shrink-0">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{u.unit.replace(/^M\.[A-Z0-9]+- /, "")}</p>
                              <p className="text-[10px] text-muted-foreground">{u.area || u.region || "—"}</p>
                            </div>
                            <span className="text-xs font-bold text-red-500 tabular-nums">{fmtJt(u.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Alert Summary */}
              {alerts.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" /> Status Unit Bermasalah
                  </h3>
                  <div className="bg-card rounded-xl border border-red-200 dark:border-red-900/50 overflow-hidden">
                    <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-border border-b border-border">
                      <div className="p-4 text-center">
                        <p className="text-2xl font-bold text-foreground">{alerts.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">Total Unit Bermasalah</p>
                      </div>
                      <div className="p-4 text-center">
                        <p className="text-2xl font-bold text-red-500">{criticalCount}</p>
                        <p className="text-xs text-muted-foreground mt-1">Status Kritis</p>
                      </div>
                      <div className="p-4 text-center hidden sm:block">
                        <p className="text-2xl font-bold text-amber-600">{warningCount}</p>
                        <p className="text-xs text-muted-foreground mt-1">Perlu Perhatian</p>
                      </div>
                    </div>
                    {/* Top 5 alerts */}
                    <div className="divide-y divide-border">
                      {alerts.slice(0, 5).map(a => (
                        <div key={a.id} className="flex items-start gap-3 px-4 py-3">
                          <span className={`mt-0.5 inline-block w-2 h-2 rounded-full shrink-0 ${a.severity === "critical" ? "bg-red-500" : "bg-amber-400"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{a.unit.replace(/^M\.[A-Z0-9]+- /, "")}</p>
                            <p className="text-[10px] text-muted-foreground">{a.issues.join(" · ")}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Risk Summary */}
              {risk.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-500" /> Ringkasan Risiko per Area
                  </h3>
                  <div className="bg-card rounded-xl border border-card-border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs min-w-[400px]">
                        <thead>
                          <tr className="bg-muted/50 border-b border-border">
                            <th className="px-4 py-2.5 text-left text-muted-foreground font-medium">Area</th>
                            <th className="px-4 py-2.5 text-right text-muted-foreground font-medium">PAR %</th>
                            <th className="px-4 py-2.5 text-right text-muted-foreground font-medium">LAR %</th>
                            <th className="px-4 py-2.5 text-right text-muted-foreground font-medium">NPL %</th>
                            <th className="px-4 py-2.5 text-right text-muted-foreground font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {risk.sort((a, b) => b.npl_ratio - a.npl_ratio).map(row => {
                            const status = row.npl_ratio > 10 ? { label: "Kritis", cls: "text-red-500 font-bold" }
                              : row.npl_ratio > 5 ? { label: "Waspada", cls: "text-amber-600 font-semibold" }
                              : { label: "Aman", cls: "text-emerald-600 font-semibold" };
                            return (
                              <tr key={row.area} className="hover:bg-muted/20 transition-colors">
                                <td className="px-4 py-2.5 font-medium text-foreground">{row.area}</td>
                                <td className="px-4 py-2.5 text-right tabular-nums text-amber-600">{row.par_ratio.toFixed(2)}%</td>
                                <td className="px-4 py-2.5 text-right tabular-nums text-orange-600">{row.lar_ratio.toFixed(2)}%</td>
                                <td className="px-4 py-2.5 text-right tabular-nums text-red-500">{row.npl_ratio.toFixed(2)}%</td>
                                <td className={`px-4 py-2.5 text-right ${status.cls}`}>{status.label}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-border pt-4 text-center print:block">
                <p className="text-[10px] text-muted-foreground">
                  Dicetak dari SIGMON — Sistem Informasi Monitoring BOD · Cabang Tangerang · {today}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Dokumen ini bersifat rahasia dan hanya untuk keperluan internal.
                </p>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          aside,
          nav,
          button[class*="fixed"],
          div[class*="fixed"][class*="inset-0"],
          .print\\:hidden { display: none !important; visibility: hidden !important; }
          main {
            margin-left: 0 !important;
            padding-top: 0 !important;
            width: 100% !important;
          }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}

function BarChart({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="12" width="4" height="9" rx="1" /><rect x="10" y="7" width="4" height="14" rx="1" /><rect x="17" y="3" width="4" height="18" rx="1" />
    </svg>
  );
}
