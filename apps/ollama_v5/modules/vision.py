"""
Módulo de Visión Continua para JARVIS (VisionJARVIS)
Utiliza Qwen2.5-VL para ver la pantalla, verificar pasos de automatización,
buscar elementos visuales y detectar errores en tiempo real.
"""
import os
import sys
import json
import base64
import tempfile
import requests
from io import BytesIO
from PIL import ImageGrab

_VISION_DIR = os.path.dirname(os.path.abspath(__file__))
_OLLAMA_DIR = os.path.dirname(_VISION_DIR)
if _OLLAMA_DIR not in sys.path:
    sys.path.insert(0, _OLLAMA_DIR)

from ollama_opts import extra_generate, opciones_generate, vision_jpeg_quality, vision_max_side

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
MODELO_VISION = os.getenv("MODELO", "qwen2.5vl:7b")


def _comprimir_pil(img) -> bytes:
    """Baja resolución/JPEG para no inflar tokens de imagen en VL (VRAM 8 GB)."""
    if img.mode != "RGB":
        img = img.convert("RGB")
    lado = vision_max_side()
    img.thumbnail((lado, lado))
    buffered = BytesIO()
    img.save(buffered, format="JPEG", quality=vision_jpeg_quality(), optimize=True)
    return buffered.getvalue()


def _payload_vision(prompt: str, img_b64: str, usar_json: bool = False) -> dict:
    payload = {
        "model": MODELO_VISION,
        "prompt": prompt,
        "images": [img_b64],
        "stream": False,
        "options": opciones_generate(),
        **extra_generate(),
    }
    if usar_json:
        payload["format"] = "json"
    return payload


class VisionJARVIS:
    """Módulo de visión por computadora impulsado por Qwen2.5-VL."""

    def __init__(self, modelo: str = None):
        self.modelo = modelo or MODELO_VISION

    def capturar_pantalla(self, region: dict = None) -> tuple[str, str]:
        """
        Captura la pantalla completa o una región.
        Devuelve (ruta_archivo_png, imagen_en_base64).
        """
        try:
            # Handoff 2026-08-31: Intentar captura con mss primero, fallback a ImageGrab
            img = None
            try:
                import mss
                with mss.mss() as sct:
                    mon = sct.monitors[1] if len(sct.monitors) > 1 else sct.monitors[0]
                    sct_img = sct.grab(mon)
                    from PIL import Image
                    img = Image.frombytes("RGB", sct_img.size, sct_img.bgra, "raw", "BGRX")
            except Exception:
                img = None

            if img is None:
                if region:
                    bbox = (region["left"], region["top"], region["left"] + region["width"], region["top"] + region["height"])
                    img = ImageGrab.grab(bbox=bbox)
                else:
                    img = ImageGrab.grab(all_screens=True)

            img_bytes = _comprimir_pil(img)
            img_b64 = base64.b64encode(img_bytes).decode("utf-8")

            temp_path = os.path.join(tempfile.gettempdir(), "jarvis_vision_cap.jpg")
            with open(temp_path, "wb") as f:
                f.write(img_bytes)

            return temp_path, img_b64
        except Exception as e:
            print(f"[Vision] Error al capturar pantalla: {e}")
            return "", ""

    def analizar_imagen_bytes(self, img_bytes: bytes, prompt: str = "¿Qué observas en esta imagen? Describe los detalles.") -> str:
        """
        Handoff 2026-08-31: Procesa bytes de imagen directamente con Qwen2.5-VL.
        Permite que las fotos recibidas por Telegram sean interpretadas al instante.
        """
        try:
            from PIL import Image
            img = Image.open(BytesIO(img_bytes))
            img_b64 = base64.b64encode(_comprimir_pil(img)).decode("utf-8")

            payload = _payload_vision(
                f"Eres el asistente JARVIS. Analiza la imagen adjunta.\nPregunta/instrucción del usuario: {prompt}\nResponde en español de forma clara, útil y concisa.",
                img_b64,
            )
            payload["model"] = self.modelo

            res = requests.post(OLLAMA_URL, json=payload, timeout=60)
            if res.status_code == 200:
                return res.json().get("response", "").strip()
            return f"Error al procesar la imagen (Código {res.status_code})."
        except Exception as e:
            return f"Error al interpretar la imagen: {e}"

    def ver_pantalla(self, pregunta: str = "¿Qué hay en la pantalla? Describe los elementos principales.") -> str:
        """Captura la pantalla y pregunta a Qwen2.5-VL qué ve."""
        _, img_b64 = self.capturar_pantalla()
        if not img_b64:
            return "No se pudo capturar la pantalla."

        prompt = f"""Eres el sistema de visión de JARVIS. Analiza la captura de pantalla adjunta.
Pregunta del usuario: {pregunta}

Responde de forma concisa, directa y precisa en español."""

        payload = _payload_vision(prompt, img_b64)
        payload["model"] = self.modelo

        try:
            res = requests.post(OLLAMA_URL, json=payload, timeout=45)
            if res.status_code == 200:
                return res.json().get("response", "").strip()
            return f"Error al analizar pantalla (Status {res.status_code})."
        except Exception as e:
            return f"No se pudo conectar con el modelo de visión: {e}"

    def detectar_error(self) -> dict:
        """Verifica si en la pantalla hay mensajes de error, 'video no disponible', páginas rotas, etc."""
        _, img_b64 = self.capturar_pantalla()
        if not img_b64:
            return {"hay_error": False, "mensaje": "Sin captura"}

        prompt = """Analiza la captura de pantalla y determina si hay algún MENSAJE DE ERROR, fallo de reproducción, advertencia o problema visible (por ejemplo: "Este vídeo ya no está disponible", "Error 404", "No se puede acceder a este sitio", etc.).

Responde ÚNICAMENTE en formato JSON con este esquema exacto:
{
  "hay_error": true/false,
  "mensaje": "<descripción breve del error o null si todo está bien>"
}"""

        payload = _payload_vision(prompt, img_b64, usar_json=True)
        payload["model"] = self.modelo

        try:
            res = requests.post(OLLAMA_URL, json=payload, timeout=40)
            if res.status_code == 200:
                txt = res.json().get("response", "")
                data = json.loads(txt)
                return {
                    "hay_error": bool(data.get("hay_error", False)),
                    "mensaje": data.get("mensaje") or "Todo en orden."
                }
        except Exception as e:
            pass

        return {"hay_error": False, "mensaje": "No se detectaron errores."}

    def buscar_elemento(self, elemento: str) -> dict:
        """Busca un elemento visual en la pantalla y devuelve su ubicación aproximada."""
        _, img_b64 = self.capturar_pantalla()
        if not img_b64:
            return {"encontrado": False, "descripcion": "Sin captura"}

        prompt = f"""Busca el siguiente elemento en la captura de pantalla: "{elemento}".
Determina si está visible y en qué parte de la pantalla se encuentra (superior, inferior, centro, izquierda, derecha).

Responde ÚNICAMENTE en JSON con este esquema:
{{
  "encontrado": true/false,
  "ubicacion": "<ubicación en pantalla>",
  "descripcion": "<breve descripción visual>"
}}"""

        payload = _payload_vision(prompt, img_b64, usar_json=True)
        payload["model"] = self.modelo

        try:
            res = requests.post(OLLAMA_URL, json=payload, timeout=40)
            if res.status_code == 200:
                txt = res.json().get("response", "")
                return json.loads(txt)
        except Exception:
            pass

        return {"encontrado": False, "ubicacion": None, "descripcion": f"No se encontró '{elemento}'"}
