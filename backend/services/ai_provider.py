"""Picks which AI provider implementation to use, based on AI_PROVIDER.

Defaults to Groq (Murilo's module in src/). Set AI_PROVIDER=gemini in .env
to test the Gemini alternative instead, without changing any route code.
"""

from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv()

if os.getenv("AI_PROVIDER", "groq").lower() == "gemini":
    from src.gemini_avaliador_respostas import (
        ErroAvaliacaoResposta,
        avaliar_resposta,
    )
    from src.gemini_gerador_perguntas import ErroGeracaoPerguntas, gerar_perguntas
else:
    from src import (
        ErroAvaliacaoResposta,
        ErroGeracaoPerguntas,
        avaliar_resposta,
        gerar_perguntas,
    )

__all__ = [
    "ErroAvaliacaoResposta",
    "ErroGeracaoPerguntas",
    "avaliar_resposta",
    "gerar_perguntas",
]
