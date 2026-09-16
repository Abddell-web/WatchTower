import { formatNumber } from "../lib/format";

export default function InstrumentRow({ stats }) {
  const items = [
    { label: "Log events analyzed", value: stats?.total_logs },
    { label: "Active alerts", value: stats?.total_alerts },
    { label: "Critical events", value: stats?.severity_counts?.CRITICAL || 0 },
    { label: "Source IPs tracked", value: stats?.top_ips?.length || 0 },
  ];

  return (
    <div className="panel-grid panel-grid-4">
      {items.map((item) => (
        <div key={item.label} className="instrument-cell">
          <div className="panel-label">{item.label}</div>
          <div className="instrument-value">{formatNumber(item.value)}</div>
        </div>
      ))}
    </div>
  );
}