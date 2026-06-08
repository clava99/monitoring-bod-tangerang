import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Komponen crash:", error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center p-6"
          style={{ background: "hsl(var(--background))" }}
        >
          <div
            className="rounded-2xl border p-8 max-w-lg w-full text-center shadow-xl"
            style={{
              background: "hsl(var(--card))",
              borderColor: "hsl(var(--card-border))",
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "hsl(0 84% 60% / 0.12)" }}
            >
              <AlertTriangle className="w-8 h-8" style={{ color: "hsl(0 84% 60%)" }} />
            </div>

            <h2
              className="text-xl font-bold mb-2"
              style={{ color: "hsl(var(--foreground))" }}
            >
              Terjadi Kesalahan
            </h2>
            <p
              className="text-sm mb-4"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Halaman ini mengalami error yang tidak terduga. Silakan muat ulang atau kembali ke dashboard.
            </p>

            {this.state.error && (
              <div
                className="text-left rounded-lg px-4 py-3 mb-6 font-mono text-xs break-all leading-relaxed"
                style={{
                  background: "hsl(0 84% 60% / 0.08)",
                  color: "hsl(0 84% 55%)",
                  border: "1px solid hsl(0 84% 60% / 0.2)",
                }}
              >
                {this.state.error.message || "Unknown error"}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                style={{
                  background: "hsl(var(--muted))",
                  color: "hsl(var(--foreground))",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                <Home className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
                style={{
                  background: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                }}
              >
                <RefreshCw className="w-4 h-4" />
                Muat Ulang
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
