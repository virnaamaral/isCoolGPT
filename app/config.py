# app/config.py
import os

# URL do servidor do Ollama (em dev, geralmente http://localhost:11434)
OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

# Nome do modelo a ser usado
OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "gemma3.1b")

# Prompt de sistema (personality do IsCoolGPT)
SYSTEM_PROMPT: str = os.getenv(
    "SYSTEM_PROMPT",
    (
        "Você é o IsCoolGPT, um tutor paciente e didático de Cloud Computing. "
        "Explique conceitos de forma clara, com exemplos práticos, "
        "e conecte os temas com AWS, containers, CI/CD e boas práticas quando fizer sentido. "
        "Se não souber algo, diga que não sabe em vez de inventar."
    ),
)