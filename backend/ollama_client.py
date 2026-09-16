import requests
import config

SYSTEM_PROMPT = (
    "You are a senior SOC (Security Operations Center) analyst assistant embedded in a SIEM tool. "
    "You explain security alerts and log events in clear, practical terms. For every alert you are given, "
    "structure your answer as:\n"
    "1) What happened (plain language)\n"
    "2) Underlying vulnerability / attack technique (name it, include MITRE ATT&CK ID if relevant)\n"
    "3) Real-world risk if ignored\n"
    "4) Concrete prevention / remediation steps (specific config changes, tools, policies)\n"
    "Be concise, technical, and actionable. Do not pad with generic disclaimers."
)


class OllamaError(Exception):
    pass


def _chat(messages, temperature=0.3):
    url = f"{config.OLLAMA_HOST}/api/chat"
    payload = {
        "model": config.OLLAMA_MODEL,
        "messages": messages,
        "stream": False,
        "think": False,          
        "keep_alive": "30m",    
        "options": {
            "temperature": temperature,
            "num_predict": 700,  
        },
    }
    try:
        resp = requests.post(url, json=payload, timeout=config.OLLAMA_TIMEOUT)
        resp.raise_for_status()
    except requests.exceptions.ConnectionError:
        raise OllamaError(
            f"Could not reach Ollama at {config.OLLAMA_HOST}. "
            f"Make sure 'ollama serve' is running and the '{config.OLLAMA_MODEL}' model is pulled."
        )
    except requests.exceptions.ReadTimeout:
        raise OllamaError(
            f"Ollama didn't respond within {config.OLLAMA_TIMEOUT}s. The model may still be loading "
            f"into memory (first request is always slower), or '{config.OLLAMA_MODEL}' may be too large "
            f"for this machine — try a smaller variant, e.g. 'qwen3:4b'."
        )
    except requests.exceptions.RequestException as e:
        raise OllamaError(f"Ollama request failed: {e}")

    data = resp.json()
    return data.get("message", {}).get("content", "").strip()


def check_health() -> bool:
    try:
        resp = requests.get(f"{config.OLLAMA_HOST}/api/tags", timeout=5)
        return resp.status_code == 200
    except requests.exceptions.RequestException:
        return False


def warm_up():
    
    try:
        _chat([{"role": "user", "content": "ready"}])
    except OllamaError:
        pass


def analyze_alert(alert: dict, sample_logs: list) -> str:
    logs_txt = "\n".join(f"- {l.get('raw_log') or l.get('event')}" for l in sample_logs[:10])
    user_prompt = (
        f"Alert type: {alert['type']}\n"
        f"Severity: {alert['severity']}\n"
        f"MITRE technique: {alert.get('mitre_technique') or 'n/a'}\n"
        f"Description: {alert['description']}\n"
        f"Source IP: {alert.get('ip') or 'n/a'}\n"
        f"Username involved: {alert.get('username') or 'n/a'}\n"
        f"Occurrences: {alert.get('count', 1)}\n\n"
        f"Related raw log samples:\n{logs_txt}\n\n"
        "Explain this alert and how to prevent it, following the required structure."
    )
    return _chat([
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ])


def chat_with_context(message: str, alert: dict | None, stats_summary: str) -> str:
    context = ""
    if alert:
        context = (
            f"The user is currently looking at this alert:\n"
            f"Type: {alert['type']} | Severity: {alert['severity']} | "
            f"MITRE: {alert.get('mitre_technique')}\n"
            f"Description: {alert['description']}\n\n"
        )
    else:
        context = f"Current SOC dashboard summary:\n{stats_summary}\n\n"

    return _chat([
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": context + "Question: " + message},
    ])