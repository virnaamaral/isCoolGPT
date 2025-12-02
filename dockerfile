# =========================
# Stage 1 – build / deps
# =========================
FROM python:3.11-slim AS builder

# Variáveis para deixar o Python mais "limpo"
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Instala dependências do sistema que possam ser necessárias
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
  && rm -rf /var/lib/apt/lists/*

# Copia apenas requirements primeiro (melhor uso de cache)
COPY requirements.txt .

# Instala as dependências em uma pasta separada (/install)
RUN pip install --upgrade pip \
  && pip install --prefix=/install -r requirements.txt

# =========================
# Stage 2 – runtime
# =========================
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Copia libs Python instaladas do stage builder
COPY --from=builder /install /usr/local

# Copia o código da aplicação
COPY app ./app
COPY requirements.txt .
COPY README.md .

# Porta em que o Uvicorn vai expor a API
EXPOSE 8000

# Variáveis padrão (podem ser sobrescritas em runtime)
# IMPORTANTE: dentro do container, "localhost" é o container,
# então para falar com o Ollama no HOST (Windows / Docker Desktop),
# use: OLLAMA_BASE_URL=http://host.docker.internal:11434
ENV OLLAMA_BASE_URL="http://host.docker.internal:11434" \
    OLLAMA_MODEL="gemma3:1b"

# Comando de inicialização
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
