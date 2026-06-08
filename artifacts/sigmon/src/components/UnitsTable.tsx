import { useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Unit {
  id: number;
  unit: string;
  region?: string;
  area?: string;
  noc?: number;
  os_aktif?: number;
  lending?: number;
  os_npl?: number;
  pct_rr?: number;
}

interface Props {
  data: Unit[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onSearch: (s: string) => void;
  onSort: (col: string, dir: "asc" | "desc") => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

function fmt(v?: number, decimals = 1) {
  if (v == null) return "—";
  return v.toLocaleString("id-ID", { maximumFractionDigits: decimals });
}

function pctColor(v?: number) {
  if (v == null) return "";
  if (v >= 95) return "text-emerald-600 font-semibold";
  if (v >= 85) return "text-amber-600";
  return "text-red-500";
}

const COLS = [
  { key: "unit", label: "Unit" },
  { key: "region", label: "Region" },
  { key: "area", label: "Area" },
  { key: "noc", label: "NOC" },
  { key: "os_aktif", label: "OS Aktif" },
  { key: "lending", label: "Lending" },
  { key: "os_npl", label: "OS NPL" },
  { key: "pct_rr", label: "% RR" },
];

function SortIcon({ col, sortBy, sortOrder }: { col: string; sortBy?: string; sortOrder?: string }) {
  if (sortBy !== col) return <ChevronsUpDown className="w-3 h-3 text-muted-foreground/50" />;
  return sortOrder === "asc"
    ? <ChevronUp className="w-3 h-3 text-primary" />
    : <ChevronDown className="w-3 h-3 text-primary" />;
}

export default function UnitsTable({
  data, total, page, totalPages, onPageChange, onSearch, onSort, sortBy, sortOrder
}: Props) {
  const [search, setSearch] = useState("");

  const handleSearch = (v: string) => { setSearch(v); onSearch(v); };

  const handleSort = (col: string) => {
    if (sortBy === col) onSort(col, sortOrder === "asc" ? "desc" : "asc");
    else onSort(col, "asc");
  };

  return (
    <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 sm:px-5 py-3 border-b border-card-border">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Detail Seluruh Unit</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{total} unit ditemukan</p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="search"
            placeholder="Cari unit..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-background
              focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full sm:w-44"
          />
        </div>
      </div>

      {/* Table — scrollable */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[540px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-2.5 text-left text-muted-foreground font-medium w-7">#</th>
              {COLS.map(col => (
                <th key={col.key}
                  className="px-3 py-2.5 text-left font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground whitespace-nowrap"
                  onClick={() => handleSort(col.key)}>
                  <span className="flex items-center gap-1">
                    {col.label}
                    <SortIcon col={col.key} sortBy={sortBy} sortOrder={sortOrder} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row, i) => (
              <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2.5 text-muted-foreground">{(page - 1) * 20 + i + 1}</td>
                <td className="px-3 py-2.5 font-medium text-foreground max-w-[140px]">
                  <span className="truncate block" title={row.unit}>
                    {row.unit.replace(/^M\.[A-Z0-9]+- /, "")}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{row.region || "—"}</td>
                <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{row.area || "—"}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{fmt(row.noc, 0)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{fmt(row.os_aktif)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{fmt(row.lending)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-red-500">{fmt(row.os_npl)}</td>
                <td className={`px-3 py-2.5 text-right tabular-nums ${pctColor(row.pct_rr != null ? row.pct_rr * 100 : undefined)}`}>
                  {row.pct_rr != null ? `${(row.pct_rr * 100).toFixed(1)}%` : "—"}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-muted-foreground">
                  Tidak ada data ditemukan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 border-t border-border">
        <p className="text-xs text-muted-foreground">Hal. {page}/{totalPages}</p>
        <div className="flex items-center gap-1">
          <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
            className="w-7 h-7 flex items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
            return (
              <button key={p} onClick={() => onPageChange(p)}
                className={`w-7 h-7 flex items-center justify-center rounded border text-xs font-medium
                  ${p === page ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
                {p}
              </button>
            );
          })}
          <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
            className="w-7 h-7 flex items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
