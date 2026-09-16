import SeverityTag from "./SeverityTag";

export default function AlertsRail({ alerts, selectedId, onSelect }) {
  return (
    <div className="alerts-rail">
      <div className="alerts-rail-header">
        Alerts <span>·</span> {alerts.length} triggered
      </div>

      <div className="alerts-rail-list">
        {alerts.length === 0 ? (
          <div className="empty-state">No alerts triggered yet. This environment looks clean.</div>
        ) : (
          alerts.map((alert) => (
            <button
              key={alert.id}
              onClick={() => onSelect(alert)}
              className={`alert-card ${selectedId === alert.id ? "selected" : ""}`}
            >
              <div className="alert-card-top">
                <SeverityTag severity={alert.severity} />
                {alert.count > 1 && <span className="alert-card-count">×{alert.count}</span>}
              </div>
              <div className="alert-card-title">{alert.type}</div>
              <p className="alert-card-desc line-clamp-2">{alert.description}</p>
              <div className="alert-card-meta">
                {alert.mitre_technique && <span className="truncate">{alert.mitre_technique}</span>}
                {alert.ip && <span>{alert.ip}</span>}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}