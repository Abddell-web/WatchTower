from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

import config
import rules
import ollama_client
from models import ChatRequest, ChatResponse, AnalyzeResponse

try:
    from logs import loggs as loggs_reel
except Exception:
    loggs_reel = None


app = FastAPI(title="Watchtower API", version="2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


_cache = {"logs": [], "alerts": []}

def _refresh():
    data = loggs_reel()
    logs = data["logs"]
    alerts = rules.analyze_logs(logs)
    _cache["logs"] = logs
    _cache["alerts"] = alerts
    return logs, alerts


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "ollama_reachable": ollama_client.check_health(),
        "ollama_model": config.OLLAMA_MODEL,
    }


@app.get("/api/logs")
def get_logs(
    severity: str | None = None, source: str | None = None,limit: int = 500):
    filtered, _ = _refresh()
    if severity:
        filtered = [l for l in filtered if l.get("severity") == severity.upper()]
    if source:
        filtered = [l for l in filtered if l.get("source") == source]
    return {"total": len(filtered), "logs": filtered[-limit:]}


@app.get("/api/alerts")
def get_alerts():
    logs, alerts = (_cache["logs"], _cache["alerts"]) if _cache["logs"] else _refresh()
    return {"total": len(alerts), "alerts": alerts}


@app.get("/api/stats")
def get_stats():
    logs, alerts = (_cache["logs"], _cache["alerts"]) if _cache["logs"] else _refresh()
    return rules.compute_stats(logs, alerts)


@app.post("/api/refresh")
def refresh():
    logs, alerts = _refresh()
    return {"total_logs": len(logs), "total_alerts": len(alerts)}


@app.post("/api/analyze/{alert_id}", response_model=AnalyzeResponse)
def analyze_alert(alert_id: str):
    alert = next((a for a in _cache["alerts"] if a["id"] == alert_id), None)
    if not alert:
        raise HTTPException(404, "Alert not found. Fetch /api/alerts first.")
    related = [l for l in _cache["logs"] if l["id"] in alert["related_log_ids"]]
    try:
        analysis = ollama_client.analyze_alert(alert, related)
    except ollama_client.OllamaError as e:
        raise HTTPException(503, str(e))
    return AnalyzeResponse(alert_id=alert_id, analysis=analysis, model=config.OLLAMA_MODEL)


@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    alert = None
    if req.alert_id:
        alert = next((a for a in _cache["alerts"] if a["id"] == req.alert_id), None)

    stats = rules.compute_stats(_cache["logs"], _cache["alerts"]) if _cache["logs"] else {}
    summary = (
        f"{stats.get('total_logs', 0)} logs analyzed, {stats.get('total_alerts', 0)} alerts. "
        f"Severity breakdown: {stats.get('severity_counts', {})}."
    )
    try:
        reply = ollama_client.chat_with_context(req.message, alert, summary)
    except ollama_client.OllamaError as e:
        raise HTTPException(503, str(e))
    return ChatResponse(reply=reply, model=config.OLLAMA_MODEL)