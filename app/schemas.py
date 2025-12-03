from pydantic import BaseModel, Field


class QuestionRequest(BaseModel):
    question: str = Field(..., description="Pergunta do estudante sobre qualquer assunto da área de tecnologia.")


class AnswerResponse(BaseModel):
    answer: str
    model: str
    source: str = "ollama"
