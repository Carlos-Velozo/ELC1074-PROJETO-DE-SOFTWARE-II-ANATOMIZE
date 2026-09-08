"""Translates provider-specific AI errors into clean, user-facing messages.

Groq and Gemini both raise their own SDK exceptions carrying an HTTP-like
status code (groq: `.status_code`, google-genai: `.code`). The gemini_*.py
and src/*.py modules wrap those as ErroGeracaoPerguntas/ErroAvaliacaoResposta
via `raise ... from erro`, so the original exception is still reachable
through `__cause__` here.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ErroAmigavel:
    status_code: int
    mensagem: str


def traduzir_erro_ia(erro: Exception) -> ErroAmigavel:
    causa = erro.__cause__ or erro
    codigo = getattr(causa, "status_code", None) or getattr(causa, "code", None)

    if codigo == 429:
        return ErroAmigavel(
            429,
            "A IA está recebendo muitas solicitações agora. Aguarde um minuto e tente novamente.",
        )
    if codigo == 404:
        return ErroAmigavel(
            503,
            "O modelo de IA configurado não está disponível no momento. Avise a equipe.",
        )
    if codigo in (401, 403):
        return ErroAmigavel(
            503,
            "Falha de autenticação com o serviço de IA. Avise a equipe para verificar a chave de API.",
        )
    if isinstance(codigo, int) and codigo >= 500:
        return ErroAmigavel(
            503,
            "O serviço de IA está indisponível no momento. Tente novamente em instantes.",
        )

    return ErroAmigavel(
        503,
        "Não foi possível processar a solicitação com a IA agora. Tente novamente em instantes.",
    )
