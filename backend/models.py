from typing import Optional, List
from pydantic import BaseModel


class LogEntry(BaseModel):
    id: str
    timestamp: Optional[str] = None
    source: Optional[str] = None
    severity: str = "UNKNOWN"
    event: str = ""
    ip: Optional[str] = None
    username: Optional[str] = None
    raw_log: Optional[str] = None


class Alert(BaseModel):
    id: str
    type: str
    severity: str
    mitre_technique: Optional[str] = None
    description: str
    ip: Optional[str] = None
    username: Optional[str] = None
    count: int = 1
    first_seen: Optional[str] = None
    last_seen: Optional[str] = None
    related_log_ids: List[str] = []


class ChatRequest(BaseModel):
    message: str
    alert_id: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    model: str


class AnalyzeResponse(BaseModel):
    alert_id: str
    analysis: str
    model: str