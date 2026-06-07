import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Loader2 } from "lucide-react";

function SigmonAnimation() {
  const canvasRef = useRef<SVGSVGElement>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 50);
    return () => clearInterval(id);
  }, []);

  const points = [0,110, 30,90, 60,95, 90,70, 120,75, 150,55, 180,60, 210,40, 240,45, 270,30, 308,25];
  const points2 = [0,130, 30,120, 60,125, 90,110, 120,115, 150,100, 180,108, 210,95, 240,100, 270,88, 308,85];
  const offset = Math.sin(tick * 0.05) * 4;

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:0, padding:"1.5rem 1rem 1rem" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
        <div style={{ width:38, height:38, borderRadius:10, background:"#1e3a5f", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <polyline points="2,16 7,9 11,13 15,6 20,10" stroke="#4ecba0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="20" cy="10" r="2" fill="#4ecba0"/>
          </svg>
        </div>
        <span style={{ fontSize:20, fontWeight:500, letterSpacing:"0.06em", color:"var(--color-text-primary)" }}>SIGMON</span>
      </div>

      <p style={{ fontSize:11, color:"var(--color-text-secondary)", marginBottom:12 }}>
        Sistem Informasi Monitoring BOD — Cabang Tangerang
      </p>

      <div style={{ width:300, height:200, borderRadius:12, background:"hsl(222,47%,10%)", border:"1.5px solid hsl(222,30%,22%)", overflow:"hidden", position:"relative" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:30, borderBottom:"1px solid hsl(222,30%,18%)", display:"flex", alignItems:"center", padding:"0 12px", gap:6 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:"#e05a5a" }}/>
          <div style={{ width:6, height:6, borderRadius:"50%", background:"#e0a85a" }}/>
          <div style={{ width:6, height:6, borderRadius:"50%", background:"#4ecba0" }}/>
          <span style={{ fontSize:9, color:"hsl(215,20%,50%)", marginLeft:4, letterSpacing:"0.08em", fontFamily:"monospace" }}>SIGMON DASHBOARD</span>
          <span style={{ marginLeft:"auto", fontSize:9, color:"#4ecba0", fontFamily:"monospace", opacity: tick % 20 < 10 ? 1 : 0.2, transition:"opacity 0.1s" }}>● LIVE</span>
        </div>

        <svg ref={canvasRef} style={{ position:"absolute", top:34, left:10, width:280, height:128 }} viewBox="0 0 280 128">
          {[30,60,90,120].map(y => (
            <line key={y} x1="0" y1={y} x2="280" y2={y} stroke="hsl(222,30%,18%)" strokeWidth="0.5"/>
          ))}
          <polyline
            points={points.map((v,i) => i%2===0 ? v : v+offset).join(" ")}
            fill="none" stroke="#4ecba0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline
            points={points2.map((v,i) => i%2===0 ? v : v-offset*0.6).join(" ")}
            fill="none" stroke="#378add" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="280" cy={25+offset} r="4" fill="#4ecba0"/>
          <circle cx="280" cy={85-offset*0.6} r="4" fill="#378add"/>
          <text x="4" y="24" fontSize="9" fill="#4ecba0" fontFamily="monospace">NOC</text>
          <text x="4" y="82" fontSize="9" fill="#378add" fontFamily="monospace">OS</text>
        </svg>

        <div style={{ position:"absolute", bottom:8, left:12, right:12, display:"flex", justifyContent:"space-between" }}>
          {[["81","Unit"],["94.4%","RR"],["23","Area"],["12","Par"]].map(([v,l],i) => (
            <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:1 }}>
              <span style={{ fontSize:10, fontWeight:500, color: i===1?"#4ecba0":i===3?"#e05a5a":"#4ecba0", fontFamily:"monospace" }}>{v}</span>
              <span style={{ fontSize:8, color:"hsl(215,20%,45%)" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", gap:8, marginTop:10 }}>
        {[
          { val:"81", lbl:"Unit aktif", color:"#4ecba0" },
          { val:"Top 5", lbl:"Performa", color:"#378add" },
          { val:"Excel", lbl:"Export", color:"#e0a85a" },
        ].map((c,i) => (
          <div key={i} style={{ background:"hsl(222,47%,13%)", border:"0.5px solid hsl(222,30%,22%)", borderRadius:8, padding:"7px 12px", textAlign:"center", minWidth:76, transform:`translateY(${Math.sin(tick*0.04 + i*1.8)*4}px)`, transition:"transform 0.05s" }}>
            <div style={{ fontSize:13, fontWeight:500, color:c.color }}>{c.val}</div>
            <div style={{ fontSize:9, color:"hsl(215,20%,50%)", marginTop:2 }}>{c.lbl}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop:10, fontSize:10, color:"#4ecba0", display:"flex", alignItems:"center", gap:5 }}>
        <span style={{ width:6, height:6, borderRadius:"50%", background:"#4ecba0", display:"inline-block", opacity: tick%20<10?1:0.3, transition:"opacity 0.1s" }}/>
        Terhubung ke Neon PostgreSQL
      </div>
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
    <div className="min-h-screen flex" style={{ background:"hsl(210 20% 98%)" }}>
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12" style={{ background:"hsl(222 47% 11%)" }}>
        <SigmonAnimation />
        <p className="text-xs" style={{ color:"hsl(215 20% 40%)" }}>© 2026 SIGMON — Cabang Tangerang</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <SigmonAnimation />
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">Masuk</h2>
          <p className="text-sm text-muted-foreground mb-8">
            Masukkan kredensial Anda untuk mengakses dashboard
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Masukkan username"
                required
                className="w-full px-3.5 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  className="w-full px-3.5 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors pr-10"
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
              className="w-full py-2.5 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}            <div>
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
