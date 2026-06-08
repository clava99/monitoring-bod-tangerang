import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  LayoutDashboard, Upload, Table2, LogOut,
  Activity, Users, ChevronRight, Menu, X
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/units", label: "Data Unit", icon: Table2 },
  { href: "/import", label: "Import Data", icon: Upload },
];

const adminItems = [
  { href: "/users", label: "Manajemen User", icon: Users },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const NavContent = () => (
    <>
      <div className="px-5 py-5 border-b flex items-center gap-3" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "hsl(217 91% 60%)" }}>
          <Activity className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm leading-none">SIGMON</p>
          <p className="text-xs mt-0.5" style={{ color: "hsl(215 20% 55%)" }}>Monitoring BOD</p>
        </div>
        <button onClick={() => setOpen(false)} className="lg:hidden text-white opacity-60 hover:opacity-100">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: "hsl(215 20% 45%)" }}>Menu</p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link key={href} href={href}>
              <a className={`sidebar-link ${active ? "active" : ""}`} onClick={() => setOpen(false)}>
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
                {active && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
              </a>
            </Link>
          );
        })}

        {(user?.role === "admin" || user?.role === "super_admin") && (
          <>
            <p className="px-3 text-xs font-semibold uppercase tracking-wider mt-5 mb-2"
              style={{ color: "hsl(215 20% 45%)" }}>Admin</p>
            {adminItems.map(({ href, label, icon: Icon }) => {
              const active = location.startsWith(href);
              return (
                <Link key={href} href={href}>
                  <a className={`sidebar-link ${active ? "active" : ""}`} onClick={() => setOpen(false)}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{label}</span>
                  </a>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="px-3 py-4 border-t" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        {/* Theme Toggle */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
          padding: "4px 6px",
          borderRadius: 10,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <ThemeToggle variant="sidebar" />
        </div>

        <div className="px-3 py-2 rounded-lg mb-2" style={{ background: "hsl(var(--sidebar-accent))" }}>
          <p className="text-xs font-medium text-white truncate">{user?.username}</p>
          <p className="text-xs capitalize mt-0.5" style={{ color: "hsl(215 20% 50%)" }}>{user?.role}</p>
        </div>
        <button onClick={logout} className="sidebar-link w-full text-left"
          style={{ color: "hsl(0 84% 65%)" }}>
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Keluar</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Hamburger button — mobile only */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 w-10 h-10 flex items-center justify-center rounded-lg shadow-lg"
        style={{ background: "hsl(var(--sidebar))" }}>
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* Overlay — mobile */}
      {open && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setOpen(false)} />
      )}

      {/* Desktop sidebar — always visible */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-60 z-30"
        style={{ background: "hsl(var(--sidebar))" }}>
        <NavContent />
      </aside>

      {/* Mobile sidebar — slide in/out */}
      <aside
        className={`lg:hidden flex flex-col fixed inset-y-0 left-0 w-72 z-50 transform transition-transform duration-250 ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "hsl(var(--sidebar))" }}>
        <NavContent />
      </aside>
    </>
  );
}
