"""
Módulo de Mensajería y Redes Sociales para JARVIS:
- WhatsApp Web (Envío de mensajes con texto pre-rellenado)
- Telegram (Chat web y enlaces directos)
- Discord (Bot o apertura de aplicación)
- Twitter / X (Publicación directa de tweets)
"""
import os
import sys
import urllib.parse
import webbrowser
import subprocess

class MensajeriaJARVIS:
    """Controlador de plataformas de mensajería y redes."""

    @staticmethod
    def enviar_whatsapp(telefono: str = None, mensaje: str = ""):
        """Abre WhatsApp Web o la app nativa con el contacto y mensaje pre-cargados."""
        encoded_msg = urllib.parse.quote(mensaje)
        if telefono:
            # Limpiar caracteres no numéricos
            num_clean = "".join(filter(str.isdigit, telefono))
            url = f"https://web.whatsapp.com/send?phone={num_clean}&text={encoded_msg}"
            print(f"Jarvis: Abriendo WhatsApp Web para enviar mensaje a +{num_clean}...")
        else:
            url = f"https://web.whatsapp.com"
            print("Jarvis: Abriendo WhatsApp Web...")
        webbrowser.open(url)

    @staticmethod
    def enviar_telegram(usuario: str = None, mensaje: str = ""):
        """Abre Telegram Web o el chat del usuario indicado."""
        if usuario:
            user_clean = usuario.lstrip("@").strip()
            encoded_msg = urllib.parse.quote(mensaje)
            url = f"https://t.me/{user_clean}?text={encoded_msg}" if mensaje else f"https://t.me/{user_clean}"
            print(f"Jarvis: Abriendo Telegram para contactar a @{user_clean}...")
        else:
            url = "https://web.telegram.org"
            print("Jarvis: Abriendo Telegram Web...")
        webbrowser.open(url)

    @staticmethod
    def enviar_discord(mensaje: str = ""):
        """Abre Discord con el texto listo o canal indicado."""
        print("Jarvis: Abriendo Discord...")
        try:
            os.system("start discord:")
        except Exception:
            webbrowser.open("https://discord.com/app")

    @staticmethod
    def publicar_tweet(texto: str):
        """Abre Twitter/X con el tweet redactado listo para publicar con 1 clic."""
        if not texto:
            print("Jarvis: Especifica el texto del tweet.")
            return
        encoded = urllib.parse.quote(texto)
        url = f"https://twitter.com/intent/tweet?text={encoded}"
        print(f"Jarvis: Abriendo Twitter/X con el tweet: \"{texto}\"...")
        webbrowser.open(url)
