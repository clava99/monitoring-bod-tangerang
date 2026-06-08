import { useState } from "react";
import { AlertTriangle, XCircle, ChevronDown, ChevronUp, AlertCircle, ExternalLink } from "lucide-react";
import { Link } from "wouter";

interface AlertUnit {
  id: number;
  unit: string;
  region?: string;
  area?: string;
  period?: string;
  pct_rr?: number;
  pct_os_npl?: number;
  pct_noc?: number;
  pct_os?: number;
  pct_lending?: number;
  issues: string[];
  severity: string;
}

interface Props {
  alerts: AlertUnit[];
}

function Badge({ severity }: { severity: string }) {
  if (severity === "critical") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 uppercase tracking-wide">
        <XCircle className="w-2.5 h-2.5" />
        <span>Kritis</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 uppercase tracking-wide">
      <AlertCircle className="w-2.5 h-2.5" />
      <span>Perhatian</span>
    </span>
  );
}

export default function AlertPanel({ alerts }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);

  if (!alerts || alerts.length === 0) return null;

  const critical = alerts.filter(a => a.severity === "critical");
  const warning = alerts.filter(a => a.severity === "warning");
  const displayed = showAll ? alerts : alerts.slice(0, 6);

  return (
    <div className="bg-card rounded-xl border border-red-200 dark:border-red-900/50 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-500/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Unit Bermasalah</h3>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-red-500 text-white tabular-nums">
                {alerts.length}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              <span>{critical.length} kritis</span>
              <span> · </span>
              <span>{warning.length} perlu perhatian</span>
            </p>
          </div>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground" />
        }
      </button>

      {expanded && (
        <>
          <div className="border-t border-border">
            <div className="divide-y divide-border">
              {displayed.map(unit => (
                <div
                  key={unit.id}
                  className={`flex items-start gap-3 px-4 sm:px-5 py-3 hover:bg-muted/20 transition-colors ${
                    unit.severity === "critical" ? "border-l-2 border-red-500" : "border-l-2 border-amber-400"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge severity={unit.severity} />
                      <span className="text-xs font-semibold text-foreground truncate">
                        {(unit.unit ?? "").replace(/^M\.[A-Z0-9]+- /, "")}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {[unit.region, unit.area, unit.period].filter(Boolean).join(" · ")}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {unit.issues.map((issue, i) => (
                        <span
                          key={i}
                          className="inline-block px-1.5 py-0.5 rounded text-[9px] bg-muted text-muted-foreground font-medium"
                        >
                          {issue}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Link
                    href={`/units/${unit.id}`}
                    className="shrink-0 mt-0.5 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {alerts.length > 6 && (
            <div className="border-t border-border px-4 sm:px-5 py-2.5 flex justify-center">
              <button
                onClick={() => setShowAll(v => !v)}
                className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    <span>Tampilkan lebih sedikit</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    <span>Tampilkan {alerts.length - 6} unit lainnya</span>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
