"""
Módulo de Productividad para JARVIS:
- Google Calendar (Creación directa de eventos)
- Traductor y Utilidades de Consulta
"""
import urllib.parse
import webbrowser

class ProductividadJARVIS:
    """Controlador de calendario y herramientas de productividad."""

    @staticmethod
    def crear_evento_calendario(titulo: str, fecha: str = None, descripcion: str = ""):
        """Abre Google Calendar para guardar el evento con 1 clic."""
        if not titulo:
            print("Jarvis: Especifica el título del evento.")
            return
        encoded_title = urllib.parse.quote(titulo)
        encoded_desc = urllib.parse.quote(descripcion)
        url = f"https://calendar.google.com/calendar/render?action=TEMPLATE&text={encoded_title}&details={encoded_desc}"
        print(f"Jarvis: Abriendo Google Calendar para crear el evento '{titulo}'...")
        webbrowser.open(url)

    @staticmethod
    def traducir_texto(texto: str, idioma_destino: str = "es"):
        """Abre Google Translate con el texto listo."""
        if not texto:
            print("Jarvis: Especifica el texto a traducir.")
            return
        encoded = urllib.parse.quote(texto)
        url = f"https://translate.google.com/?sl=auto&tl={idioma_destino}&text={encoded}"
        print(f"Jarvis: Abriendo Google Traductor...")
        webbrowser.open(url)
