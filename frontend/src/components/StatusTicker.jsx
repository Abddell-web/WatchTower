import { RefreshCw } from "lucide-react";
import { formatClock } from "../lib/format";

export default function StatusTicker({ onRefresh, refreshing, health, lastUpdated }) {
  const ollamaUp = health?.ollama_reachable;

  return (
    <header className="status-ticker">
      <div className="status-brand">
        <h3 className="status-brand-title">WATCHTOWER</h3>
        
      </div>

      <div className="status-right">
        

        <div
          className="status-chip"
          title={ollamaUp ? "Ollama reachable" : "Ollama unreachable — start `ollama serve`"}
        >
          <span className={`status-dot ${ollamaUp ? "ok" : "error"}`} />
          <span>{health?.ollama_model || "qwen3"} · {ollamaUp ? "online" : "offline"}</span>
        </div>

        <span className="status-clock">
          Updated {lastUpdated ? formatClock(lastUpdated) : "—"}
        </span>

        <button onClick={onRefresh} disabled={refreshing} title="Refresh" className="status-refresh">
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>
    </header>
  );
}