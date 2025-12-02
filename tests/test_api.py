# tests/test_api.py
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_check_returns_ok():
    """
    Teste bobinho: verifica se o /health responde 200 e contém 'ok'.
    """
    response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "ok"
    assert data.get("service") == "IsCoolGPT API"


def test_ask_with_mocked_ollama_contains_ollama(monkeypatch):
    """
    Teste bobinho 2:
    - mocka a função ask_ollama para não depender do servidor real
    - garante que a resposta contém 'ollama'
    """

    # import aqui dentro pra facilitar o monkeypatch
    from app import main as main_module

    async def fake_ask_ollama(question: str) -> str:
        # simulando um modelo 'obediente'
        return "esta resposta contém a palavra ollama para o teste"

    # substitui a função real pela fake
    monkeypatch.setattr(
        main_module, "ask_ollama", fake_ask_ollama, raising=True
    )

    payload = {"question": "por favor, inclua a palavra ollama na resposta"}

    response = client.post("/ask", json=payload)

    assert response.status_code == 200
    data = response.json()
    answer = data.get("answer", "")

    # aqui vem o seu critério bobinho:
    # a resposta precisa conter 'ollama'
    assert "ollama" in answer.lower()
    assert data.get("model") is not None


def test_ask_with_empty_question_returns_400():
    """
    Teste bobinho 3:
    - se a pergunta vier vazia, o backend deve retornar 400.
    """
    payload = {"question": "   "}  # só espaços

    response = client.post("/ask", json=payload)

    assert response.status_code == 400
    data = response.json()
    assert "pergunta não pode ser vazia" in data.get("detail", "").lower()
