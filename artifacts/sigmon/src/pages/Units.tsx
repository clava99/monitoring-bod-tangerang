import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import { Plus, Pencil, Trash2, X, Loader2, Check, CheckSquare, Square, AlertTriangle } from "lucide-react";

function UnitForm({ initial, onSave, onCancel, loading }: any) {
  const [form, setForm] = useState(initial || { unit: "", region: "", area: "", period: "", noc: "", os_aktif: "", lending: "" });
  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { ...form };
    if (data.noc) data.noc = parseInt(data.noc);
    if (data.os_aktif) data.os_aktif = parseFloat(data.os_aktif);
    if (data.lending) data.lending = parseFloat(data.lending);
    onSave(data);
  };

  const fields = [
    { key: "unit", label: "Nama Unit", required: true, type: "text" },
    { key: "region", label: "Region", type: "text" },
    { key: "area", label: "Area", type: "text" },
    { key: "cabang_id", label: "Cabang ID", type: "text" },
    { key: "period", label: "Periode", type: "text", placeholder: "cth: BOD 30 MEI 2026" },
    { key: "noc", label: "NOC", type: "number" },
    { key: "os_aktif", label: "OS Aktif (Juta)", type: "number" },
    { key: "lending", label: "Lending (Juta)", type: "number" },
    { key: "os_npl", label: "OS NPL (Juta)", type: "number" },
    { key: "pct_rr", label: "% RR (desimal, cth: 0.95)", type: "number", step: "0.0001" },
    { key: "ao", label: "AO (Jumlah)", type: "number" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {fields.map(f => (
          <div key={f.key} className={f.key === "unit" ? "col-span-2" : ""}>
            <label className="block text-xs font-medium text-foreground mb-1">
              {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <input
              type={f.type}
              step={f.step}
              value={(form as any)[f.key] ?? ""}
              onChange={e => set(f.key, e.target.value)}
              placeholder={f.placeholder}
              required={f.required}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background
                focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 pt-2">
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium
            rounded-lg hover:opacity-90 disabled:opacity-60">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {initial ? "Simpan Perubahan" : "Tambah Unit"}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors">
          Batal
        </button>
      </div>
    </form>
  );
}

function ConfirmModal({ open, title, description, confirmLabel, onConfirm, onCancel, danger }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card rounded-xl border border-border shadow-xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onCancel}
            className="px-4 py-2 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors">
            Batal
          </button>
          <button onClick={onConfirm}
            className={`px-4 py-2 text-xs font-medium rounded-lg text-white transition-colors ${danger ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:opacity-90"}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Units() {
  const [units, setUnits] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean; type: "selected" | "all" | null;
  }>({ open: false, type: null });

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const u = await api.units.list({ page: String(page), limit: "20", search });
      setUnits(u);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchUnits(); }, [page, search]);

  useEffect(() => { setSelected(new Set()); }, [page, search]);

  const currentIds: number[] = units?.data?.map((r: any) => r.id) ?? [];
  const allOnPageSelected = currentIds.length > 0 && currentIds.every(id => selected.has(id));
  const someOnPageSelected = currentIds.some(id => selected.has(id));

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelected(prev => {
        const next = new Set(prev);
        currentIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        currentIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = async (data: any) => {
    setSaving(true);
    try {
      if (editItem) {
        await api.units.update(editItem.id, data);
      } else {
        await api.units.create(data);
      }
      setShowForm(false); setEditItem(null);
      fetchUnits();
    } catch (err: any) { alert(err.message); }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus data ini?")) return;
    setDeletingId(id);
    try {
      await api.units.delete(id);
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
      fetchUnits();
    } catch (err: any) { alert(err.message); }
    setDeletingId(null);
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    setConfirmModal({ open: false, type: null });
    try {
      await api.units.bulkDelete(Array.from(selected));
      setSelected(new Set());
      fetchUnits();
    } catch (err: any) { alert(err.message); }
    setBulkDeleting(false);
  };

  const handleDeleteAll = async () => {
    setBulkDeleting(true);
    setConfirmModal({ open: false, type: null });
    try {
      await api.units.deleteAll();
      setSelected(new Set());
      fetchUnits();
    } catch (err: any) { alert(err.message); }
    setBulkDeleting(false);
  };

  const handleConfirm = () => {
    if (confirmModal.type === "selected") handleBulkDelete();
    else if (confirmModal.type === "all") handleDeleteAll();
  };

  return (
    <div className="bg-background min-h-screen">
      <ConfirmModal
        open={confirmModal.open}
        type={confirmModal.type}
        title={confirmModal.type === "all" ? "Hapus Semua Data?" : `Hapus ${selected.size} Data Terpilih?`}
        description={
          confirmModal.type === "all"
            ? "Seluruh data unit akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan."
            : `${selected.size} data yang dipilih akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`
        }
        confirmLabel={confirmModal.type === "all" ? "Hapus Semua" : `Hapus ${selected.size} Data`}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmModal({ open: false, type: null })}
        danger
      />

      <Sidebar />
      <main className="lg:ml-60 min-h-screen pt-14 lg:pt-0 max-w-full overflow-x-hidden">
        <div className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-semibold text-foreground">Data Unit</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Kelola data monitoring unit</p>
            </div>
            <div className="flex items-center gap-2">
              {selected.size > 0 && (
                <button
                  onClick={() => setConfirmModal({ open: true, type: "selected" })}
                  disabled={bulkDeleting}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors">
                  {bulkDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Hapus {selected.size} Dipilih
                </button>
              )}
              <button
                onClick={() => setConfirmModal({ open: true, type: "all" })}
                disabled={bulkDeleting || !units?.total}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-200 text-xs font-medium rounded-lg hover:bg-red-100 disabled:opacity-40 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Semua
              </button>
              <button onClick={() => { setShowForm(true); setEditItem(null); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:opacity-90">
                <Plus className="w-3.5 h-3.5" />
                Tambah Unit
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {(showForm || editItem) && (
            <div className="bg-card rounded-xl border border-card-border p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">
                  {editItem ? "Edit Data Unit" : "Tambah Data Unit Baru"}
                </h3>
                <button onClick={() => { setShowForm(false); setEditItem(null); }}
                  className="p-1 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <UnitForm
                initial={editItem}
                onSave={handleSave}
                onCancel={() => { setShowForm(false); setEditItem(null); }}
                loading={saving}
              />
            </div>
          )}

          <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-foreground">
                  {units?.total || 0} unit
                </p>
                {selected.size > 0 && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                    {selected.size} dipilih
                  </span>
                )}
              </div>
              <input type="search" placeholder="Cari unit..." value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="px-3 py-1.5 text-xs border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 w-48" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border" style={{ background: "hsl(210 40% 98%)" }}>
                    <th className="px-4 py-3 w-10">
                      <button
                        onClick={toggleSelectAll}
                        className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        title={allOnPageSelected ? "Batalkan semua" : "Pilih semua di halaman ini"}>
                        {allOnPageSelected
                          ? <CheckSquare className="w-4 h-4 text-primary" />
                          : someOnPageSelected
                            ? <CheckSquare className="w-4 h-4 text-primary/50" />
                            : <Square className="w-4 h-4" />}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Unit</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Region</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Periode</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">NOC</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Lending</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">% RR</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr><td colSpan={8} className="px-5 py-8 text-center text-muted-foreground">Memuat...</td></tr>
                  ) : units?.data?.map((row: any) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-muted/20 transition-colors ${selected.has(row.id) ? "bg-red-50/60" : ""}`}>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleSelect(row.id)}
                          className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                          {selected.has(row.id)
                            ? <CheckSquare className="w-4 h-4 text-red-600" />
                            : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{row.unit.replace(/^M\.[A-Z0-9]+- /, "")}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.region || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.period || "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.noc?.toLocaleString("id-ID") || "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.lending?.toFixed(1) || "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {row.pct_rr != null ? `${(row.pct_rr * 100).toFixed(1)}%` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setEditItem(row); setShowForm(false); }}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-muted-foreground hover:text-blue-600 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(row.id)} disabled={deletingId === row.id}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors">
                            {deletingId === row.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && units?.data?.length === 0 && (
                    <tr><td colSpan={8} className="px-5 py-8 text-center text-muted-foreground">Tidak ada data</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {units && units.total_pages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">Halaman {page} dari {units.total_pages}</p>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                    className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted disabled:opacity-40">
                    ← Prev
                  </button>
                  <button onClick={() => setPage(p => Math.min(units.total_pages, p + 1))} disabled={page >= units.total_pages}
                    className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted disabled:opacity-40">
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
