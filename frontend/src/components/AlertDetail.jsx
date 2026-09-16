import { useState } from "react";
import { X, Sparkles, MessageSquareText } from "lucide-react";
import SeverityTag from "./SeverityTag";
import FormattedText from "./FormattedText";
import { analyzeAlert } from "../lib/api";

export default function AlertDetail({ alert, onClose, onDiscuss }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!alert) return null;

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeAlert(alert.id);
      setAnalysis(res.analysis);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const meta = [
    { label: "MITRE technique", value: alert.mitre_technique },
    { label: "Source IP", value: alert.ip },
    { label: "Username", value: alert.username },
    { label: "Occurrences", value: alert.count },
    { label: "First seen", value: alert.first_seen },
    { label: "Last seen", value: alert.last_seen },
  ].filter((m) => m.value);

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <aside className="alert-detail animate-slide-up">
        <div className="alert-detail-header">
          <div>
            <SeverityTag severity={alert.severity} size="lg" />
            <h2 className="alert-detail-title">{alert.type}</h2>
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={18} />
          </button>
        </div>

        <div className="alert-detail-body">
          <p className="alert-detail-desc">{alert.description}</p>

          {meta.length > 0 && (
            <dl className="meta-grid">
              {meta.map((m) => (
                <div key={m.label}>
                  <dt className="meta-label">{m.label}</dt>
                  <dd className="meta-value">{m.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="analysis-section">
            <div className="analysis-section-header">
              <span className="analysis-section-label">AI vulnerability analysis</span>
              {!analysis && !loading && (
                <button onClick={handleAnalyze} className="btn-signal">
                  <Sparkles size={13} />
                  Analyze with Qwen3
                </button>
              )}
            </div>

            {loading && (
              <div className="loading-line">
                <span className="status-dot signal animate-pulse" />
                Consulting Qwen3…
              </div>
            )}

            {error && <div className="error-box">{error}</div>}

            {analysis && <FormattedText text={analysis} />}
          </div>
        </div>

        <div className="alert-detail-footer">
          <button onClick={() => onDiscuss(alert)} className="btn-outline">
            <MessageSquareText size={14} />
            Discuss this alert in the console
          </button>
        </div>
      </aside>
    </>
  );
}