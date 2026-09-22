"""Route that evaluates a student's transcribed answer for a question,
plus the audio transcription endpoints used to produce that transcription."""

from __future__ import annotations

import base64
import json
import os
import re
from typing import Optional

import httpx
from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from google import genai
from pydantic import BaseModel

from ..services.ai_provider import ErroAvaliacaoResposta, avaliar_resposta
from ..services.errors import traduzir_erro_ia

router = APIRouter(tags=["evaluation"])

MIME_TYPES = {
    "mp3": "audio/mpeg",
    "wav": "audio/wav",
    "ogg": "audio/ogg",
    "m4a": "audio/mp4",
    "flac": "audio/flac",
    "webm": "audio/webm",
}

PROMPT = """Ouça este áudio e forneça uma resposta em JSON com esta exata estrutura:
{
  "transcription": "A transcrição completa e exata do áudio",
  "summary": "Um resumo conciso do que a pessoa está comunicando",
  "context": "A interpretação da mensagem, significado e intenção por trás das palavras"
}

Responda APENAS com o JSON, sem explicações adicionais. Tudo em português."""


def get_mime_type_from_url(url: str) -> str:
    ext = url.rsplit(".", 1)[-1].lower() if "." in url else ""
    return MIME_TYPES.get(ext, "audio/mpeg")


def parse_transcription_response(text: str) -> dict:
    """Extracts the JSON object from the model's text output, falling back
    to a plain-transcription shape if parsing fails."""
    match = re.search(r"\{[\s\S]*\}", text or "")
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    return {"transcription": text or "", "summary": "", "context": ""}


async def transcribe_audio_bytes(data: bytes, mime_type: str) -> dict:
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY não configurada")

    client = genai.Client(api_key=gemini_api_key)
    audio_part = {"inline_data": {"data": base64.b64encode(data).decode("utf-8"), "mime_type": mime_type}}

    ai_response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[audio_part, PROMPT],
    )
    text_transcribed = ai_response.text or ""
    return parse_transcription_response(text_transcribed)


class TranscribeAudioBody(BaseModel):
    audioUrl: Optional[str] = None


@router.post("/transcribe-audio")
async def transcribe_audio(body: TranscribeAudioBody) -> dict:
    audio_url = body.audioUrl
    if not audio_url:
        raise HTTPException(status_code=400, detail="Audio não fornecido")
    if not audio_url.startswith("http://") and not audio_url.startswith("https://"):
        raise HTTPException(status_code=400, detail="URL do áudio deve começar com http:// ou https://")

    try:
        async with httpx.AsyncClient() as http_client:
            res = await http_client.get(audio_url)
            res.raise_for_status()
    except httpx.HTTPError as erro:
        raise HTTPException(status_code=502, detail=f"Não foi possível baixar o áudio. Motivo: {erro}") from erro

    content_type = res.headers.get("content-type")
    mime_type = content_type or get_mime_type_from_url(audio_url) or "audio/mpeg"

    try:
        return await transcribe_audio_bytes(res.content, mime_type)
    except Exception as erro:
        raise HTTPException(status_code=500, detail=f"Não foi possível realizar a transcrição. Motivo: {erro}") from erro


@router.post("/transcribe-audio-file")
async def transcribe_audio_file(file: UploadFile = File(...)) -> dict:
    if not file:
        raise HTTPException(status_code=400, detail="Arquivo de áudio não fornecido")

    data = await file.read()
    mime_type = file.content_type or get_mime_type_from_url(file.filename or "") or "audio/mpeg"

    try:
        return await transcribe_audio_bytes(data, mime_type)
    except Exception as erro:
        raise HTTPException(status_code=500, detail=f"Não foi possível realizar a transcrição. Motivo: {erro}") from erro


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
        raise HTTPException(status_code=400, detail="Missing 'pergunta' or 'resposta_transcrita'.")

    try:
        avaliacao = avaliar_resposta(pergunta, resposta_transcrita)
    except (ValueError, TypeError) as erro:
        raise HTTPException(status_code=400, detail=str(erro)) from erro
    except ErroAvaliacaoResposta as erro:
        amigavel = traduzir_erro_ia(erro)
        raise HTTPException(status_code=amigavel.status_code, detail=amigavel.mensagem) from erro

    return avaliacao
