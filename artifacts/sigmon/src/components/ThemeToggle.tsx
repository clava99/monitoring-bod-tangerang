import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";

export function ThemeToggle({ variant = "sidebar" }: { variant?: "sidebar" | "floating" }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div style={{ width: variant === "floating" ? 36 : 52, height: variant === "floating" ? 36 : 28 }} />;

  const isDark = theme === "dark";

  if (variant === "floating") {
    return (
      <button
        onClick={toggleTheme}
        aria-label="Toggle tema"
        title={isDark ? "Beralih ke mode terang" : "Beralih ke mode gelap"}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: isDark ? "1px solid rgba(99,102,241,0.35)" : "1px solid rgba(251,191,36,0.5)",
          background: isDark
            ? "linear-gradient(135deg, rgba(30,27,75,0.92) 0%, rgba(55,48,163,0.92) 100%)"
            : "linear-gradient(135deg, rgba(255,248,230,0.97) 0%, rgba(253,230,138,0.93) 100%)",
          backdropFilter: "blur(8px)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: isDark
            ? "0 2px 12px rgba(99,102,241,0.28), 0 1px 0 rgba(255,255,255,0.06) inset"
            : "0 2px 12px rgba(251,191,36,0.28), 0 1px 0 rgba(255,255,255,0.75) inset",
          transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          flexShrink: 0,
        }}
      >
        <span style={{
          display: "inline-block",
          fontSize: 16,
          transform: isDark ? "rotate(0deg) scale(1)" : "rotate(15deg) scale(1.15)",
          transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          lineHeight: 1,
        }}>
          {isDark ? "🌙" : "☀️"}
        </span>
      </button>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
      <span style={{
        fontSize: 12,
        lineHeight: 1,
        opacity: isDark ? 0.4 : 1,
        transition: "opacity 0.25s",
        userSelect: "none",
      }}>
        ☀️
      </span>

      <button
        onClick={toggleTheme}
        aria-label="Toggle tema"
        title={isDark ? "Beralih ke mode terang" : "Beralih ke mode gelap"}
        style={{
          position: "relative",
          width: 48,
          height: 26,
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
        {/* Stars — visible in dark mode */}
        {[
          { top: 5, left: 7, size: 1.5 },
          { top: 12, left: 12, size: 1 },
          { top: 7, left: 17, size: 1 },
        ].map((s, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              borderRadius: "50%",
              background: "white",
              opacity: isDark ? 0.75 : 0,
              transition: "opacity 0.3s",
              pointerEvents: "none",
            }}
          />
        ))}

        {/* Sliding knob */}
        <span style={{
          position: "absolute",
          top: 3,
          left: isDark ? 25 : 3,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: isDark
            ? "linear-gradient(145deg, #c7d2fe, #a5b4fc)"
            : "linear-gradient(145deg, #fffbeb, #fef3c7)",
          boxShadow: isDark
            ? "0 1px 4px rgba(0,0,0,0.45), 0 0 0 1px rgba(99,102,241,0.3)"
            : "0 1px 4px rgba(0,0,0,0.18), 0 0 0 1px rgba(251,191,36,0.45)",
          transition: "left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.35s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
        }}>
          <span style={{
            lineHeight: 1,
            transform: isDark ? "rotate(-20deg) scale(0.9)" : "rotate(0deg) scale(1)",
            transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}>
            {isDark ? "🌙" : "☀️"}
          </span>
        </span>
      </button>

      <span style={{
        fontSize: 12,
        lineHeight: 1,
        opacity: isDark ? 1 : 0.4,
        transition: "opacity 0.25s",
        userSelect: "none",
      }}>
        🌙
      </span>
    </div>
  );
}
