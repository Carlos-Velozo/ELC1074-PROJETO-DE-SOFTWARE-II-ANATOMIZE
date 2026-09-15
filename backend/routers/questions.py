"""Route that turns an uploaded PDF into a list of generated questions."""

from __future__ import annotations

import os

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from ..services.ai_provider import ErroGeracaoPerguntas, gerar_perguntas
from ..services.errors import traduzir_erro_ia
from ..services.pdf_reader import extract_text

router = APIRouter(tags=["questions"])

# rough char budget to stay under each provider's tokens-per-minute limit
# (~4 chars per token, leaving room for the prompt template, schema and output).
# Groq's free tier caps at 8K TPM; Gemini's is much higher, so it can take more text.
MAX_CONTEXT_CHARS_BY_PROVIDER = {
    "groq": 16_000,
    "gemini": 80_000,
}


@router.post("/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    quantidade: int = Form(3),
) -> dict:
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF.")

    pdf_bytes = await file.read()
    texto = extract_text(pdf_bytes)

    if not texto:
        raise HTTPException(
            status_code=422, detail="Could not extract any text from the PDF."
        )

    provider = os.getenv("AI_PROVIDER", "groq").lower()
    limite = MAX_CONTEXT_CHARS_BY_PROVIDER.get(provider, MAX_CONTEXT_CHARS_BY_PROVIDER["groq"])
    texto = texto[:limite]

    try:
        perguntas = gerar_perguntas(texto, quantidade)
    except (ValueError, TypeError) as erro:
        raise HTTPException(status_code=400, detail=str(erro)) from erro
    except ErroGeracaoPerguntas as erro:
        amigavel = traduzir_erro_ia(erro)
        raise HTTPException(
            status_code=amigavel.status_code, detail=amigavel.mensagem
        ) from erro

    return {"pdfName": file.filename, "perguntas": perguntas}
