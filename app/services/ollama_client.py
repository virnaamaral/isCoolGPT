# app/services/ollama_client.py
import httpx

from app.config import OLLAMA_BASE_URL, OLLAMA_MODEL, SYSTEM_PROMPT


class OllamaError(Exception):
    """Erro genérico ao falar com o servidor Ollama."""


async def ask_ollama(question: str) -> str:
    """
    Envia a pergunta para o modelo do Ollama e retorna apenas o texto da resposta.
    """
    url = OLLAMA_BASE_URL.rstrip("/") + "/api/chat"

    payload = {
        "model": OLLAMA_MODEL,
        "stream": False,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": question},
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
    except httpx.HTTPError as exc:
        raise OllamaError(f"Erro HTTP ao chamar Ollama: {exc}") from exc

    data = response.json()

    # Formato típico da resposta do /api/chat do Ollama
    try:
        message = data["message"]["content"]
    except (KeyError, TypeError) as exc:
        raise OllamaError(f"Resposta inesperada do Ollama: {data}") from exc

    return message
