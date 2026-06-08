import { useState } from "react";
import { X, Lock, Eye, EyeOff, CheckCircle, AlertCircle, KeyRound } from "lucide-react";
import { api } from "@/lib/api";

interface Props {
  onSuccess: () => void;
  onClose?: () => void;
  forceChange?: boolean;
}

export default function ChangePasswordModal({ onSuccess, onClose, forceChange = false }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const requirements = [
    { label: "Minimal 8 karakter", met: newPassword.length >= 8 },
    { label: "Mengandung huruf besar", met: /[A-Z]/.test(newPassword) },
    { label: "Mengandung angka", met: /[0-9]/.test(newPassword) },
  ];
  const allRequirementsMet = requirements.every(r => r.met);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!allRequirementsMet) {
      setError("Password baru belum memenuhi semua persyaratan.");
      return;
    }
    if (!passwordsMatch) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      await api.auth.changePassword(currentPassword, newPassword);
      setSuccess(true);
      setTimeout(() => { onSuccess(); }, 1500);
    } catch (e: any) {
      setError(e?.message || "Gagal mengganti password. Periksa password lama Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={forceChange ? undefined : onClose}
      />

      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--card-border))" }}
      >
        <div className="px-6 py-5 flex items-center gap-3" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "hsl(var(--primary) / 0.12)" }}>
            <KeyRound className="w-4.5 h-4.5" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold" style={{ color: "hsl(var(--foreground))" }}>
              Ganti Password
            </h2>
            <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              {forceChange ? "Wajib mengganti password default sebelum melanjutkan." : "Perbarui password akun Anda."}
            </p>
          </div>
          {!forceChange && onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              style={{ color: "hsl(var(--muted-foreground))" }}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {success ? (
          <div className="px-6 py-10 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "hsl(142 71% 45% / 0.12)" }}>
              <CheckCircle className="w-7 h-7 text-emerald-500" />
            </div>
            <p className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>Password berhasil diperbarui!</p>
            <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Halaman akan diperbarui sebentar lagi...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm"
                style={{ background: "hsl(0 84% 60% / 0.08)", color: "hsl(0 84% 50%)", border: "1px solid hsl(0 84% 60% / 0.2)" }}>
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {[
              { label: "Password Lama", value: currentPassword, setValue: setCurrentPassword, show: showCurrent, setShow: setShowCurrent },
              { label: "Password Baru", value: newPassword, setValue: setNewPassword, show: showNew, setShow: setShowNew },
              { label: "Konfirmasi Password Baru", value: confirmPassword, setValue: setConfirmPassword, show: showConfirm, setShow: setShowConfirm },
            ].map(({ label, value, setValue, show, setShow }) => (
              <div key={label}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "hsl(var(--foreground))" }}>
                  {label}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
                  <input
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    required
                    className="w-full pl-9 pr-10 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{
                      background: "hsl(var(--muted))",
                      border: "1px solid hsl(var(--border))",
                      color: "hsl(var(--foreground))",
                    }}
                    placeholder={`Masukkan ${label.toLowerCase()}`}
                  />
                  <button type="button" onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "hsl(var(--muted-foreground))" }}>
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}

            {newPassword.length > 0 && (
              <div className="space-y-1.5 px-1">
                {requirements.map(req => (
                  <div key={req.label} className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                      req.met ? "bg-emerald-500" : "bg-muted"
                    }`}>
                      {req.met && <span className="text-white text-[8px] font-bold">✓</span>}
                    </div>
                    <span className="text-xs" style={{ color: req.met ? "hsl(142 71% 38%)" : "hsl(var(--muted-foreground))" }}>
                      {req.label}
                    </span>
                  </div>
                ))}
                {confirmPassword.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                      passwordsMatch ? "bg-emerald-500" : "bg-red-400"
                    }`}>
                      <span className="text-white text-[8px] font-bold">{passwordsMatch ? "✓" : "✕"}</span>
                    </div>
                    <span className="text-xs" style={{ color: passwordsMatch ? "hsl(142 71% 38%)" : "hsl(0 84% 55%)" }}>
                      Password cocok
                    </span>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !allRequirementsMet || !passwordsMatch || !currentPassword}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
            >
              {loading ? "Menyimpan..." : "Simpan Password Baru"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
