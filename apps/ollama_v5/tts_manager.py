"""
tts_manager.py — Gestor Unificado de Motores de Voz para JARVIS v5
Soporta:
1. Kokoro TTS (100% Offline, IA Neural Ultra-Realista)
2. Piper TTS (100% Offline, Rápido y Ligero)
3. Edge-TTS (Online Neural, 100% Gratis sin API Key)
"""
import os
import sys
import asyncio
import threading
import sounddevice as sd
import numpy as np
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
TTS_MODELS_DIR = BASE_DIR / "models_tts"

_kokoro_instance = None
_piper_voices = {}

# Lista de voces predefinidas y configuradas
VOICE_PRESETS = [
    # KOKORO TTS (OFFLINE IA NEURAL)
    {"id": "kokoro:bm_george", "name": "👑 JARVIS Oficial (Kokoro AI - Offline)", "engine": "kokoro", "voice": "bm_george", "lang": "en-us"},
    {"id": "kokoro:bm_lewis", "name": "🇬🇧 Mayordomo Británico (Kokoro AI - Offline)", "engine": "kokoro", "voice": "bm_lewis", "lang": "en-us"},
    {"id": "kokoro:am_adam", "name": "🇺🇸 Adam AI (Kokoro AI - Offline)", "engine": "kokoro", "voice": "am_adam", "lang": "en-us"},
    {"id": "kokoro:af_bella", "name": "👩 Bella AI (Kokoro AI - Offline)", "engine": "kokoro", "voice": "af_bella", "lang": "en-us"},

    # PIPER TTS (OFFLINE RÁPIDO)
    {"id": "piper:es_ES-sharvard-medium", "name": "🇪🇸 Sharvard Español (Piper - Offline)", "engine": "piper", "model": "es_ES-sharvard-medium.onnx"},
    {"id": "piper:es_ES-carlfm-x_low", "name": "🇪🇸 Carlos Español (Piper - Offline)", "engine": "piper", "model": "es_ES-carlfm-x_low.onnx"},
    {"id": "piper:en_GB-alan-medium", "name": "🇬🇧 Alan Butler (Piper - Offline)", "engine": "piper", "model": "en_GB-alan-medium.onnx"},

    # EDGE-TTS (ONLINE NEURAL GRATIS)
    {"id": "edge:es-ES-AlvaroNeural", "name": "🇪🇸 Álvaro Neural HD (Edge-TTS - Online)", "engine": "edge", "voice": "es-ES-AlvaroNeural"},
    {"id": "edge:es-ES-ElviraNeural", "name": "🇪🇸 Elvira Neural HD (Edge-TTS - Online)", "engine": "edge", "voice": "es-ES-ElviraNeural"},
    {"id": "edge:es-MX-JorgeNeural", "name": "🇲🇽 Jorge Neural HD (Edge-TTS - Online)", "engine": "edge", "voice": "es-MX-JorgeNeural"},
    {"id": "edge:en-GB-RyanNeural", "name": "🇬🇧 Ryan JARVIS HD (Edge-TTS - Online)", "engine": "edge", "voice": "en-GB-RyanNeural"},
]

def get_voice_presets():
    return VOICE_PRESETS

def _get_kokoro():
    global _kokoro_instance
    if _kokoro_instance is None:
        try:
            from kokoro_onnx import Kokoro
            model_path = TTS_MODELS_DIR / "kokoro-v0_19.onnx"
            voices_path = TTS_MODELS_DIR / "voices.bin"
            if model_path.exists() and voices_path.exists():
                _kokoro_instance = Kokoro(str(model_path), str(voices_path))
        except Exception as e:
            print("[TTS] Error cargando Kokoro:", e)
    return _kokoro_instance

def _get_piper(model_filename: str):
    global _piper_voices
    if model_filename not in _piper_voices:
        try:
            from piper.voice import PiperVoice
            model_path = TTS_MODELS_DIR / model_filename
            json_path = TTS_MODELS_DIR / f"{model_filename}.json"
            if model_path.exists() and json_path.exists():
                _piper_voices[model_filename] = PiperVoice.load(str(model_path), config_path=str(json_path))
        except Exception as e:
            print(f"[TTS] Error cargando Piper ({model_filename}):", e)
    return _piper_voices.get(model_filename)

def speak_text_sync(text: str, voice_preset_id: str = "kokoro:bm_george", speed: float = 1.0) -> bool:
    """Sintetiza y reproduce el audio en un hilo de fondo."""
    if not text or not str(text).strip():
        return False

    # Limpiar sintaxis de markdown o URLs para pronunciación natural
    import re
    clean_text = str(text)
    clean_text = re.sub(r'```[\s\S]*?```', 'bloque de código omitido', clean_text)
    clean_text = re.sub(r'`([^`]+)`', r'\1', clean_text)
    clean_text = re.sub(r'[*_~#]', '', clean_text)
    clean_text = re.sub(r'https?://\S+', 'enlace web', clean_text).strip()

    if not clean_text:
        return False

    preset = next((p for p in VOICE_PRESETS if p["id"] == voice_preset_id), None)
    if not preset:
        preset = VOICE_PRESETS[0]

    engine = preset.get("engine")

    try:
        # 1. KOKORO TTS
        if engine == "kokoro":
            kokoro = _get_kokoro()
            if kokoro:
                voice_name = preset.get("voice", "bm_george")
                lang = preset.get("lang", "en-us")
                samples, sample_rate = kokoro.create(clean_text, voice=voice_name, speed=speed, lang=lang)
                sd.stop()
                sd.play(samples, sample_rate)
                sd.wait()
                return True

        # 2. PIPER TTS
        elif engine == "piper":
            model_file = preset.get("model")
            voice = _get_piper(model_file)
            if voice:
                chunks = list(voice.synthesize(clean_text))
                if chunks:
                    audio_float = np.concatenate([c.audio_float_array for c in chunks])
                    sd.stop()
                    sd.play(audio_float, samplerate=voice.config.sample_rate)
                    sd.wait()
                    return True

        # 3. EDGE-TTS
        elif engine == "edge":
            import edge_tts
            voice_name = preset.get("voice", "es-ES-AlvaroNeural")
            
            async def _run_edge():
                communicate = edge_tts.Communicate(clean_text, voice_name)
                audio_data = b""
                async for chunk in communicate.stream():
                    if chunk["type"] == "audio":
                        audio_data += chunk["data"]
                return audio_data

            audio_bytes = asyncio.run(_run_edge())
            if audio_bytes:
                import io
                import soundfile as sf
                data, fs = sf.read(io.BytesIO(audio_bytes), dtype='float32')
                sd.stop()
                sd.play(data, fs)
                sd.wait()
                return True

    except Exception as e:
        print(f"[TTS] Error reproduciendo con {engine}: {e}")

    return False

def speak_async(text: str, voice_preset_id: str = "kokoro:bm_george", speed: float = 1.0):
    """Ejecuta la síntesis de voz en segundo plano para no bloquear."""
    t = threading.Thread(target=speak_text_sync, args=(text, voice_preset_id, speed), daemon=True)
    t.start()
    return True

def stop_speech():
    """Detiene cualquier audio."""
    try:
        sd.stop()
    except Exception:
        pass
