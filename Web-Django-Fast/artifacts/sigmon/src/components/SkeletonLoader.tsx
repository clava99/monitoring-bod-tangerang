export function SkeletonCard() {
  return (
    <div className="stat-card">
      <div className="skeleton h-3 w-24 mb-3" />
      <div className="skeleton h-7 w-36 mb-2" />
      <div className="skeleton h-3 w-20" />
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-card rounded-xl border border-card-border p-5 shadow-sm">
      <div className="skeleton h-4 w-32 mb-6" />
      <div className="space-y-3">
        {[80, 65, 55, 45, 35].map((w, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton h-3 w-24 shrink-0" />
            <div className={`skeleton h-6 rounded`} style={{ width: `${w}%` }} />
            <div className="skeleton h-3 w-14 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
      <div className="p-5 border-b border-card-border">
        <div className="skeleton h-4 w-32 mb-1" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3">
            <div className="skeleton h-3 w-8" />
            <div className="skeleton h-3 flex-1" />
            <div className="skeleton h-3 w-20" />
            <div className="skeleton h-3 w-20" />
            <div className="skeleton h-3 w-16" />
            <div className="skeleton h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SplashLoader() {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <p className="text-xl font-bold text-foreground">SIGMON</p>
          <p className="text-xs text-muted-foreground">Sistem Informasi Monitoring BOD</p>
        </div>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-primary"
            style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </div>
  );
}
