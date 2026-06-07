import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import {
  UserPlus, Trash2, Loader2, ShieldCheck, Shield, User as UserIcon,
  X, Eye, EyeOff, CheckCircle2, XCircle
} from "lucide-react";

const ROLES = [
  { value: "admin", label: "Admin", desc: "Akses penuh termasuk manajemen user", icon: ShieldCheck, color: "text-blue-600 bg-blue-50" },
  { value: "manager", label: "Manager", desc: "Import data & lihat dashboard", icon: Shield, color: "text-emerald-600 bg-emerald-50" },
  { value: "staff", label: "Staff", desc: "Hanya lihat dashboard", icon: UserIcon, color: "text-slate-600 bg-slate-100" },
];

function RoleBadge({ role }: { role: string }) {
  const r = ROLES.find(x => x.value === role);
  if (!r) return <span className="text-xs text-muted-foreground">{role}</span>;
  const Icon = r.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${r.color}`}>
      <Icon className="w-3 h-3" />
      {r.label}
    </span>
  );
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [form, setForm] = useState({ username: "", email: "", password: "", role: "staff" });
  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try { setUsers(await api.auth.listUsers()); } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.auth.createUser(form);
      showToast("success", `User "${form.username}" berhasil dibuat`);
      setForm({ username: "", email: "", password: "", role: "staff" });
      setShowForm(false);
      fetchUsers();
    } catch (err: any) {
      showToast("error", err.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id: number, username: string) => {
    if (id === currentUser?.id) {
      showToast("error", "Tidak dapat menghapus akun yang sedang digunakan");
      return;
    }
    if (!confirm(`Hapus user "${username}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    setDeletingId(id);
    try {
      await api.auth.deleteUser(id);
      showToast("success", `User "${username}" berhasil dihapus`);
      fetchUsers();
    } catch (err: any) {
      showToast("error", err.message);
    }
    setDeletingId(null);
  };

  return (
    <div className="bg-background min-h-screen">
      <Sidebar />
      <main className="lg:ml-60 min-h-screen pt-14 lg:pt-0 max-w-full overflow-x-hidden">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium
            ${toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-700"}`}>
            {toast.type === "success"
              ? <CheckCircle2 className="w-4 h-4 shrink-0" />
              : <XCircle className="w-4 h-4 shrink-0" />}
            {toast.msg}
          </div>
        )}

        <div className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-semibold text-foreground">Manajemen User</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Kelola akun dan hak akses pengguna SIGMON
              </p>
            </div>
            <button onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:opacity-90 transition-opacity">
              {showForm ? <X className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              {showForm ? "Tutup" : "Tambah User"}
            </button>
          </div>
        </div>

        <div className="p-6 max-w-3xl space-y-5">
          {/* Role info */}
          <div className="grid grid-cols-3 gap-3">
            {ROLES.map(r => {
              const Icon = r.icon;
              return (
                <div key={r.value} className="bg-card rounded-xl border border-card-border p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${r.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{r.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{r.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Create form */}
          {showForm && (
            <div className="bg-card rounded-xl border border-card-border shadow-sm p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Tambah User Baru</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input type="text" value={form.username} onChange={e => setF("username", e.target.value)}
                      placeholder="username" required
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input type="email" value={form.email} onChange={e => setF("email", e.target.value)}
                      placeholder="email@domain.com" required
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input type={showPw ? "text" : "password"} value={form.password}
                        onChange={e => setF("password", e.target.value)}
                        placeholder="Minimal 6 karakter" required minLength={6}
                        className="w-full px-3 py-2 pr-9 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">Role</label>
                    <select value={form.role} onChange={e => setF("role", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-60">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                    {saving ? "Menyimpan..." : "Buat User"}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors">
                    Batal
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Users list */}
          <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-card-border">
              <h3 className="text-sm font-semibold text-foreground">
                Daftar User <span className="text-muted-foreground font-normal">({users.length})</span>
              </h3>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Memuat daftar user...</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Tidak ada user</div>
            ) : (
              <div className="divide-y divide-border">
                {users.map(u => (
                  <div key={u.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-semibold text-sm"
                      style={{ background: "hsl(217 91% 92%)", color: "hsl(217 91% 45%)" }}>
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{u.username}</p>
                        {u.id === currentUser?.id && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Anda</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{u.email}</p>
                    </div>
                    <RoleBadge role={u.role} />
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`w-2 h-2 rounded-full ${u.is_active ? "bg-emerald-400" : "bg-slate-300"}`} />
                      <span className="text-xs text-muted-foreground">{u.is_active ? "Aktif" : "Nonaktif"}</span>
                    </div>
                    <button
                      onClick={() => handleDelete(u.id, u.username)}
                      disabled={deletingId === u.id || u.id === currentUser?.id}
                      title={u.id === currentUser?.id ? "Tidak dapat menghapus akun sendiri" : "Hapus user"}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500
                        transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                      {deletingId === u.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
