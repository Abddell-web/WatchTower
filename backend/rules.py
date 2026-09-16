import re
from collections import defaultdict
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import uuid

import config

SUDO_FAIL_RE = re.compile(r"incorrect password attempt", re.IGNORECASE)
NEW_USER_RE = re.compile(r"new user account created", re.IGNORECASE)
SQLI_RE = re.compile(r"(\bor\b\s+1=1|union\s+select|--\s|;--)", re.IGNORECASE)
SCAN_PROBE_RE = re.compile(r"(wp-admin|phpmyadmin|port scan|probing)", re.IGNORECASE)


def parser_timestamp(chaine_timestamp, annee=None):
    if not chaine_timestamp:
        return None
    if annee is None:
        annee = datetime.now().year
    try:
        propre = " ".join(chaine_timestamp.split())
        return datetime.strptime(f"{annee} {propre}", "%Y %b %d %H:%M:%S")
    except ValueError:
        return None


def _new_alert(alert_type, severity, mitre, description, ip=None, username=None,
               count=1, first_seen=None, last_seen=None, related_ids=None):
    return {
        "id": str(uuid.uuid4()),
        "type": alert_type,
        "severity": severity,
        "mitre_technique": mitre,
        "description": description,
        "ip": ip,
        "username": username,
        "count": count,
        "first_seen": first_seen,
        "last_seen": last_seen,
        "related_log_ids": related_ids or [],
    }


def detect_critical(logs: List[dict]) -> List[dict]:
    return [
        _new_alert(
            "Critical System Event", "CRITICAL", "T1499",
            log["event"], ip=log.get("ip"), username=log.get("username"),
            first_seen=log.get("timestamp"), last_seen=log.get("timestamp"),
            related_ids=[log["id"]],
        )
        for log in logs if log.get("severity") == "CRITICAL"
    ]


def detect_brute_force(logs: List[dict]) -> List[dict]:
    alerts = []
    history: Dict[str, list] = defaultdict(list)
    window = timedelta(minutes=config.BRUTE_FORCE_WINDOW_MIN)

    for log in logs:
        if "failed password" not in log.get("event", "").lower() and \
           "invalid user" not in log.get("event", "").lower():
            continue
        ip = log.get("ip")
        ts = parser_timestamp(log.get("timestamp"))
        if not ip or not ts:
            continue

        history[ip] = [(t, lid) for (t, lid) in history[ip] if ts - t <= window]
        history[ip].append((ts, log["id"]))

        if len(history[ip]) >= config.BRUTE_FORCE_ATTEMPTS:
            times = [t for t, _ in history[ip]]
            ids = [lid for _, lid in history[ip]]
            alerts.append(_new_alert(
                "Brute Force Attempt", "HIGH", "T1110 - Brute Force",
                f"{len(times)} failed login attempts from {ip} within "
                f"{config.BRUTE_FORCE_WINDOW_MIN} minute(s).",
                ip=ip, username=log.get("username"), count=len(times),
                first_seen=min(times).isoformat(), last_seen=max(times).isoformat(),
                related_ids=ids,
            ))
            history[ip] = []  
    return alerts


def detect_privilege_escalation(logs: List[dict]) -> List[dict]:
    alerts = []
    history: Dict[str, list] = defaultdict(list)
    window = timedelta(minutes=config.SUDO_FAIL_WINDOW_MIN)

    for log in logs:
        if not SUDO_FAIL_RE.search(log.get("event", "")):
            continue
        user = log.get("username") or "unknown"
        ts = parser_timestamp(log.get("timestamp"))
        if not ts:
            continue
        history[user] = [(t, lid) for (t, lid) in history[user] if ts - t <= window]
        history[user].append((ts, log["id"]))

        if len(history[user]) >= config.SUDO_FAIL_THRESHOLD:
            times = [t for t, _ in history[user]]
            ids = [lid for _, lid in history[user]]
            alerts.append(_new_alert(
                "Privilege Escalation Attempt", "HIGH", "T1548 - Abuse Elevation Control",
                f"User '{user}' failed sudo authentication {len(times)} times in "
                f"{config.SUDO_FAIL_WINDOW_MIN} minute(s).",
                username=user, count=len(times),
                first_seen=min(times).isoformat(), last_seen=max(times).isoformat(),
                related_ids=ids,
            ))
            history[user] = []
    return alerts


def detect_new_user_creation(logs: List[dict]) -> List[dict]:
    return [
        _new_alert(
            "New User Account Created", "MEDIUM", "T1136 - Create Account",
            log["event"], ip=log.get("ip"), username=log.get("username"),
            first_seen=log.get("timestamp"), last_seen=log.get("timestamp"),
            related_ids=[log["id"]],
        )
        for log in logs if NEW_USER_RE.search(log.get("event", ""))
    ]


def detect_web_probing(logs: List[dict]) -> List[dict]:
    alerts = []
    for log in logs:
        event = log.get("event", "")
        if SQLI_RE.search(event):
            alerts.append(_new_alert(
                "Possible SQL Injection Attempt", "HIGH", "T1190 - Exploit Public-Facing App",
                event, ip=log.get("ip"), first_seen=log.get("timestamp"),
                last_seen=log.get("timestamp"), related_ids=[log["id"]],
            ))
        elif SCAN_PROBE_RE.search(event):
            alerts.append(_new_alert(
                "Reconnaissance / Scanning Activity", "MEDIUM", "T1595 - Active Scanning",
                event, ip=log.get("ip"), first_seen=log.get("timestamp"),
                last_seen=log.get("timestamp"), related_ids=[log["id"]],
            ))
    return alerts


def analyze_logs(logs: List[dict]) -> List[dict]:
    alerts = []
    alerts += detect_critical(logs)
    alerts += detect_brute_force(logs)
    alerts += detect_privilege_escalation(logs)
    alerts += detect_new_user_creation(logs)
    alerts += detect_web_probing(logs)

    severity_rank = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "WARNING": 3, "LOW": 4}
    alerts.sort(key=lambda a: severity_rank.get(a["severity"], 5))
    return alerts


def compute_stats(logs: List[dict], alerts: List[dict]) -> dict:
    severity_counts = defaultdict(int)
    source_counts = defaultdict(int)
    ip_counts = defaultdict(int)
    hourly = defaultdict(int)

    for log in logs:
        severity_counts[log.get("severity", "UNKNOWN")] += 1
        source_counts[log.get("source") or "unknown"] += 1
        if log.get("ip"):
            ip_counts[log["ip"]] += 1
        ts = parser_timestamp(log.get("timestamp"))
        if ts:
            hourly[ts.strftime("%H:00")] += 1

    top_ips = sorted(ip_counts.items(), key=lambda x: -x[1])[:8]
    timeline = sorted(hourly.items())

    return {
        "total_logs": len(logs),
        "total_alerts": len(alerts),
        "severity_counts": dict(severity_counts),
        "source_counts": dict(source_counts),
        "top_ips": [{"ip": ip, "count": c} for ip, c in top_ips],
        "timeline": [{"hour": h, "count": c} for h, c in timeline],
        "alert_type_counts": {
            t: sum(1 for a in alerts if a["type"] == t)
            for t in {a["type"] for a in alerts}
        },
    }