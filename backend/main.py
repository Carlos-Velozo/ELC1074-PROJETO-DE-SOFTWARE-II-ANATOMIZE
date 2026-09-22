"""FastAPI entry point: wires together the routers and CORS config."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv() 
from .routers import evaluation, questions

app = FastAPI(title="Anatomize API")

# allows the local Vite dev server (localhost:5173) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(questions.router, prefix="/api")
app.include_router(evaluation.router, prefix="/api")


@app.get("/api/health")
def health_check() -> dict:
    return {"status": "ok"}
