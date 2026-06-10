import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  LayoutDashboard, Upload, Table2, LogOut,
  Activity, Users, ChevronRight, Menu, X,
  FileText, ShieldAlert,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dasbor", icon: LayoutDashboard },
  { href: "/units", label: "Unit Data", icon: Table2 },
  { href: "/risk", label: "Analisis Risiko", icon: ShieldAlert },
  { href: "/executive", label: "Ringkasan Eksekutif", icon: FileText },
];

const managerItems = [
  { href: "/import", label: "Impor Data", icon: Upload },
];

const adminItems = [
  { href: "/users", label: "Manajemen Pengguna", icon: Users },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const isDark = theme === "dark";

  const sidebarStyle: React.CSSProperties = {
    background: isDark
      ? "rgba(8, 14, 30, 0.88)"
      : "rgba(255, 255, 255, 0.88)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderRight: isDark
      ? "1px solid rgba(255,255,255,0.06)"
      : "1px solid rgba(0,0,0,0.08)",
    boxShadow: isDark
      ? "4px 0 24px rgba(0,0,0,0.4)"
      : "4px 0 24px rgba(0,0,0,0.08)",
  };

  const titleColor = isDark ? "#f1f5f9" : "#1e293b";
  const subtitleColor = isDark ? "rgba(148,163,184,0.75)" : "rgba(100,116,139,0.75)";
  const sectionLabelColor = isDark ? "rgba(100,116,139,0.9)" : "rgba(148,163,184,0.9)";
  const dividerColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
  const userBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const usernameColor = isDark ? "#e2e8f0" : "#1e293b";
  const roleColor = isDark ? "rgba(148,163,184,0.7)" : "rgba(100,116,139,0.7)";
  const logoutColor = isDark ? "rgba(248,113,113,0.9)" : "rgba(220,38,38,0.85)";
  const toggleWrapBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const toggleWrapBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  const NavContent = () => (
    <>
      <div className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: `1px solid ${dividerColor}` }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "hsl(217 91% 60%)" }}>
          <Activity className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-none" style={{ color: titleColor }}>SIGMON</p>
          <p className="text-xs mt-0.5" style={{ color: subtitleColor }}>Pemantauan BOD</p>
        </div>
        <button onClick={() => setOpen(false)} className="lg:hidden opacity-60 hover:opacity-100 transition-opacity" style={{ color: titleColor }}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: sectionLabelColor }}>Menu</p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-link ${active ? "active" : ""}`}
              style={active ? {} : { color: isDark ? "rgba(203,213,225,0.7)" : "rgba(51,65,85,0.7)" }}
              onClick={() => setOpen(false)}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
              {active && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
            </Link>
          );
        })}

        {(user?.role === "admin" || user?.role === "super_admin" || user?.role === "manager") && (
          <>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider mt-5 mb-2" style={{ color: sectionLabelColor }}>Manajemen</p>
            {managerItems.map(({ href, label, icon: Icon }) => {
              const active = location.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`sidebar-link ${active ? "active" : ""}`}
                  style={active ? {} : { color: isDark ? "rgba(203,213,225,0.7)" : "rgba(51,65,85,0.7)" }}
                  onClick={() => setOpen(false)}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                  {active && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
                </Link>
              );
            })}
          </>
        )}

        {(user?.role === "admin" || user?.role === "super_admin") && (
          <>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider mt-5 mb-2" style={{ color: sectionLabelColor }}>Admin</p>
            {adminItems.map(({ href, label, icon: Icon }) => {
              const active = location.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`sidebar-link ${active ? "active" : ""}`}
                  style={active ? {} : { color: isDark ? "rgba(203,213,225,0.7)" : "rgba(51,65,85,0.7)" }}
                  onClick={() => setOpen(false)}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="px-3 py-4" style={{ borderTop: `1px solid ${dividerColor}` }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
          padding: "4px 6px",
          borderRadius: 10,
          background: toggleWrapBg,
          border: `1px solid ${toggleWrapBorder}`,
        }}>
          <ThemeToggle variant="sidebar" />
        </div>

        <div className="px-3 py-2 rounded-lg mb-2" style={{ background: userBg, border: `1px solid ${toggleWrapBorder}` }}>
          <p className="text-xs font-medium truncate" style={{ color: usernameColor }}>{user?.username}</p>
          <p className="text-xs capitalize mt-0.5" style={{ color: roleColor }}>{user?.role}</p>
        </div>
        <button
          onClick={logout}
          className="sidebar-link w-full text-left"
          style={{ color: logoutColor }}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Keluar</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="sidebar-toggle-btn lg:hidden print:hidden fixed top-3 left-3 z-50 w-10 h-10 flex items-center justify-center rounded-lg shadow-lg"
        style={{
          background: isDark ? "rgba(8,14,30,0.88)" : "rgba(255,255,255,0.88)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.1)",
          color: titleColor,
        }}
      >
        <Menu className="w-5 h-5" />
      </button>

      {open && (
        <div className="lg:hidden print:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      <aside
        className="hidden lg:flex print:hidden flex-col fixed inset-y-0 left-0 w-60 z-30"
        style={sidebarStyle}
      >
        <NavContent />
      </aside>

      <aside
        className={`lg:hidden print:hidden flex-col fixed inset-y-0 left-0 w-72 z-50 transform transition-transform duration-250 ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={sidebarStyle}
      >
        <NavContent />
      </aside>
    </>
  );
}
