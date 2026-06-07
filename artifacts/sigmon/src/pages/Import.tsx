import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import {
  Upload, Link2, CheckCircle2, XCircle, Loader2,
  FileSpreadsheet, Clock, RefreshCw, Settings2,
  ExternalLink, Trash2, Wifi, Code2, Copy, Check,
  ChevronRight, AlertCircle
} from "lucide-react";

const APPS_SCRIPT_CODE = `function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  // Baris pertama = header
  var headers = data[0].map(function(h) {
    return h.toString().toLowerCase().trim().replace(/\\s+/g, '_');
  });
  
  var records = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    // Lewati baris kosong
    if (!row[4] || row[4].toString().trim() === '') continue;
    
    var record = {};
    for (var j = 0; j < headers.length; j++) {
      record[headers[j]] = row[j];
    }
    records.push(record);
  }
  
  var output = ContentService.createTextOutput(JSON.stringify(records));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}`;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg
        bg-white/10 hover:bg-white/20 text-white transition-colors">
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Tersalin!" : "Copy"}
    </button>
  );
}

function LogRow({ log }: { log: any }) {
  const ok = log.status === "success";
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-0">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${ok ? "bg-emerald-50" : "bg-red-50"}`}>
        {ok ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground">
          {log.sync_type === "excel" ? "Upload Excel" : "Google Sheets / Apps Script"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {ok ? `${log.records_count} data berhasil disinkronkan` : log.error_message?.slice(0, 80)}
        </p>
      </div>
      <div className="text-right shrink-0">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ok ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
          {ok ? "Berhasil" : "Gagal"}
        </span>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(log.created_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
        </p>
      </div>
    </div>
  );
}

export default function Import() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isManager = isAdmin || user?.role === "manager";

  const [tab, setTab] = useState<"sheets" | "excel">("sheets");
  const [showGuide, setShowGuide] = useState(false);

  // Config state
  const [sheetsConfig, setSheetsConfig] = useState<any>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState(false);
  const [configForm, setConfigForm] = useState({ spreadsheet_url: "", sheet_name: "Sheet1", default_period: "" });
  const [savingConfig, setSavingConfig] = useState(false);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [syncError, setSyncError] = useState("");

  // Excel state
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [period, setPeriod] = useState("");
  const [replace, setReplace] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploadError, setUploadError] = useState("");

  // Logs
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  const fetchConfig = async () => {
    setConfigLoading(true);
    try {
      const c = await api.config.getSheets();
      setSheetsConfig(c);
      if (c.is_configured) {
        setConfigForm({ spreadsheet_url: c.spreadsheet_url || "", sheet_name: c.sheet_name || "Sheet1", default_period: c.default_period || "" });
      }
    } catch {}
    setConfigLoading(false);
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try { setLogs(await api.import.logs()); } catch {}
    setLogsLoading(false);
  };

  useEffect(() => { fetchConfig(); fetchLogs(); }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const saved = await api.config.saveSheets(configForm);
      setSheetsConfig(saved);
      setEditingConfig(false);
      setSyncResult(null);
      setSyncError("");
    } catch (err: any) { alert(err.message); }
    setSavingConfig(false);
  };

  const handleClearConfig = async () => {
    if (!confirm("Hapus konfigurasi ini?")) return;
    try {
      await api.config.clearSheets();
      setSheetsConfig({ is_configured: false });
      setConfigForm({ spreadsheet_url: "", sheet_name: "Sheet1", default_period: "" });
    } catch (err: any) { alert(err.message); }
  };

  const handleSync = async () => {
    setSyncing(true); setSyncError(""); setSyncResult(null);
    try {
      const res = await api.import.sheetsSync();
      setSyncResult(res);
      fetchLogs();
    } catch (err: any) { setSyncError(err.message); }
    setSyncing(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true); setUploadError(""); setUploadResult(null);
    try {
      const res = await api.import.excel(file, period || undefined, replace);
      setUploadResult(res);
      fetchLogs();
    } catch (err: any) { setUploadError(err.message); }
    setUploading(false);
  };

  const urlTypeBadge = (type?: string) => {
    if (type === "apps_script") return { label: "Apps Script API", color: "bg-violet-50 text-violet-700" };
    if (type === "spreadsheet") return { label: "Spreadsheet (Public)", color: "bg-blue-50 text-blue-700" };
    return null;
  };

  return (
    <div className="bg-background min-h-screen">
      <Sidebar />
      <main className="lg:ml-60 min-h-screen pt-14 lg:pt-0 max-w-full overflow-x-hidden">
        <div className="border-b border-border bg-card px-6 py-4">
          <h1 className="text-base font-semibold text-foreground">Import Data</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Sinkronisasi dari Google Apps Script atau upload file Excel</p>
        </div>

        <div className="p-6 max-w-4xl space-y-5">
          {/* Tab */}
          <div className="flex gap-1 p-1 rounded-xl bg-muted w-fit">
            {([["sheets", "Google Sheets / Apps Script", Link2], ["excel", "Upload Excel", Upload]] as const).map(([t, label, Icon]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all
                  ${tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* ===== SHEETS TAB ===== */}
          {tab === "sheets" && (
            <div className="space-y-4">

              {/* Guide toggle */}
              <button onClick={() => setShowGuide(v => !v)}
                className="flex items-center gap-2 text-xs font-medium text-primary hover:underline">
                <Code2 className="w-3.5 h-3.5" />
                {showGuide ? "Sembunyikan" : "Lihat"} panduan membuat Google Apps Script API
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showGuide ? "rotate-90" : ""}`} />
              </button>

              {/* Guide panel */}
              {showGuide && (
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="px-5 py-4 border-b border-border bg-muted/30">
                    <h3 className="text-sm font-semibold text-foreground">Cara Membuat Google Apps Script API</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Ikuti langkah-langkah berikut di Google Spreadsheet kamu</p>
                  </div>
                  <div className="p-5 space-y-5">
                    {[
                      {
                        n: "1", title: "Buka Google Spreadsheet kamu",
                        desc: "Buka spreadsheet yang berisi data BOD. Pastikan header kolom ada di baris pertama (WILAYAH, REGION, AREA, UNIT, NOC, dst)."
                      },
                      {
                        n: "2", title: "Buka Apps Script Editor",
                        desc: "Klik menu Extensions → Apps Script. Tab baru akan terbuka."
                      },
                      {
                        n: "3", title: "Paste kode berikut",
                        desc: "Hapus semua kode yang ada, lalu paste kode di bawah ini:"
                      },
                      {
                        n: "4", title: "Deploy sebagai Web App",
                        desc: "Klik Deploy → New deployment → pilih type Web App. Set \"Execute as\" = Me, \"Who has access\" = Anyone. Klik Deploy, izinkan akses, copy URL yang muncul."
                      },
                      {
                        n: "5", title: "Masukkan URL ke SIGMON",
                        desc: "Paste URL Apps Script (https://script.google.com/macros/s/.../exec) ke form di bawah dan simpan. Setelah itu cukup klik Sinkronisasi kapan saja."
                      },
                    ].map(step => (
                      <div key={step.n} className="flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0 mt-0.5">
                          {step.n}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{step.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
                          {step.n === "3" && (
                            <div className="mt-3 rounded-xl overflow-hidden border border-slate-700">
                              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800">
                                <span className="text-xs text-slate-400 font-mono">Apps Script — Code.gs</span>
                                <CopyButton text={APPS_SCRIPT_CODE} />
                              </div>
                              <pre className="p-4 bg-slate-900 text-emerald-300 text-xs leading-relaxed overflow-x-auto font-mono">
                                {APPS_SCRIPT_CODE}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex gap-3">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-amber-700">Catatan penting</p>
                        <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
                          Setiap kali kamu mengubah kode Apps Script, kamu harus membuat deployment baru (bukan mengupdate yang lama) agar URL baru menggunakan kode terbaru. URL lama tetap bisa digunakan selama tidak dihapus.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Config card */}
              <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Konfigurasi Sumber Data</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">URL tersimpan di database — atur sekali, sync kapan saja</p>
                    </div>
                  </div>
                  {sheetsConfig?.is_configured && !editingConfig && isAdmin && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditingConfig(true)}
                        className="text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-muted transition-colors">
                        Ubah URL
                      </button>
                      <button onClick={handleClearConfig}
                        className="p-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  {configLoading ? (
                    <p className="text-xs text-muted-foreground">Memuat konfigurasi...</p>
                  ) : sheetsConfig?.is_configured && !editingConfig ? (
                    /* === Configured: show sync panel === */
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-emerald-700">Sumber data terhubung</p>
                            {urlTypeBadge(sheetsConfig.url_type) && (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${urlTypeBadge(sheetsConfig.url_type)!.color}`}>
                                {urlTypeBadge(sheetsConfig.url_type)!.label}
                              </span>
                            )}
                          </div>
                          <a href={sheetsConfig.spreadsheet_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-emerald-600 hover:underline flex items-center gap-1 mt-1.5">
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-sm">{sheetsConfig.spreadsheet_url}</span>
                          </a>
                          <div className="flex flex-wrap gap-4 mt-2 text-xs text-emerald-600">
                            {sheetsConfig.url_type === "spreadsheet" && (
                              <span>Sheet: <strong>{sheetsConfig.sheet_name}</strong></span>
                            )}
                            {sheetsConfig.default_period && (
                              <span>Periode: <strong>{sheetsConfig.default_period}</strong></span>
                            )}
                          </div>
                        </div>
                      </div>

                      {sheetsConfig.url_type === "spreadsheet" && (
                        <div className="flex items-center gap-2 p-3.5 rounded-lg bg-amber-50 border border-amber-100">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <p className="text-xs text-amber-700">
                            Menggunakan URL spreadsheet biasa memerlukan spreadsheet <strong>public</strong>.
                            Untuk keamanan lebih baik, gunakan <button onClick={() => setShowGuide(true)} className="underline font-medium">Google Apps Script</button>.
                          </p>
                        </div>
                      )}

                      {!isManager ? (
                        <p className="text-xs text-muted-foreground">Hanya Manager/Admin yang dapat melakukan sinkronisasi.</p>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <button onClick={handleSync} disabled={syncing}
                              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold
                                rounded-lg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity">
                              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                              {syncing ? "Menyinkronkan..." : "Sinkronisasi Sekarang"}
                            </button>
                            <p className="text-xs text-muted-foreground">Data terbaru akan langsung masuk ke dashboard</p>
                          </div>
                          {syncResult && (
                            <div className="flex items-center gap-3 p-3.5 rounded-lg bg-emerald-50 border border-emerald-100">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                              <div>
                                <p className="text-sm font-semibold text-emerald-700">Sinkronisasi berhasil!</p>
                                <p className="text-xs text-emerald-600 mt-0.5">{syncResult.records_count} data berhasil diperbarui dari sumber</p>
                              </div>
                            </div>
                          )}
                          {syncError && (
                            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-red-50 border border-red-100">
                              <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-semibold text-red-600">Sinkronisasi gagal</p>
                                <p className="text-xs text-red-500 mt-0.5">{syncError}</p>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    /* === Not configured or editing === */
                    !isAdmin ? (
                      <div className="text-center py-6">
                        <Link2 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Belum dikonfigurasi</p>
                        <p className="text-xs text-muted-foreground mt-1">Hubungi Admin untuk mengatur koneksi data</p>
                      </div>
                    ) : (
                      <form onSubmit={handleSaveConfig} className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-foreground mb-1.5">
                            URL Sumber Data <span className="text-red-500">*</span>
                          </label>
                          <input type="url" value={configForm.spreadsheet_url}
                            onChange={e => setConfigForm(f => ({ ...f, spreadsheet_url: e.target.value }))}
                            placeholder="https://script.google.com/macros/s/.../exec  atau  https://docs.google.com/spreadsheets/d/..."
                            required
                            className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background
                              focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                          <p className="text-xs text-muted-foreground mt-1.5">
                            Bisa berupa URL <strong>Google Apps Script</strong> (.../exec) atau URL <strong>Google Spreadsheet</strong> biasa
                          </p>
                        </div>

                        {(!configForm.spreadsheet_url || !configForm.spreadsheet_url.includes("script.google.com")) && (
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1.5">Nama Sheet (untuk spreadsheet biasa)</label>
                            <input type="text" value={configForm.sheet_name}
                              onChange={e => setConfigForm(f => ({ ...f, sheet_name: e.target.value }))}
                              placeholder="Sheet1"
                              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background
                                focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-medium text-foreground mb-1.5">
                            Periode default <span className="text-muted-foreground font-normal">(opsional — jika tidak diisi, akan auto-detect dari data)</span>
                          </label>
                          <input type="text" value={configForm.default_period}
                            onChange={e => setConfigForm(f => ({ ...f, default_period: e.target.value }))}
                            placeholder="cth: BOD 30 MEI 2026"
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background
                              focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button type="submit" disabled={savingConfig}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-60">
                            {savingConfig ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            Simpan & Aktifkan
                          </button>
                          {editingConfig && (
                            <button type="button" onClick={() => setEditingConfig(false)}
                              className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted">
                              Batal
                            </button>
                          )}
                        </div>
                      </form>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== EXCEL TAB ===== */}
          {tab === "excel" && (
            <div className="bg-card rounded-xl border border-card-border shadow-sm p-6">
              <form onSubmit={handleUpload} className="space-y-5">
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                    ${file ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30"}`}>
                  <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                    onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
                  <FileSpreadsheet className={`w-8 h-8 mx-auto mb-3 ${file ? "text-primary" : "text-muted-foreground"}`} />
                  {file ? (
                    <>
                      <p className="text-sm font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB · Klik untuk ganti</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-foreground">Klik atau drag & drop file Excel</p>
                      <p className="text-xs text-muted-foreground mt-1">Format .xlsx atau .xls</p>
                    </>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">Periode (opsional)</label>
                    <input type="text" value={period} onChange={e => setPeriod(e.target.value)}
                      placeholder="cth: BOD 30 MEI 2026"
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={replace} onChange={e => setReplace(e.target.checked)} className="w-4 h-4 accent-primary" />
                      <div>
                        <p className="text-sm text-foreground">Timpa data lama</p>
                        <p className="text-xs text-muted-foreground">Ganti data periode yang sama</p>
                      </div>
                    </label>
                  </div>
                </div>
                {uploadResult && (
                  <div className="flex items-center gap-3 p-3.5 rounded-lg bg-emerald-50 border border-emerald-100">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-700">Berhasil!</p>
                      <p className="text-xs text-emerald-600 mt-0.5">{uploadResult.records_count} data berhasil diimport</p>
                    </div>
                  </div>
                )}
                {uploadError && (
                  <div className="flex items-center gap-3 p-3.5 rounded-lg bg-red-50 border border-red-100">
                    <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-sm text-red-600">{uploadError}</p>
                  </div>
                )}
                <button type="submit" disabled={!file || uploading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold
                    rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? "Mengupload..." : "Upload & Import"}
                </button>
              </form>
            </div>
          )}

          {/* Log */}
          <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Riwayat Sinkronisasi</h3>
                <p className="text-xs text-muted-foreground mt-0.5">20 aktivitas terakhir</p>
              </div>
              <button onClick={fetchLogs} className="p-1.5 rounded-lg hover:bg-muted">
                <RefreshCw className={`w-4 h-4 text-muted-foreground ${logsLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
            {logsLoading ? (
              <div className="p-8 text-center text-xs text-muted-foreground">Memuat...</div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center">
                <Clock className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Belum ada riwayat</p>
              </div>
            ) : (
              <div>{logs.map(log => <LogRow key={log.id} log={log} />)}</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
