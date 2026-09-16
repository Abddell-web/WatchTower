export const SEVERITY_COLORS = {
  CRITICAL: "#F0465A",
  HIGH: "#F4813C",
  ERROR: "#F4813C",
  MEDIUM: "#F2C94C",
  WARNING: "#F2C94C",
  LOW: "#4FD1C5",
  INFO: "#4FD1C5",
  UNKNOWN: "#566072",
};

export function severityColor(sev) {
  return SEVERITY_COLORS[(sev || "UNKNOWN").toUpperCase()] || SEVERITY_COLORS.UNKNOWN;
}

export function titleCase(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function formatNumber(n) {
  return (n ?? 0).toLocaleString();
}

export function formatClock(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}