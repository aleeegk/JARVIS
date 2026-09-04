"""
JARVIS v5 — DEMO DE ESCRITORIO OFFLINE (UI Antigua / Stark Mark VII HUD)
Modo Demostración 100% desconectado de Ollama para visualizar paneles,
holograma 3D Three.js y comportamiento de controles sin consumo de recursos de IA.
"""
import os
import sys
import json
import webview
import psutil

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
HTML_PATH = os.path.join(BASE_DIR, "jarvis_ui.html")


class DemoJarvisBridgeAPI:
    """API puente simulada para modo DEMO offline sin llamadas a Ollama."""

    def __init__(self):
        self.mock_memory = {
            "usuario": {
                "nombre": "Alejandro (Modo Demo)",
                "navegador_favorito": "Opera",
                "tema": "gold"
            },
            "recuerdos": [
                "Demostración interactiva de la interfaz clásica de JARVIS.",
                "Ollama y GPU desconectados para optimización total de recursos.",
                "Telemetría de CPU y memoria activa en tiempo real."
            ],
            "ultimas_tareas": [
                {"tarea": "Verificación de controles visuales", "estado": "Completada"},
                {"tarea": "Prueba de esfera 3D Three.js", "estado": "Completada"},
                {"tarea": "Simulación de comandos sin LLM", "estado": "Activa"}
            ]
        }

    def get_memory(self) -> dict:
        """Retorna la memoria persistente simulada."""
        return self.mock_memory

    def get_system_status(self) -> dict:
        """Indica que el sistema opera en modo DEMO con Ollama desconectado."""
        return {
            "ollama_online": False,
            "modelo_activo": "MODO DEMO (Ollama desconectado)",
            "modelos_instalados": ["qwen2.5vl:7b (Inactivo en Demo)"],
            "acciones_total": 25,
            "nota": "Modo demostración para explorar botones y paneles sin consumo de GPU."
        }

    def get_telemetry(self) -> dict:
        """Retorna telemetría real del hardware (CPU, RAM, Disco) de forma ultra ligera."""
        try:
            cpu = psutil.cpu_percent(interval=None)
            ram = psutil.virtual_memory().percent
            disk = psutil.disk_usage('C:\\').percent if os.name == 'nt' else 45
            return {
                "cpu": cpu,
                "ram": ram,
                "disk": disk,
                "success": True
            }
        except Exception:
            return {"cpu": 15, "ram": 40, "disk": 50, "success": True}

    def get_audio_devices(self) -> dict:
        """Dispositivos de audio simulados para la demo."""
        return {
            "has_mic": True,
            "devices": [{"id": 0, "name": "Micrófono del Sistema (Modo Demo)"}],
            "default_mic": "Micrófono del Sistema (Modo Demo)"
        }

    def get_voice_presets(self) -> list:
        """Catálogo de voces informativas para la demo."""
        return [
            {"id": "kokoro:bm_george", "name": "JARVIS Clásico (Kokoro - Paul Bettany)", "engine": "Kokoro Offline"},
            {"id": "piper:es_ES-sharvard-medium", "name": "Español España Masculino (Piper)", "engine": "Piper Offline"},
            {"id": "edge:es-ES-AlvaroNeural", "name": "Alvaro Neural (Edge-TTS)", "engine": "Edge-TTS Online"},
            {"id": "win:Microsoft Helena", "name": "Helena (Windows SAPI5)", "engine": "Windows Nativo"}
        ]

    def speak(self, text: str, voice_id: str = "kokoro:bm_george", speed: float = 1.0) -> bool:
        """Simulación de reproducción sin cargar modelos pesados."""
        print(f"[DEMO TTS] Texto solicitado a reproducir: '{text}' (Voz: {voice_id})")
        return True

    def stop_speaking(self) -> bool:
        """Detiene audio."""
        return True

    def get_settings(self) -> dict:
        """Ajustes de usuario de la demo."""
        return {
            "theme": "gold",
            "voice_id": "kokoro:bm_george",
            "voice_rate": 1.0,
            "voice_pitch": 1.0,
            "auto_speak": False,
            "sound_effects": True
        }

    def save_settings(self, new_settings: dict) -> bool:
        """Confirma guardado simulado de ajustes."""
        return True

    def send_message(self, user_text: str) -> dict:
        """
        Responde inmediatamente explicando qué función haría cada orden en modo producción,
        garantizando que la PC no consuma recursos de Ollama ni GPU.
        """
        if not user_text or not str(user_text).strip():
            return {
                "respuesta": "No recibí ningún mensaje de prueba.",
                "accion": "ninguna",
                "exito": False
            }

        texto = str(user_text).strip().lower()

        # Respuestas simuladas temáticas
        if any(w in texto for w in ["youtube", "musica", "cancion", "play"]):
            explicacion = (
                "🎵 [MODO DEMO]: Orden detectada -> Reproducción de Música.\n"
                "En producción con Ollama activo, JARVIS abriría tu navegador preferido "
                "y buscaría o reproduciría la canción automáticamente usando el módulo 'musica.py'."
            )
            accion = "reproducir_musica"
        elif any(w in texto for w in ["pantalla", "captura", "screenshot", "mira"]):
            explicacion = (
                "📸 [MODO DEMO]: Orden detectada -> Captura y Visión.\n"
                "En producción, JARVIS capturaría la pantalla con 'mss' y enviaría los bytes "
                "al modelo multimodal qwen2.5vl:7b para analizar lo que estás viendo."
            )
            accion = "capturar_pantalla"
        elif any(w in texto for w in ["telegram", "bot", "mensaje"]):
            explicacion = (
                "📱 [MODO DEMO]: Orden detectada -> Control por Telegram.\n"
                "En producción, el daemon 'telegram_control.py' sincronizaría esta orden con tu chat "
                "privado de Telegram de forma remota y segura."
            )
            accion = "enviar_telegram"
        elif any(w in texto for w in ["email", "correo", "gmail"]):
            explicacion = (
                "📧 [MODO DEMO]: Orden detectada -> Gestor de Correo.\n"
                "En producción, JARVIS interactúa con la API de Gmail con OAuth2 o SMTP para redactar "
                "o leer tus correos no leídos con 'gestor_email.py'."
            )
            accion = "gestor_email"
        elif any(w in texto for w in ["hola", "buenos dias", "buenas", "quien eres"]):
            explicacion = (
                "👋 [MODO DEMO]: ¡Hola, Alejandro! Soy JARVIS en Modo Demostración de Escritorio.\n"
                "Esta interfaz clásica contiene el holograma 3D Three.js, partículas y telemetría de hardware "
                "completamente funcionales, con Ollama desconectado para que tu PC no se sobrecargue."
            )
            accion = "saludo"
        else:
            explicacion = (
                f"🤖 [MODO DEMO]: Orden recibida -> \"{user_text}\".\n"
                "En el modo completo de producción, esta orden se procesaría con Ollama (qwen2.5vl:7b) "
                "ejecutando la herramienta correspondiente sin consumo en esta sesión de demo."
            )
            accion = "simulacion"

        return {
            "respuesta": explicacion,
            "accion": accion,
            "parametros": {"modo": "demo_offline"},
            "confianza": 1.0,
            "exito": True
        }


def main():
    if not os.path.exists(HTML_PATH):
        print(f"Error: No se encontró el archivo HTML en {HTML_PATH}")
        sys.exit(1)

    api = DemoJarvisBridgeAPI()

    window = webview.create_window(
        title="🤖 JARVIS v5 — Stark Mark VII HUD [MODO DEMO OFFLINE]",
        url=f"file:///{HTML_PATH.replace(os.sep, '/')}",
        js_api=api,
        width=1200,
        height=800,
        min_size=(960, 600),
        resizable=True,
        frameless=False,
        easy_drag=False,
        text_select=True,
        confirm_close=False,
        background_color="#080b10"
    )

    webview.start(debug=False)


if __name__ == "__main__":
    main()
