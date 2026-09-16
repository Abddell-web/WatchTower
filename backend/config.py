import os


OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:0.6b")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "300"))


BRUTE_FORCE_ATTEMPTS = int(os.getenv("BRUTE_FORCE_ATTEMPTS", "5"))
BRUTE_FORCE_WINDOW_MIN = int(os.getenv("BRUTE_FORCE_WINDOW_MIN", "2"))
SUDO_FAIL_THRESHOLD = int(os.getenv("SUDO_FAIL_THRESHOLD", "3"))
SUDO_FAIL_WINDOW_MIN = int(os.getenv("SUDO_FAIL_WINDOW_MIN", "5"))


CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]