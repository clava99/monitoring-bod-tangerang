import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Loader2 } from "lucide-react";

/* ── Minimal 3D canvas animation ── */
function AnimatedCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Floating particles
    const particles = Array.from({ length: 28 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 1 + Math.random() * 2,
      speed: 0.00015 + Math.random() * 0.0002,
      angle: Math.random() * Math.PI * 2,
      drift: (Math.random() - 0.5) * 0.0003,
    }));

    // Grid lines (perspective floor)
    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Perspective grid
      const gridColor = "rgba(99,130,255,0.10)";
      const horizon = H * 0.62;
      const vp = { x: W / 2, y: horizon };
      const cols = 10;
      const rows = 10;
      const spread = W * 1.1;
      const base = H;

      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.8;

      // Vertical lines (perspective)
      for (let i = 0; i <= cols; i++) {
        const bx = (W / 2 - spread / 2) + (spread / cols) * i;
        ctx.beginPath();
        ctx.moveTo(vp.x, vp.y);
        ctx.lineTo(bx, base + 40);
        ctx.stroke();
      }

      // Horizontal lines (scroll animation)
      const scrollOffset = (t * 30) % (( base - horizon) / rows);
      for (let j = 0; j <= rows; j++) {
        const prog = j / rows;
        const rawY = horizon + (base - horizon) * prog + scrollOffset;
        if (rawY > base + 10 || rawY < horizon) continue;
        const normP = (rawY - horizon) / (base - horizon);
        const lx = vp.x - (spread / 2) * normP;
        const rx = vp.x + (spread / 2) * normP;
        ctx.beginPath();
        ctx.moveTo(lx, rawY);
        ctx.lineTo(rx, rawY);
        ctx.stroke();
      }

      // Glow at horizon
      const grad = ctx.createRadialGradient(W / 2, horizon, 0, W / 2, horizon, W * 0.45);
      grad.addColorStop(0, "rgba(59,130,246,0.09)");
      grad.addColorStop(1, "rgba(59,130,246,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, horizon - 60, W, 140);

      // Floating dots
      particles.forEach((p) => {
        p.angle += p.drift;
        p.x += Math.cos(p.angle) * p.speed;
        p.y -= p.speed * 0.6;
        if (p.y < -0.02) p.y = 1.02;
        if (p.x < -0.02) p.x = 1.02;
        if (p.x > 1.02) p.x = -0.02;

        const px = p.x * W;
        const py = p.y * H;
        const alpha = 0.25 + 0.2 * Math.sin(t * 1.2 + p.angle);
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147,197,253,${alpha})`;
        ctx.fill();
      });

      t += 0.008;
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}

/* ── Animated SIGMON logo icon ── */
function LogoIcon({ size = 36 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.278,
        background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 14px rgba(37,99,235,0.40)",
        flexShrink: 0,
        animation: "logoPulse 3s ease-in-out infinite",
      }}
    >
      <svg
        width={size * 0.52}
        height={size * 0.52}
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ animation: "lineTrace 3s ease-in-out infinite" }}
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    </div>
  );
}

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
    <>
      <style>{`
        @keyframes logoPulse {
          0%, 100% { box-shadow: 0 4px 14px rgba(37,99,235,0.40); }
          50%       { box-shadow: 0 4px 22px rgba(37,99,235,0.65); }
        }
        @keyframes lineTrace {
          0%, 100% { opacity: 1; stroke-dashoffset: 0; }
          50%       { opacity: 0.75; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .login-form-wrap {
          animation: fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both;
        }
        .btn-primary {
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%);
          box-shadow: 0 4px 16px rgba(37,99,235,0.35), 0 1px 0 rgba(255,255,255,0.12) inset;
          transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(37,99,235,0.45);
          filter: brightness(1.07);
        }
        .btn-primary:active:not(:disabled) {
          transform: translateY(1px);
          box-shadow: 0 2px 8px rgba(37,99,235,0.30);
        }
        .field-input {
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .field-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.13);
        }
      `}</style>

      <div className="min-h-screen flex" style={{ background: "hsl(210 20% 98%)" }}>

        {/* ── Left panel ── */}
        <div
          className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
          style={{ background: "hsl(222 47% 11%)", position: "relative", overflow: "hidden" }}
        >
          <AnimatedCanvas />

          {/* Brand */}
          <div className="flex items-center gap-3" style={{ position: "relative", zIndex: 1 }}>
            <LogoIcon size={36} />
            <span style={{ color: "white", fontWeight: 700, fontSize: 18, letterSpacing: 2 }}>
              SIGMON
            </span>
          </div>

          {/* Hero copy */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <h1 style={{ fontSize: 36, fontWeight: 700, color: "white", lineHeight: 1.25, marginBottom: 16 }}>
              Sistem Informasi<br />Monitoring BOD
            </h1>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: "hsl(215 20% 55%)" }}>
              Dashboard interaktif untuk memantau performa unit, analisis lending,
              dan pengelolaan data BOD Cabang Tangerang secara terpusat.
            </p>
            <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "81 Unit", sub: "Wilayah Tangerang" },
                { label: "Real-time", sub: "Sinkronisasi data" },
                { label: "Top 5 / Bottom 5", sub: "Analisis performa" },
                { label: "Export Excel", sub: "Laporan instan" },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    borderRadius: 12,
                    padding: "14px 16px",
                    background: "hsl(222 47% 14%)",
                    border: "1px solid rgba(59,130,246,0.12)",
                  }}
                >
                  <p style={{ color: "white", fontWeight: 600, fontSize: 13 }}>{item.label}</p>
                  <p style={{ color: "hsl(215 20% 50%)", fontSize: 12, marginTop: 2 }}>{item.sub}</p>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: 12, color: "hsl(215 20% 40%)", position: "relative", zIndex: 1 }}>
            © 2026 SIGMON — Cabang Tangerang
          </p>
        </div>

        {/* ── Right panel ── */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="login-form-wrap w-full" style={{ maxWidth: 360 }}>

            {/* Mobile brand */}
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <LogoIcon size={32} />
              <span style={{ fontWeight: 700, fontSize: 17, color: "hsl(222 47% 11%)", letterSpacing: 1.5 }}>
                SIGMON
              </span>
            </div>

            <h2 style={{ fontSize: 24, fontWeight: 700, color: "hsl(222 47% 11%)", marginBottom: 4 }}>
              Masuk
            </h2>
            <p style={{ fontSize: 13.5, color: "hsl(215 16% 47%)", marginBottom: 28 }}>
              Masukkan kredensial Anda untuk mengakses dashboard
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Username */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "hsl(222 47% 22%)", marginBottom: 6 }}>
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  required
                  className="field-input"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    fontSize: 14,
                    border: "1px solid hsl(214 32% 88%)",
                    borderRadius: 10,
                    background: "hsl(210 40% 98%)",
                    color: "hsl(222 47% 11%)",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Password */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "hsl(222 47% 22%)", marginBottom: 6 }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    required
                    className="field-input"
                    style={{
                      width: "100%",
                      padding: "10px 40px 10px 14px",
                      fontSize: 14,
                      border: "1px solid hsl(214 32% 88%)",
                      borderRadius: 10,
                      background: "hsl(210 40% 98%)",
                      color: "hsl(222 47% 11%)",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "hsl(215 16% 60%)",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                }}>
                  <p style={{ fontSize: 12, color: "#dc2626" }}>{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  width: "100%",
                  padding: "11px 16px",
                  borderRadius: 10,
                  border: "none",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 4,
                }}
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                {loading ? "Memproses..." : "Masuk"}
              </button>
            </form>
          </div>
        </div>

      </div>
    </>
  );
}