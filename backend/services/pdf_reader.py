"""Extracts plain text from an uploaded PDF file."""

from __future__ import annotations

from io import BytesIO

from pypdf import PdfReader


def extract_text(pdf_bytes: bytes) -> str:
    """Reads all pages of a PDF and returns their concatenated text."""

    reader = PdfReader(BytesIO(pdf_bytes))
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(pages).strip()
