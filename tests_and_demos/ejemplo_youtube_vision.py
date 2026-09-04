"""
Ejemplo de Reproducción de YouTube con Visión Continua (VisionJARVIS)
Verifica visualmente cada etapa del flujo con Qwen2.5-VL.
"""
import os
import sys
import time
import urllib.parse
import webbrowser
from pathlib import Path

# Permitir importar desde apps/ollama_v5
_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_root / "apps" / "ollama_v5"))

from modules.musica import YouTube
from modules.vision import VisionJARVIS

def main():
    print("=" * 65)
    print("DEMOSTRACIÓN DE YOUTUBE CON VISIÓN CONTINUA (VisionJARVIS)")
    print("=" * 65)

    cancion = "Bohemian Rhapsody Queen"
    vision = VisionJARVIS()

    # Paso 1: Resolver URL del video oficial con capitalización exacta
    print(f"\n[1/3] Resolviendo enlace directo del video para '{cancion}'...")
    url = YouTube.obtener_url_primer_video(cancion)
    print(f"      ▶ URL Resuelta: {url}")

    # Paso 2: Abrir en navegador
    print(f"\n[2/3] Abriendo video en navegador...")
    webbrowser.open(url)
    print("      Esperando 4 segundos para que cargue la página...")
    time.sleep(4)

    # Paso 3: Verificación con Visión Continua
    print(f"\n[3/3] Verificando estado visual de la pantalla con IA ({vision.modelo})...")
    res_error = vision.detectar_error()
    if res_error.get("hay_error"):
        print(f"      ⚠️ Aviso de error detectado: {res_error.get('mensaje')}")
    else:
        print("      ✅ No hay errores visuales detectados.")

    descripcion = vision.ver_pantalla("¿Se ve el reproductor de video de YouTube o la página web cargada?")
    print(f"\n--- [ANÁLISIS DE VISIÓN CONTINUA] ---\n{descripcion}\n-------------------------------------\n")
    print("✅ Flujo de reproducción con visión finalizado.")

if __name__ == "__main__":
    main()
