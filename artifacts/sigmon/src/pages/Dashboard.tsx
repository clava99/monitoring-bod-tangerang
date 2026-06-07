import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import SummaryCards from "@/components/SummaryCards";
import TopBottomChart from "@/components/TopBottomChart";
import UnitsTable from "@/components/UnitsTable";
import { SkeletonCard, SkeletonChart, SkeletonTable } from "@/components/SkeletonLoader";
import { RefreshCw, Download, Filter } from "lucide-react";

const METRICS = [
  { value: "lending", label: "Lending" },
  { value: "os_aktif", label: "OS Aktif" },
  { value: "noc", label: "NOC" },
  { value: "os_npl", label: "OS NPL" },
  { value: "pct_rr", label: "% RR" },
];

export default function Dashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [topBottom, setTopBottom] = useState<any>(null);
  const [units, setUnits] = useState<any>(null);
  const [filters, setFilters] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    try {
      const [s, tb, u, f] = await Promise.all([
        api.dashboard.summary(params),
        api.dashboard.topBottom({ ...params, metric, n: "5" }),
        api.units.list({ ...params, page: String(page), limit: "20", search, sort_by: sortBy, sort_order: sortOrder }),
        filters ? Promise.resolve(filters) : api.dashboard.filters(),
      ]);
      setSummary(s); setTopBottom(tb); setUnits(u);
      if (!filters) setFilters(f);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [region, area, period, metric, page, search, sortBy, sortOrder]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleExport = () => {
    const params: Record<string, string> = {};
    if (region) params.region = region;
    if (area) params.area = area;
    if (period) params.period = period;
    api.export.excel(params);
  };

  const selectClass = "border border-border rounded-lg px-2.5 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 w-full";

  return (
    <div className="bg-background min-h-screen">
      <Sidebar />

      <main className="lg:ml-60 min-h-screen pt-14 lg:pt-0 max-w-full overflow-x-hidden">

        {/* ── Sticky Header ── */}
        <div className="border-b border-border bg-card sticky top-0 z-10 px-4 sm:px-6 py-3 w-full overflow-hidden">

          {/* Title row */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 pl-1 lg:pl-0">
              <h1 className="text-sm sm:text-base font-semibold text-foreground truncate">
                Dashboard Monitoring BOD
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {summary?.period || "Semua Periode"} · Wilayah 1
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
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
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-primary
                  text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export Excel</span>
              </button>
            </div>
          </div>

          {/* ── Filter row: 2-col grid on mobile → inline on sm+ ── */}
          <div className="mt-3">
            {/* Mobile: 2-column grid */}
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
            {/* Tablet/Desktop: inline flex */}
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
              {summary && <SummaryCards summary={summary} />}

              {/* Charts — full width on mobile, side-by-side on lg+ */}
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
    </div>
  );
}
