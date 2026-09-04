"""
Módulo de Gestión y Envío de Emails para JARVIS:
- Envío directo vía SMTP autenticado (Gmail, Outlook, servidores privados)
- Envío asistido mediante interfaz web con campos pre-rellenados (Gmail / Outlook / Mailto)
- Lectura y búsqueda de emails
"""
import os
import sys
import smtplib
import urllib.parse
import webbrowser
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from dotenv import load_dotenv

# Cargar variables de entorno desde config/.env buscando hacia arriba
_curr = os.path.abspath(__file__)
for _ in range(5):
    _curr = os.path.dirname(_curr)
    _candidate = os.path.join(_curr, "config", ".env")
    if os.path.exists(_candidate):
        load_dotenv(_candidate)
        break

class GestorEmail:
    """Controlador integral de correo electrónico."""

    @staticmethod
    def enviar_email(destinatario: str, asunto: str = "Mensaje desde JARVIS", cuerpo: str = "", adjunto: str = None, cliente: str = "gmail") -> bool:
        """
        Envía un correo electrónico. Si hay credenciales SMTP configuradas en .env,
        lo envía de forma silenciosa por el servidor. De lo contrario, abre la ventana
        de redacción con los datos ya completados en Gmail, Outlook o Mailto.
        """
        if not destinatario:
            print("Jarvis: Especifica el destinatario del correo electrónico.")
            return False

        smtp_user = os.getenv("SMTP_USER") or os.getenv("GMAIL_USER")
        smtp_pass = os.getenv("SMTP_PASS") or os.getenv("GMAIL_APP_PASS")
        smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))

        # 1. Intentar envío silencioso por SMTP si hay credenciales
        if smtp_user and smtp_pass:
            print(f"Jarvis: Enviando correo por SMTP a {destinatario}...")
            try:
                msg = MIMEMultipart()
                msg["From"] = smtp_user
                msg["To"] = destinatario
                msg["Subject"] = asunto
                msg.attach(MIMEText(cuerpo, "plain", "utf-8"))

                if adjunto and os.path.exists(adjunto):
                    with open(adjunto, "rb") as f:
                        part = MIMEBase("application", "octet-stream")
                        part.set_payload(f.read())
                    encoders.encode_base64(part)
                    part.add_header("Content-Disposition", f"attachment; filename={os.path.basename(adjunto)}")
                    msg.attach(part)

                with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
                    server.starttls()
                    server.login(smtp_user, smtp_pass)
                    server.send_message(msg)

                print(f"✅ Jarvis: Correo enviado con éxito a {destinatario}.")
                return True
            except Exception as e:
                print(f"Jarvis: Falló el envío por SMTP ({e}). Abriendo redactor web...")

        # 2. Fallback asistido: Redactor web pre-rellenado (cero configuración requerida)
        encoded_to = urllib.parse.quote(destinatario)
        encoded_su = urllib.parse.quote(asunto)
        encoded_body = urllib.parse.quote(cuerpo)

        cliente_clean = cliente.lower().strip() if cliente else "gmail"
        if "outlook" in cliente_clean or "hotmail" in cliente_clean:
            url = f"https://outlook.live.com/mail/0/deeplink/compose?to={encoded_to}&subject={encoded_su}&body={encoded_body}"
            print(f"Jarvis: Abriendo redactor de Outlook para {destinatario}...")
        elif "mailto" in cliente_clean:
            url = f"mailto:{encoded_to}?subject={encoded_su}&body={encoded_body}"
            print(f"Jarvis: Abriendo cliente de correo predeterminado para {destinatario}...")
        else:
            # Gmail Compose URL pre-rellenada
            url = f"https://mail.google.com/mail/?view=cm&fs=1&to={encoded_to}&su={encoded_su}&body={encoded_body}"
            print(f"Jarvis: Abriendo redactor de Gmail para {destinatario}...")

        webbrowser.open(url)
        print(f"✅ Jarvis: Ventana de correo abierta con destinatario '{destinatario}', asunto y mensaje listos para enviar.")
        return True

    @staticmethod
    def leer_emails(cliente: str = "gmail"):
        """Abre la bandeja de entrada del correo."""
        cliente_clean = cliente.lower().strip() if cliente else "gmail"
        if "outlook" in cliente_clean or "hotmail" in cliente_clean:
            url = "https://outlook.live.com/mail/0/inbox"
            print("Jarvis: Abriendo bandeja de entrada de Outlook...")
        else:
            url = "https://mail.google.com/mail/u/0/#inbox"
            print("Jarvis: Abriendo bandeja de entrada de Gmail...")
        webbrowser.open(url)
