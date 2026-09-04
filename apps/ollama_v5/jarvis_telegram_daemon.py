"""
JARVIS v5 — Daemon Autónomo de Control Remoto por Telegram (Sin GUI)
===================================================================
Permite controlar el PC al 100% de forma remota desde Telegram sin
necesidad de abrir la interfaz gráfica ni estar frente al ordenador.
"""
import os
import sys
import time
import io
import contextlib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(os.path.dirname(BASE_DIR))
SETTINGS_PATH = os.path.join(BASE_DIR, "jarvis_settings.json")

for p in [BASE_DIR, ROOT_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

import jarvis_v5
from modules.telegram_control import start_telegram_control

def process_orden_daemon(texto_limpio: str) -> dict:
    """Procesa una orden con la IA de JARVIS y ejecuta la acción real en Windows."""
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
            "respuesta": f"Error al procesar la orden: {str(e)}",
            "accion": "error",
            "exito": False
        }

def main():
    print("=" * 65)
    print("       🤖 JARVIS v5 — CONTROL REMOTO TELEGRAM ACTIVO")
    print("=" * 65)
    print(" Control total de tu PC disponible desde Telegram.")
    print(" Puedes controlar tu ordenador desde el móvil cuando estés fuera.")
    print(" Presiona Ctrl+C para detener el servicio.\n")

    t = start_telegram_control(process_orden=process_orden_daemon, settings_path=SETTINGS_PATH)
    if not t:
        print("[AVISO] No se pudo iniciar el bot. Revisa TELEGRAM_BOT_TOKEN en config/.env.")
        return

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nDeteniendo servicio de Telegram JARVIS...")

if __name__ == "__main__":
    main()
