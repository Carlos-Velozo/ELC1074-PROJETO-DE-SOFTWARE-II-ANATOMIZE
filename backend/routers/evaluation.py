"""Route that evaluates a student's transcribed answer for a question."""

from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException, Request

from ..services.ai_provider import ErroAvaliacaoResposta, avaliar_resposta
from ..services.errors import traduzir_erro_ia

router = APIRouter(tags=["evaluation"])


@router.post("/avaliar")
async def avaliar(request: Request) -> dict:
    content_type = request.headers.get("content-type", "")

    # the frontend sends multipart form data when an audio recording is attached,
    # and plain JSON when the answer was typed
    if content_type.startswith("multipart/form-data"):
        form = await request.form()
        pergunta_raw = form.get("pergunta")
        resposta_transcrita = form.get("resposta_transcrita")
        pergunta = json.loads(pergunta_raw) if pergunta_raw else None
        # the raw audio file is not used yet: the client already sends the transcription
    else:
        body = await request.json()
        pergunta = body.get("pergunta")
        resposta_transcrita = body.get("resposta_transcrita")

    if not pergunta or not resposta_transcrita:
        raise HTTPException(
            status_code=400, detail="Missing 'pergunta' or 'resposta_transcrita'."
        )

    try:
        avaliacao = avaliar_resposta(pergunta, resposta_transcrita)
    except (ValueError, TypeError) as erro:
        raise HTTPException(status_code=400, detail=str(erro)) from erro
    except ErroAvaliacaoResposta as erro:
        amigavel = traduzir_erro_ia(erro)
        raise HTTPException(
            status_code=amigavel.status_code, detail=amigavel.mensagem
        ) from erro

    return avaliacao
