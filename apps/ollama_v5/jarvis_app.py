"""
JARVIS v5 — Aplicación Gráfica de Escritorio Stark Mark VII HUD
Conectada al motor de IA local (Ollama / qwen2.5vl:7b), telemetría en tiempo real,
memoria dual y síntesis de voz multimodal (Kokoro, Piper, Edge-TTS, SAPI5).
"""
import os
import sys
import json
import io
import contextlib
import threading
import webview
import requests
import psutil

# Directorios de trabajo
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(os.path.dirname(BASE_DIR))
HTML_PATH = os.path.join(BASE_DIR, "jarvis_ui.html")
MEMORIA_PATH = os.path.join(BASE_DIR, "jarvis_memoria.json")
SETTINGS_PATH = os.path.join(BASE_DIR, "jarvis_settings.json")

# Configurar sys.path
for p in [BASE_DIR, ROOT_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    import jarvis_v5
except ImportError as e:
    print(f"[JARVIS APP] Advertencia importando jarvis_v5: {e}")
    jarvis_v5 = None

try:
    import sounddevice as sd
except ImportError:
    sd = None

try:
    import tts_manager
except ImportError:
    tts_manager = None

# dotenv desde config/.env (cwd al lanzar el .bat es apps/ollama_v5)
try:
    from dotenv import load_dotenv
    _env_file = os.path.join(ROOT_DIR, "config", ".env")
    if os.path.isfile(_env_file):
        load_dotenv(_env_file)
except ImportError:
    pass


class JarvisBridgeAPI:
    """API puente expuesta a JavaScript en la interfaz gráfica."""

    def __init__(self):
        # GUI (hilo JS) y Telegram (hilo daemon) no pueden ejecutar Ollama a la vez
        self._orden_lock = threading.Lock()


    def get_memory(self) -> dict:
        """Retorna la memoria persistente actual."""
        if os.path.exists(MEMORIA_PATH):
            try:
                with open(MEMORIA_PATH, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"[API] Error cargando memoria: {e}")
        return {
            "usuario": {"nombre": "Alejandro", "navegador_favorito": "Opera"},
            "recuerdos": [],
            "ultimas_tareas": []
        }

    def get_system_status(self) -> dict:
        """Consulta el estado del servidor Ollama y del modelo."""
        ollama_ok = False
        modelos = []
        try:
            res = requests.get("http://localhost:11434/api/tags", timeout=2)
            if res.status_code == 200:
                ollama_ok = True
                data = res.json()
                modelos = [m.get("name") for m in data.get("models", [])]
        except Exception:
            pass

        return {
            "ollama_online": ollama_ok,
            "modelo_activo": "qwen2.5vl:7b",
            "modelos_instalados": modelos,
            "acciones_total": 25
        }

    def get_telemetry(self) -> dict:
        """Retorna telemetría de hardware en tiempo real (CPU, RAM, Disco)."""
        try:
            cpu = psutil.cpu_percent(interval=None)
            ram = psutil.virtual_memory().percent
            disk = psutil.disk_usage('C:\\').percent if os.name == 'nt' else 0
            return {
                "cpu": cpu,
                "ram": ram,
                "disk": disk,
                "success": True
            }
        except Exception as e:
            return {"cpu": 0, "ram": 0, "disk": 0, "error": str(e), "success": False}

    def get_audio_devices(self) -> dict:
        """Retorna información sobre los micrófonos y dispositivos de entrada."""
        devices = []
        has_mic = False
        default_mic = "Ninguno"

        if sd:
            try:
                all_devs = sd.query_devices()
                for idx, d in enumerate(all_devs):
                    if d.get("max_input_channels", 0) > 0:
                        has_mic = True
                        name = d.get("name", f"Micro {idx}")
                        devices.append({"id": idx, "name": name})
                if devices:
                    default_mic = devices[0]["name"]
            except Exception as e:
                print(f"[API] Error detectando dispositivos de audio: {e}")

        return {
            "has_mic": has_mic,
            "devices": devices,
            "default_mic": default_mic
        }

    def get_voice_presets(self) -> list:
        """Retorna todas las voces de IA configuradas (Kokoro, Piper, Edge-TTS)."""
        if tts_manager:
            return tts_manager.get_voice_presets()
        return []

    def speak(self, text: str, voice_id: str = "kokoro:bm_george", speed: float = 1.0) -> bool:
        """Reproduce voz mediante el motor de TTS seleccionado."""
        if tts_manager:
            return tts_manager.speak_async(text, voice_preset_id=voice_id, speed=float(speed))
        return False

    def stop_speaking(self) -> bool:
        """Detiene cualquier audio en reproducción."""
        if tts_manager:
            tts_manager.stop_speech()
        return True

    def get_settings(self) -> dict:
        """Carga los ajustes de usuario persistidos (tema, voz, velocidad, etc.)."""
        default_settings = {
            "theme": "gold",
            "voice_id": "kokoro:bm_george",
            "voice_rate": 1.0,
            "voice_pitch": 1.0,
            "auto_speak": True,
            "sound_effects": True
        }
        if os.path.exists(SETTINGS_PATH):
            try:
                with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    default_settings.update(data)
            except Exception:
                pass
        return default_settings

    def save_settings(self, new_settings: dict) -> bool:
        """Guarda los ajustes de usuario en archivo JSON."""
        try:
            current = self.get_settings()
            if isinstance(new_settings, dict):
                current.update(new_settings)
            with open(SETTINGS_PATH, "w", encoding="utf-8") as f:
                json.dump(current, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"[API] Error guardando ajustes: {e}")
            return False

    def send_message(self, user_text: str) -> dict:
        """
        Procesa una orden con la IA de JARVIS y ejecuta la acción real en el sistema.
        Devuelve la respuesta estructurada a la interfaz gráfica.
        """
        if not user_text or not str(user_text).strip():
            return {
                "respuesta": "No recibí ningún mensaje.",
                "accion": "ninguna",
                "exito": False
            }

        texto_limpio = str(user_text).strip()

        with self._orden_lock:
            return self._send_message_unlocked(texto_limpio)

    def _send_message_unlocked(self, texto_limpio: str) -> dict:
        # Cuerpo real de la orden; send_message solo serializa GUI vs Telegram
        if jarvis_v5 is None:
            return {
                "respuesta": "El motor de JARVIS no está disponible en este momento.",
                "accion": "error",
                "exito": False
            }

        buffer = io.StringIO()
        try:
            with contextlib.redirect_stdout(buffer):
                resultado = jarvis_v5.procesar_orden_con_ia(texto_limpio)
                jarvis_v5.ejecutar_accion(resultado, texto_limpio)

            output_lines = buffer.getvalue().strip().splitlines()
            mensajes_jarvis = [line.replace("Jarvis: ", "").strip() for line in output_lines if line.strip()]

            accion = resultado.get("accion", "conversar")

            if accion == "conversar":
                respuesta_final = (
                    resultado.get("parametros", {}).get("respuesta") or
                    (mensajes_jarvis[-1] if mensajes_jarvis else "Entendido.")
                )
            else:
                if mensajes_jarvis:
                    respuesta_final = "\n".join(mensajes_jarvis)
                elif resultado.get("mensaje_usuario"):
                    respuesta_final = resultado.get("mensaje_usuario")
                else:
                    respuesta_final = f"Acción '{accion}' ejecutada exitosamente."

            return {
                "respuesta": respuesta_final,
                "accion": accion,
                "parametros": resultado.get("parametros", {}),
                "confianza": resultado.get("confianza", 0.95),
                "exito": True
            }

        except Exception as e:
            return {
                "respuesta": f"Ocurrió un error al procesar la orden: {str(e)}",
                "accion": "error",
                "exito": False
            }


def main():
    if not os.path.exists(HTML_PATH):
        print(f"Error: No se encontró {HTML_PATH}")
        sys.exit(1)

    api = JarvisBridgeAPI()

    # Canal Telegram oficial (daemon, usa requests puro en modules/telegram_control.py).
    # Restaurado 2026-08-31: sin token el módulo solo imprime aviso y la GUI sigue normalmente.
    try:
        from modules.telegram_control import start_telegram_control
        start_telegram_control(process_orden=api.send_message, settings_path=SETTINGS_PATH)
    except Exception as e:
        print(f"[Telegram] No se pudo iniciar el bot asíncrono: {e}")

    window = webview.create_window(
        title="JARVIS v5 — Stark Mark VII Holographic HUD",
        url=HTML_PATH,
        js_api=api,
        width=1240,
        height=820,
        min_size=(960, 660),
        resizable=True,
        frameless=False,
        background_color="#070709",
        text_select=True,
    )

    webview.start(
        debug=False,
        gui="edgechromium",
    )


if __name__ == "__main__":
    main()
