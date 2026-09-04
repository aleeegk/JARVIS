"""
Opciones de Ollama compartidas (texto + visión).

Siguiente agente: la VRAM la come el KV cache de qwen2.5vl:7b, no Python.
RTX 5060 8 GB: default num_ctx 3072 (antes 16384). Override en config/.env.
Flash-attn / KV q8_0 van en Iniciar_Ollama_Ahorro_VRAM.bat (proceso ollama serve).
"""
from __future__ import annotations

import os


def _entero(nombre: str, defecto: int, minimo: int, maximo: int) -> int:
    try:
        val = int(os.getenv(nombre, str(defecto)))
    except (TypeError, ValueError):
        val = defecto
    return max(minimo, min(maximo, val))


def num_ctx() -> int:
    return _entero("OLLAMA_NUM_CTX", 3072, 2048, 8192)


def num_predict() -> int:
    return _entero("OLLAMA_NUM_PREDICT", 320, 64, 2048)


def keep_alive() -> str:
    return (os.getenv("OLLAMA_KEEP_ALIVE") or "10m").strip() or "10m"


def vision_max_side() -> int:
    return _entero("VISION_MAX_SIDE", 768, 384, 1280)


def vision_jpeg_quality() -> int:
    return _entero("VISION_JPEG_QUALITY", 60, 40, 85)


def opciones_generate(predict: int | None = None) -> dict:
    return {
        "num_ctx": num_ctx(),
        "num_predict": num_predict() if predict is None else predict,
    }


def extra_generate() -> dict:
    """Campos de primer nivel del POST /api/generate (keep_alive descarga el modelo al ociar)."""
    return {"keep_alive": keep_alive()}
