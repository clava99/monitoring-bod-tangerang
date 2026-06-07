import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Activity, Eye, EyeOff, Loader2 } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Login gagal. Periksa username dan password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(210 20% 98%)" }}>
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: "hsl(222 47% 11%)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg">SIGMON</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Sistem Informasi<br />Monitoring BOD
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "hsl(215 20% 55%)" }}>
            Dashboard interaktif untuk memantau performa unit, analisis lending,
            dan pengelolaan data BOD Cabang Tangerang secara terpusat.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { label: "81 Unit", sub: "Wilayah Tangerang" },
              { label: "Real-time", sub: "Sinkronisasi data" },
              { label: "Top 5 / Bottom 5", sub: "Analisis performa" },
              { label: "Export Excel", sub: "Laporan instan" },
            ].map((item, i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: "hsl(222 47% 14%)" }}>
                <p className="text-white font-semibold text-sm">{item.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "hsl(215 20% 50%)" }}>{item.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: "hsl(215 20% 40%)" }}>
          © 2026 SIGMON — Cabang Tangerang
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-foreground">SIGMON</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">Masuk</h2>
          <p className="text-sm text-muted-foreground mb-8">
            Masukkan kredensial Anda untuk mengakses dashboard
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Masukkan username"
                required
                className="w-full px-3.5 py-2.5 text-sm border border-border rounded-lg bg-background
                  focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  className="w-full px-3.5 py-2.5 text-sm border border-border rounded-lg bg-background
                    focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors pr-10"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-100">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 px-4 bg-primary text-primary-foreground text-sm font-semibold
                rounded-lg hover:opacity-90 active:scale-[0.99] transition-all
                disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <div className="mt-8 p-4 rounded-xl border border-border bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground mb-2">Akun default:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <span className="text-muted-foreground">Username</span>
              <span className="font-mono font-medium text-foreground">admin</span>
              <span className="text-muted-foreground">Password</span>
              <span className="font-mono font-medium text-foreground">admin123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
