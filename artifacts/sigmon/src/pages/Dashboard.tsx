import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import SummaryCards from "@/components/SummaryCards";
import TopBottomChart from "@/components/TopBottomChart";
import UnitsTable from "@/components/UnitsTable";
import TrendChart from "@/components/TrendChart";
import AlertPanel from "@/components/AlertPanel";
import RiskChart from "@/components/RiskChart";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import { SkeletonCard, SkeletonChart, SkeletonTable } from "@/components/SkeletonLoader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RefreshCw, Download, Filter, ShieldAlert } from "lucide-react";

const METRICS = [
  { value: "lending", label: "Lending" },
  { value: "os_aktif", label: "OS Aktif" },
  { value: "noc", label: "NOC" },
  { value: "os_npl", label: "OS NPL" },
  { value: "pct_rr", label: "% RR" },
];

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [topBottom, setTopBottom] = useState<any>(null);
  const [units, setUnits] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [risk, setRisk] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [region, setRegion] = useState("");
  const [area, setArea] = useState("");
  const [period, setPeriod] = useState("");
  const [metric, setMetric] = useState("lending");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("unit");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    const params: Record<string, string> = {};
    if (region) params.region = region;
    if (area) params.area = area;
    if (period) params.period = period;

    const trendParams: Record<string, string> = {};
    if (region) trendParams.region = region;
    if (area) trendParams.area = area;

    try {
      const [s, tb, u, f, tr, al, ri] = await Promise.all([
        api.dashboard.summary(params),
        api.dashboard.topBottom({ ...params, metric, n: "5" }),
        api.units.list({ ...params, page: String(page), limit: "20", search, sort_by: sortBy, sort_order: sortOrder }),
        filters ? Promise.resolve(filters) : api.dashboard.filters(),
        api.dashboard.trend(trendParams),
        api.dashboard.alerts(params),
        api.dashboard.risk(params),
      ]);
      setSummary(s);
      setTopBottom(tb);
      setUnits(u);
      setTrend(tr);
      setAlerts(al);
      setRisk(ri);
      if (!filters) setFilters(f);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [region, area, period, metric, page, search, sortBy, sortOrder]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const params: Record<string, string> = {};
      if (region) params.region = region;
      if (area) params.area = area;
      if (period) params.period = period;
      await api.export.excel(params);
    } catch (e: any) {
      alert("Export gagal: " + (e?.message || "Terjadi kesalahan"));
    } finally {
      setExporting(false);
    }
  };

  const selectClass = "border border-border rounded-lg px-2.5 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 w-full";

  return (
    <div className="bg-background min-h-screen">
      <Sidebar />

      <main className="lg:ml-60 min-h-screen pt-14 lg:pt-0 max-w-full overflow-x-hidden">

        {/* ── Sticky Header ── */}
        <div className="border-b border-border bg-card sticky top-0 z-10 px-4 sm:px-6 py-3 w-full overflow-hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 pl-1 lg:pl-0">
              <h1 className="text-sm sm:text-base font-semibold text-foreground truncate">
                Dashboard Monitoring BOD
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {summary?.period || "Semua Periode"} · Wilayah 1
                {alerts.length > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-bold">
                    ⚠ {alerts.length} unit bermasalah
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ThemeToggle variant="header" />
              <button
                onClick={() => fetchAll(true)}
                disabled={refreshing}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border
                  rounded-lg hover:bg-muted transition-colors disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-primary
                  text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {exporting
                  ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  : <Download className="w-3.5 h-3.5" />
                }
                <span className="hidden sm:inline">{exporting ? "Mengekspor..." : "Export Excel"}</span>
              </button>
            </div>
          </div>

          {/* Filter row */}
          <div className="mt-3">
            <div className="grid grid-cols-2 gap-2 sm:hidden">
              <select value={region} onChange={e => { setRegion(e.target.value); setArea(""); setPage(1); }} className={selectClass}>
                <option value="">Semua Region</option>
                {filters?.regions?.map((r: string) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={area} onChange={e => { setArea(e.target.value); setPage(1); }} className={selectClass}>
                <option value="">Semua Area</option>
                {filters?.areas?.map((a: string) => <option key={a} value={a}>{a}</option>)}
              </select>
              <select value={period} onChange={e => { setPeriod(e.target.value); setPage(1); }} className={selectClass}>
                <option value="">Semua Periode</option>
                {filters?.periods?.map((p: string) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={metric} onChange={e => setMetric(e.target.value)} className={selectClass}>
                {METRICS.map(m => <option key={m.value} value={m.value}>Metrik: {m.label}</option>)}
              </select>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <select value={region} onChange={e => { setRegion(e.target.value); setArea(""); setPage(1); }} className="border border-border rounded-lg px-2.5 py-1.5 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Semua Region</option>
                {filters?.regions?.map((r: string) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={area} onChange={e => { setArea(e.target.value); setPage(1); }} className="border border-border rounded-lg px-2.5 py-1.5 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Semua Area</option>
                {filters?.areas?.map((a: string) => <option key={a} value={a}>{a}</option>)}
              </select>
              <select value={period} onChange={e => { setPeriod(e.target.value); setPage(1); }} className="border border-border rounded-lg px-2.5 py-1.5 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Semua Periode</option>
                {filters?.periods?.map((p: string) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={metric} onChange={e => setMetric(e.target.value)} className="border border-border rounded-lg px-2.5 py-1.5 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
                {METRICS.map(m => <option key={m.value} value={m.value}>Metrik: {m.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Banner Ganti Password Default ── */}
        {user && user.password_changed === false && (
          <div className="mx-4 sm:mx-5 lg:mx-6 mt-4 flex items-start gap-3 px-4 py-3 rounded-xl"
            style={{
              background: "hsl(38 92% 50% / 0.12)",
              border: "1px solid hsl(38 92% 50% / 0.35)",
            }}>
            <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "hsl(38 92% 45%)" }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "hsl(38 92% 35%)" }}>
                Anda masih menggunakan password default
              </p>
              <p className="text-xs mt-0.5" style={{ color: "hsl(38 92% 40%)" }}>
                Segera ganti password untuk keamanan akun. Password default mudah ditebak dan membahayakan sistem.
              </p>
            </div>
            <button
              onClick={() => setShowChangePassword(true)}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
              style={{ background: "hsl(38 92% 50%)", color: "#fff" }}
            >
              Ganti Sekarang
            </button>
          </div>
        )}

        {/* ── Page content ── */}
        <div className="p-4 sm:p-5 lg:p-6 space-y-5">
          {loading ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SkeletonChart /><SkeletonChart />
              </div>
              <SkeletonTable />
            </>
          ) : (
            <>
              {/* 1. KPI Cards dengan % Achievement */}
              {summary && <SummaryCards summary={summary} />}

              {/* 2. Alert Panel */}
              {alerts.length > 0 && <AlertPanel alerts={alerts} />}

              {/* 3. Top/Bottom + Trend Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {topBottom && (
                  <>
                    <TopBottomChart
                      title={`Top 5 — ${METRICS.find(m => m.value === metric)?.label}`}
                      items={topBottom.top5}
                      variant="top"
                    />
                    <TopBottomChart
                      title={`Bottom 5 — ${METRICS.find(m => m.value === metric)?.label}`}
                      items={topBottom.bottom5}
                      variant="bottom"
                    />
                  </>
                )}
              </div>

              {/* 4. Trend Chart — full width */}
              <TrendChart data={trend} />

              {/* 5. Risk Chart — full width */}
              <RiskChart data={risk} />

              {/* 6. Units Table with alert highlights + detail link */}
              {units && (
                <UnitsTable
                  data={units.data}
                  total={units.total}
                  page={units.page}
                  totalPages={units.total_pages}
                  onPageChange={p => setPage(p)}
                  onSearch={s => { setSearch(s); setPage(1); }}
                  onSort={(col, dir) => { setSortBy(col); setSortOrder(dir); }}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                />
              )}

              {units?.total === 0 && !loading && (
                <div className="bg-card rounded-xl border border-card-border p-10 text-center">
                  <p className="text-muted-foreground text-sm">Belum ada data.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Import file Excel atau sinkronisasi dari Google Sheets.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {showChangePassword && (
        <ChangePasswordModal
          forceChange={false}
          onClose={() => setShowChangePassword(false)}
          onSuccess={async () => {
            await refreshUser();
            setShowChangePassword(false);
          }}
        />
      )}
    </div>
  );
}
