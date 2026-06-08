const BASE = (import.meta.env.VITE_API_URL || "") + "/api";

function getToken(): string | null {
  return localStorage.getItem("sigmon_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("sigmon_token");
    localStorage.removeItem("sigmon_user");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Terjadi kesalahan" }));
    throw new Error(err.detail || "Request gagal");
  }

  return res.json();
}

async function upload<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload gagal" }));
    throw new Error(err.detail || "Upload gagal");
  }
  return res.json();
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<{ access_token: string; token_type: string; user: any }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),
    me: () => request<any>("/auth/me"),
    createUser: (data: any) =>
      request<any>("/auth/users", { method: "POST", body: JSON.stringify(data) }),
    listUsers: () => request<any[]>("/auth/users"),
    deleteUser: (id: number) =>
      request<any>(`/auth/users/${id}`, { method: "DELETE" }),
  },

  dashboard: {
    summary: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<any>(`/dashboard/summary${q}`);
    },
    topBottom: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<any>(`/dashboard/top-bottom${q}`);
    },
    filters: () => request<any>("/dashboard/filters"),
    trend: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<any[]>(`/dashboard/trend${q}`);
    },
    alerts: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<any[]>(`/dashboard/alerts${q}`);
    },
    risk: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<any[]>(`/dashboard/risk${q}`);
    },
    unitHistory: (unitName: string) =>
      request<any[]>(`/dashboard/unit-history/${encodeURIComponent(unitName)}`),
  },

  units: {
    list: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<any>(`/units${q}`);
    },
    get: (id: number) => request<any>(`/units/${id}`),
    create: (data: any) =>
      request<any>("/units", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) =>
      request<any>(`/units/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<any>(`/units/${id}`, { method: "DELETE" }),
    bulkDelete: (ids: number[]) =>
      request<any>("/units/bulk/selected", { method: "DELETE", body: JSON.stringify({ ids }) }),
    deleteAll: () =>
      request<any>("/units/all/data", { method: "DELETE" }),
  },

  import: {
    excel: (file: File, period?: string, replace?: boolean) => {
      const fd = new FormData();
      fd.append("file", file);
      if (period) fd.append("period", period);
      fd.append("replace", String(replace ?? true));
      return upload<any>("/import/excel", fd);
    },
    sheetsSync: () =>
      request<any>("/import/sheets-sync", { method: "POST" }),
    logs: () => request<any[]>("/import/logs"),
  },

  config: {
    getSheets: () => request<any>("/config/sheets"),
    saveSheets: (data: any) =>
      request<any>("/config/sheets", { method: "PUT", body: JSON.stringify(data) }),
    clearSheets: () =>
      request<any>("/config/sheets", { method: "DELETE" }),
  },

  export: {
    excel: async (params?: Record<string, string>): Promise<void> => {
      const token = getToken();
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${BASE}/export/excel${q}`, { headers });

      if (res.status === 401) {
        localStorage.removeItem("sigmon_token");
        localStorage.removeItem("sigmon_user");
        window.location.href = "/login";
        throw new Error("Unauthorized");
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Export gagal" }));
        throw new Error(err.detail || "Export gagal");
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename=([^;]+)/);
      const filename = match ? match[1].trim() : "SIGMON_Export.xlsx";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  },

  health: () => request<any>("/healthz"),
};
