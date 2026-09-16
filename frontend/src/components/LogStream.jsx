import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import SeverityTag from "./SeverityTag";

export default function LogStream({ logs, total, severity, setSeverity, source, setSource, sources, onLoadMore }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return logs;
    const q = query.toLowerCase();
    return logs.filter((l) =>
      [l.event, l.ip, l.username, l.raw_log].filter(Boolean).some((f) => f.toLowerCase().includes(q))
    );
  }, [logs, query]);

  return (
    <div className="log-stream">
      <div className="log-stream-toolbar">
        <span className="log-stream-title">
          Log stream <span>·</span> {filtered.length} of {total}
        </span>

        <div className="search-box">
          <Search size={13} style={{ color: "var(--ink-700)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, IPs, users"
          />
        </div>

        <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="select-field">
          <option value="">All severities</option>
          {["CRITICAL", "ERROR", "WARNING", "INFO"].map((s) => (
            <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
          ))}
        </select>

        <select value={source} onChange={(e) => setSource(e.target.value)} className="select-field">
          <option value="">All sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="log-table-header">
        <span>Time</span>
        <span>Severity</span>
        <span>Source</span>
        <span>Event</span>
        <span>IP</span>
        <span>User</span>
      </div>

      <div className="log-table-body">
        {filtered.length === 0 ? (
          <div className="empty-state">No log events match these filters. Try clearing the search or severity.</div>
        ) : (
          filtered.map((log) => (
            <div key={log.id} className="log-table-row">
              <span className="truncate text-timestamp">{log.timestamp || "—"}</span>
              <SeverityTag severity={log.severity} />
              <span className="truncate text-source">{log.source || "—"}</span>
              <span className="truncate text-event" title={log.event}>{log.event}</span>
              <span className="truncate text-source">{log.ip || "—"}</span>
              <span className="truncate text-source">{log.username || "—"}</span>
            </div>
          ))
        )}
      </div>

      <div className="log-stream-footer">
        <button onClick={onLoadMore} className="link-btn">Load older events</button>
      </div>
    </div>
  );
}