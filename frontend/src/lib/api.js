const API_URL = import.meta.env.VITE_API_URL || "";

async function request(path, opts = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export const fetchHealth = () => request("/api/health");

export const refreshData = () =>
  request("/api/refresh", { method: "POST" });

export const fetchLogs = ({ severity, source, limit = 200 } = {}) => {
  const params = new URLSearchParams();
  if (severity) params.set("severity", severity);
  if (source) params.set("source", source);
  if (limit) params.set("limit", String(limit));
  return request(`/api/logs?${params.toString()}`);
};

export const fetchAlerts = () => request("/api/alerts");

export const fetchStats = () => request("/api/stats");

export const analyzeAlert = (id) =>
  request(`/api/analyze/${id}`, { method: "POST" });

export const sendChat = (message, alertId) =>
  request("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message, alert_id: alertId || null }),
  });