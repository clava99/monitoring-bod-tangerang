import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";

type Variant = "sidebar" | "floating" | "header";

export function ThemeToggle({ variant = "sidebar" }: { variant?: Variant }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div style={{ width: 36, height: 32 }} />;

  const isDark = theme === "dark";

  /* ── Header variant: icon button di topbar ── */
  if (variant === "header") {
    return (
      <button
        onClick={toggleTheme}
        aria-label="Toggle tema"
        title={isDark ? "Mode Terang" : "Mode Gelap"}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 10px",
          borderRadius: 8,
          border: `1px solid ${isDark ? "rgba(99,102,241,0.3)" : "hsl(214 32% 91%)"}`,
          background: isDark ? "rgba(30,27,75,0.6)" : "hsl(210 40% 98%)",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 500,
          color: isDark ? "#a5b4fc" : "#6b7280",
          transition: "all 0.2s ease",
          flexShrink: 0,
          backdropFilter: "blur(4px)",
          boxShadow: isDark
            ? "0 1px 4px rgba(99,102,241,0.15)"
            : "0 1px 3px rgba(0,0,0,0.06)",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.04)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        }}
      >
        {/* Pill toggle kecil */}
        <span style={{
          position: "relative",
          display: "inline-flex",
          width: 32,
          height: 18,
          borderRadius: 9,
          background: isDark
            ? "linear-gradient(135deg, #1e1b4b, #3730a3)"
            : "linear-gradient(135deg, #f59e0b, #fbbf24)",
          boxShadow: isDark
            ? "0 0 0 1px rgba(99,102,241,0.4)"
            : "0 0 0 1px rgba(245,158,11,0.5)",
          transition: "background 0.3s",
          flexShrink: 0,
        }}>
          {/* stars */}
          {isDark && [
            { top: 3, left: 5 },
            { top: 8, left: 9 },
          ].map((s, i) => (
            <span key={i} style={{
              position: "absolute", top: s.top, left: s.left,
              width: 1.5, height: 1.5, borderRadius: "50%",
              background: "white", opacity: 0.8,
            }} />
          ))}
          {/* knob */}
          <span style={{
            position: "absolute",
            top: 2,
            left: isDark ? 14 : 2,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: isDark
              ? "linear-gradient(145deg, #c7d2fe, #a5b4fc)"
              : "linear-gradient(145deg, #fffbeb, #fef3c7)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            transition: "left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 8, lineHeight: 1,
          }}>
            {isDark ? "🌙" : "☀️"}
          </span>
        </span>
        <span className="hidden sm:inline">
          {isDark ? "Gelap" : "Terang"}
        </span>
      </button>
    );
  }

  /* ── Floating variant: tombol bulat di login page ── */
  if (variant === "floating") {
    return (
      <button
        onClick={toggleTheme}
        aria-label="Toggle tema"
        title={isDark ? "Mode Terang" : "Mode Gelap"}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "7px 13px",
          borderRadius: 20,
          border: isDark ? "1px solid rgba(99,102,241,0.35)" : "1px solid rgba(214,211,203,0.8)",
          background: isDark
            ? "linear-gradient(135deg, rgba(30,27,75,0.9), rgba(55,48,163,0.85))"
            : "rgba(255,255,255,0.92)",
          backdropFilter: "blur(10px)",
          cursor: "pointer",
          boxShadow: isDark
            ? "0 4px 16px rgba(99,102,241,0.2)"
            : "0 4px 16px rgba(0,0,0,0.1)",
          transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          flexShrink: 0,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px) scale(1.03)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0) scale(1)";
        }}
      >
        {/* Pill toggle */}
        <span style={{
          position: "relative",
          display: "inline-flex",
          width: 36,
          height: 20,
          borderRadius: 10,
          background: isDark
            ? "linear-gradient(135deg, #1e1b4b, #3730a3)"
            : "linear-gradient(135deg, #f59e0b, #fbbf24)",
          boxShadow: isDark
            ? "0 0 0 1px rgba(99,102,241,0.45)"
            : "0 0 0 1px rgba(245,158,11,0.55)",
          transition: "background 0.35s",
          flexShrink: 0,
        }}>
          {isDark && [{ top: 4, left: 6 }, { top: 10, left: 10 }].map((s, i) => (
            <span key={i} style={{
              position: "absolute", top: s.top, left: s.left,
              width: 1.5, height: 1.5, borderRadius: "50%",
              background: "white", opacity: 0.85,
            }} />
          ))}
          <span style={{
            position: "absolute",
            top: 2, left: isDark ? 16 : 2,
            width: 16, height: 16,
            borderRadius: "50%",
            background: isDark
              ? "linear-gradient(145deg, #c7d2fe, #a5b4fc)"
              : "linear-gradient(145deg, #fffbeb, #fef3c7)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            transition: "left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, lineHeight: 1,
          }}>
            {isDark ? "🌙" : "☀️"}
          </span>
        </span>
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          color: isDark ? "#a5b4fc" : "#374151",
          letterSpacing: "0.01em",
          whiteSpace: "nowrap",
        }}>
          {isDark ? "Mode Gelap" : "Mode Terang"}
        </span>
      </button>
    );
  }

  /* ── Sidebar variant: pill toggle di sidebar ── */
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 0" }}>
      <span style={{
        fontSize: 13, lineHeight: 1,
        opacity: isDark ? 0.35 : 1,
        transition: "opacity 0.25s",
        userSelect: "none",
      }}>☀️</span>

      <button
        onClick={toggleTheme}
        aria-label="Toggle tema"
        title={isDark ? "Mode Terang" : "Mode Gelap"}
        style={{
          position: "relative",
          width: 48, height: 26,
          borderRadius: 13,
          border: "none",
          cursor: "pointer",
          padding: 0,
          flexShrink: 0,
          background: isDark
            ? "linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%)"
            : "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
          boxShadow: isDark
            ? "0 0 0 1px rgba(99,102,241,0.45), 0 2px 8px rgba(55,48,163,0.45), inset 0 1px 0 rgba(255,255,255,0.07)"
            : "0 0 0 1px rgba(245,158,11,0.6), 0 2px 8px rgba(245,158,11,0.32), inset 0 1px 0 rgba(255,255,255,0.45)",
          transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {[{ top: 5, left: 7, size: 1.5 }, { top: 12, left: 12, size: 1 }, { top: 7, left: 17, size: 1 }].map((s, i) => (
          <span key={i} style={{
            position: "absolute", top: s.top, left: s.left,
            width: s.size, height: s.size, borderRadius: "50%",
            background: "white",
            opacity: isDark ? 0.75 : 0,
            transition: "opacity 0.3s",
            pointerEvents: "none",
          }} />
        ))}
        <span style={{
          position: "absolute",
          top: 3, left: isDark ? 25 : 3,
          width: 20, height: 20,
          borderRadius: "50%",
          background: isDark
            ? "linear-gradient(145deg, #c7d2fe, #a5b4fc)"
            : "linear-gradient(145deg, #fffbeb, #fef3c7)",
          boxShadow: isDark
            ? "0 1px 4px rgba(0,0,0,0.45), 0 0 0 1px rgba(99,102,241,0.3)"
            : "0 1px 4px rgba(0,0,0,0.18), 0 0 0 1px rgba(251,191,36,0.45)",
          transition: "left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.35s",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, lineHeight: 1,
        }}>
          <span style={{
            transform: isDark ? "rotate(-20deg) scale(0.9)" : "rotate(0deg) scale(1)",
            transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}>
            {isDark ? "🌙" : "☀️"}
          </span>
        </span>
      </button>

      <span style={{
        fontSize: 13, lineHeight: 1,
        opacity: isDark ? 1 : 0.35,
        transition: "opacity 0.25s",
        userSelect: "none",
      }}>🌙</span>
    </div>
  );
}
