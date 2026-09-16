import { useCallback, useEffect, useMemo, useState } from "react";
import { Radar } from "lucide-react";
import StatusTicker from "./components/StatusTicker";
import InstrumentRow from "./components/InstrumentRow";
import TimelineChart from "./components/TimelineChart";
import SeverityDonut from "./components/SeverityDonut";
import LogStream from "./components/LogStream";
import AlertsRail from "./components/AlertsRail";
import AlertDetail from "./components/AlertDetail";
import AssistantConsole from "./components/AssistantConsole";
import { fetchAlerts, fetchHealth, fetchLogs, fetchStats, refreshData } from "./lib/api";

export default function App() {
  const [logs, setLogs] = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsLimit, setLogsLimit] = useState(200);
  const [severity, setSeverity] = useState("");
  const [source, setSource] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [attachedAlert, setAttachedAlert] = useState(null);
  const [consoleToken, setConsoleToken] = useState(0);
  const [booting, setBooting] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData();
      const [logsRes, alertsRes, statsRes] = await Promise.all([
        fetchLogs({ severity, source, limit: logsLimit }),
        fetchAlerts(),
        fetchStats(),
      ]);
      setLogs(logsRes.logs);
      setLogsTotal(logsRes.total);
      setAlerts(alertsRes.alerts);
      setStats(statsRes);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
      setBooting(false);
    }
  }, [severity, source, logsLimit]);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    loadAll();
  }, [severity, source, logsLimit]);

  useEffect(() => {
    const poll = async () => {
      try {
        setHealth(await fetchHealth());
      } catch {
        setHealth({ ollama_reachable: false });
      }
    };
    poll();
    const id = setInterval(poll, 20000);
    return () => clearInterval(id);
  }, []);

  const sourceOptions = useMemo(
    () => Object.keys(stats?.source_counts || {}).sort(),
    [stats]
  );

  const handleDiscuss = (alert) => {
    setAttachedAlert(alert);
    setConsoleToken((t) => t + 1);
  };

  if (booting) {
    return (
      <div className="boot-screen">
        <div className="boot-screen-inner">
          <Radar size={28} className="animate-pulse" style={{ color: "var(--signal)" }} />
          <span className="boot-screen-label">Initializing console…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <StatusTicker
        onRefresh={loadAll}
        refreshing={refreshing}
        health={health}
        lastUpdated={lastUpdated}
      />

      <main className="app-content">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <InstrumentRow stats={stats} />
          <div className="panel-grid panel-grid-2-1">
            <TimelineChart data={stats?.timeline} />
            <SeverityDonut severityCounts={stats?.severity_counts} />
          </div>
        </div>

        <div className="panel-grid panel-grid-2-1" style={{ minHeight: 480 }}>
          <LogStream
            logs={logs}
            total={logsTotal}
            severity={severity}
            setSeverity={setSeverity}
            source={source}
            setSource={setSource}
            sources={sourceOptions}
            onLoadMore={() => setLogsLimit((l) => l + 200)}
          />
          <AlertsRail alerts={alerts} selectedId={selectedAlert?.id} onSelect={setSelectedAlert} />
        </div>
      </main>

      {selectedAlert && (
        <AlertDetail alert={selectedAlert} onClose={() => setSelectedAlert(null)} onDiscuss={handleDiscuss} />
      )}

      <AssistantConsole attachedAlert={attachedAlert} onDetach={() => setAttachedAlert(null)} openToken={consoleToken} />
    </div>
  );
}