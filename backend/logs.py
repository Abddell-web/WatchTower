import os
import platform
import re
import subprocess
import sys
import uuid
from datetime import datetime


def detecter_os():
    return platform.system()


def trouver_fichiers_logs(os_type):
    if os_type == "Linux":
        candidats = [
            "/var/log/syslog",
            "/var/log/auth.log",
            "/var/log/messages",
            "/var/log/secure",
            "/var/log/kern.log",
            "/var/log/dpkg.log",
        ]
        return [c for c in candidats if os.path.isfile(c)]

    if os_type == "Darwin":
        candidats = [
            "/var/log/system.log",
            "/var/log/install.log",
        ]
        return [c for c in candidats if os.path.isfile(c)]

    if os_type == "Windows":
        return ["EventLog:System", "EventLog:Application", "EventLog:Security"]

    return []


SYSLOG_RE = re.compile(
    r"^(?P<timestamp>\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+"
    r"(?P<host>\S+)\s+"
    r"(?P<source>[\w\.\-/]+)(\[\d+\])?:\s*"
    r"(?P<message>.*)$"
)

IP_RE = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")
USER_RE = re.compile(r"\b(?:user|for|by)\s+([A-Za-z0-9_\-\.]+)", re.IGNORECASE)

SEVERITY_KEYWORDS = {
    "CRITICAL": ["critical", "panic", "fatal"],
    "ERROR": ["error", "fail", "denied", "invalid"],
    "WARNING": ["warning", "warn"],
    "INFO": ["accepted", "started", "success", "info", "opened", "closed"],
}


def determiner_severite(message):
    msg = message.lower()
    for niveau, mots_cles in SEVERITY_KEYWORDS.items():
        if any(mot in msg for mot in mots_cles):
            return niveau
    return "UNKNOWN"


def nouvelle_entree(timestamp, source, event, raw_log):
    ip_match = IP_RE.search(event)
    user_match = USER_RE.search(event)
    return {
        "id": str(uuid.uuid4()),
        "timestamp": timestamp,
        "source": source,
        "severity": determiner_severite(event),
        "event": event.strip(),
        "ip": ip_match.group(0) if ip_match else None,
        "username": user_match.group(1) if user_match else None,
        "raw_log": raw_log.strip(),
    }


def parser_ligne_syslog(ligne):
    match = SYSLOG_RE.match(ligne.strip())
    if not match:
        return None
    return nouvelle_entree(
        match.group("timestamp"), match.group("source"), match.group("message"), ligne
    )


def lire_logs_linux_mac(chemins_fichiers, max_lignes=2000):
    entrees = []
    for chemin in chemins_fichiers:
        try:
            with open(chemin, "r", errors="ignore") as f:
                lignes = f.readlines()[-max_lignes:]
            for ligne in lignes:
                if not ligne.strip():
                    continue
                entree = parser_ligne_syslog(ligne)
                if entree is None:
                    entree = nouvelle_entree(
                        None, os.path.basename(chemin), ligne, ligne
                    )
                entrees.append(entree)
        except PermissionError:
            print(
                f"Permission refusee pour {chemin} ",
                file=sys.stderr,
            )
        except Exception as e:
            print(f"Erreur pour {chemin}: {e}", file=sys.stderr)
    return entrees


def lire_logs_windows(noms_journaux, max_evenements=500):
    entrees = []
    for journal in noms_journaux:
        nom = journal.split(":")[1]
        try:
            cmd = ["wevtutil", "qe", nom, f"/c:{max_evenements}", "/rd:true", "/f:text"]
            resultat = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            blocs = resultat.stdout.split("\n\n")
            for bloc in blocs:
                if not bloc.strip():
                    continue
                event_id_match = re.search(r"Event ID:\s*(\d+)", bloc)
                date_match = re.search(r"Date:\s*(.+)", bloc)
                source_match = re.search(r"Source:\s*(.+)", bloc)
                niveau_match = re.search(r"Level:\s*(.+)", bloc)

                timestamp = date_match.group(1).strip() if date_match else None
                source = source_match.group(1).strip() if source_match else nom
                severity = (
                    niveau_match.group(1).strip().upper()
                    if niveau_match
                    else determiner_severite(bloc)
                )
                event_txt = (
                    f"EventID {event_id_match.group(1)}"
                    if event_id_match
                    else bloc.strip()[:200]
                )

                entree = nouvelle_entree(timestamp, source, event_txt, bloc)
                entree["severity"] = severity
                entrees.append(entree)
        except FileNotFoundError:
            print(
                "file non trouve", file=sys.stderr
            )
        except Exception as e:
            print(f"Erreur lecture: {nom}: {e}", file=sys.stderr)
    return entrees


def loggs(max_lignes=2000):
    os_type = detecter_os()
    print(f"OS detecte : {os_type}")

    chemins = trouver_fichiers_logs(os_type)
    if not chemins:
        print("Aucun log trouve pour cet OS.")
        return {
            "os": os_type,
            "date_analyse": datetime.now().isoformat(),
            "nombre_entrees": 0,
            "logs": [],
        }

    if os_type in ("Linux", "Darwin"):
        entrees = lire_logs_linux_mac(chemins, max_lignes=max_lignes)
    elif os_type == "Windows":
        entrees = lire_logs_windows(chemins, max_evenements=max_lignes)
    else:
        entrees = []

    sortie = {
        "os": os_type,
        "date_analyse": datetime.now().isoformat(),
        "nombre_entrees": len(entrees),
        "logs": entrees,
    }

    return sortie