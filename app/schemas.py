# app/schemas.py
from pydantic import BaseModel, Field


class QuestionRequest(BaseModel):
    question: str = Field(..., description="Pergunta do estudante sobre Cloud Computing.")


class AnswerResponse(BaseModel):
    answer: str
    model: str
    source: str = "ollama"
