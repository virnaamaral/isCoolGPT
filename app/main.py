# app/main.py
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse

from app.schemas import QuestionRequest, AnswerResponse
from app.services.ollama_client import ask_ollama, OllamaError
from app.config import OLLAMA_MODEL

app = FastAPI(
    title="IsCoolGPT API",
    description="Assistente de estudos em Cloud Computing usando FastAPI + Ollama.",
    version="0.1.0",
)

# Diretório base do módulo app (pra achar a pasta static)
BASE_DIR = Path(__file__).resolve().parent

# Servir arquivos estáticos (HTML, CSS, JS) em /static
app.mount(
    "/static",
    StaticFiles(directory=BASE_DIR / "static"),
    name="static",
)

# Página inicial: devolve o index.html
@app.get("/", response_class=HTMLResponse)
async def read_root():
    index_path = BASE_DIR / "static" / "index.html"
    return index_path.read_text(encoding="utf-8")


# CORS liberado pra facilitar o front em HTML/JS (podemos deixar mais restrito depois)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # em produção você pode restringir
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """
    Endpoint simples de saúde da aplicação.
    Usado pelo CI, monitoramento e para saber se o backend está no ar.
    """
    return {"status": "ok", "service": "IsCoolGPT API"}


@app.post("/ask", response_model=AnswerResponse)
async def ask(request: QuestionRequest):
    """
    Recebe uma pergunta do estudante e retorna a resposta do LLM via Ollama.
    """
    question = request.question.strip()

    if not question:
        raise HTTPException(status_code=400, detail="A pergunta não pode ser vazia.")

    try:
        answer = await ask_ollama(question)
    except OllamaError as exc:
        # Erro ao falar com o servidor Ollama
        raise HTTPException(
            status_code=502,
            detail=f"Falha ao consultar o modelo de linguagem: {exc}",
        ) from exc

    # Aqui a resposta já vem "pronta" do modelo. Em testes futuros,
    # vamos checar se, por exemplo, quando a pergunta pede 'ollama',
    # essa palavra de fato aparece na resposta.
    return AnswerResponse(answer=answer, model=OLLAMA_MODEL)
