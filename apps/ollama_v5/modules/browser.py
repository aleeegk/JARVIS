"""
JARVIS v5 — Módulo de Automatización Web Local (browser.py)
Navegación web, búsquedas, scraping y ejecución de tareas guiadas en Windows.
Utiliza browser-use y Playwright de forma 100% local sin APIs de pago.
"""
import os
import sys
import asyncio
import webbrowser
from typing import Optional, Dict, Any

try:
    from playwright.sync_api import sync_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False

try:
    import browser_use
    BROWSER_USE_AVAILABLE = True
except ImportError:
    BROWSER_USE_AVAILABLE = False


class BrowserController:
    """Controlador de automatización de navegación web en Windows."""

    def __init__(self):
        self.default_search_engine = "https://www.google.com/search?q="

    def abrir_url(self, url: str) -> Dict[str, Any]:
        """Abre una URL en el navegador predeterminado de Windows."""
        if not url.startswith(("http://", "https://")):
            url = "https://" + url

        try:
            exito = webbrowser.open(url)
            return {
                "exito": exito,
                "url": url,
                "mensaje": f"Navegador abierto con: {url}" if exito else "No se pudo invocar el navegador."
            }
        except Exception as e:
            return {"exito": False, "error": str(e), "mensaje": f"Error abriendo URL: {e}"}

    def buscar_en_web(self, query: str, motor: str = "google") -> Dict[str, Any]:
        """Realiza una búsqueda web rápida en el navegador."""
        motores = {
            "google": "https://www.google.com/search?q=",
            "duckduckgo": "https://duckduckgo.com/?q=",
            "bing": "https://www.bing.com/search?q=",
            "youtube": "https://www.youtube.com/results?search_query="
        }
        base_url = motores.get(motor.lower(), self.default_search_engine)
        from urllib.parse import quote_plus
        url_final = base_url + quote_plus(query)
        return self.abrir_url(url_final)

    def extraer_texto_pagina(self, url: str, timeout_ms: int = 15000) -> Dict[str, Any]:
        """Navega localmente con Playwright en modo headless y extrae el texto limpio de la página."""
        if not PLAYWRIGHT_AVAILABLE:
            return {
                "exito": False,
                "error": "Playwright no está instalado o disponible.",
                "mensaje": "Instala playwright con: pip install playwright && playwright install"
            }

        if not url.startswith(("http://", "https://")):
            url = "https://" + url

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.goto(url, timeout=timeout_ms)
                titulo = page.title()
                texto = page.inner_text("body")
                browser.close()

                return {
                    "exito": True,
                    "url": url,
                    "titulo": titulo,
                    "texto": texto[:4000],  # Limitar para no saturar memoria
                    "caracteres_totales": len(texto)
                }
        except Exception as e:
            return {"exito": False, "error": str(e), "mensaje": f"Error extrayendo texto: {e}"}

    def capturar_pagina(self, url: str, ruta_salida: Optional[str] = None) -> Dict[str, Any]:
        """Toma una captura de pantalla completa de una página web localmente."""
        if not PLAYWRIGHT_AVAILABLE:
            return {"exito": False, "error": "Playwright no disponible"}

        if not url.startswith(("http://", "https://")):
            url = "https://" + url

        if not ruta_salida:
            import tempfile
            ruta_salida = os.path.join(tempfile.gettempdir(), f"jarvis_web_{os.getpid()}.png")

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page(viewport={"width": 1280, "height": 800})
                page.goto(url, timeout=20000)
                page.screenshot(path=ruta_salida, full_page=True)
                browser.close()

                return {
                    "exito": True,
                    "url": url,
                    "captura": ruta_salida,
                    "mensaje": f"Captura guardada en: {ruta_salida}"
                }
        except Exception as e:
            return {"exito": False, "error": str(e)}

    def info_soporte(self) -> Dict[str, Any]:
        """Informa sobre el estado de las herramientas web disponibles."""
        return {
            "browser_use_disponible": BROWSER_USE_AVAILABLE,
            "playwright_disponible": PLAYWRIGHT_AVAILABLE,
            "motor_sistema": "Windows Default Browser"
        }


# Instancia global para importación directa
browser_tool = BrowserController()


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="JARVIS Browser Automation Tool")
    subparsers = parser.add_subparsers(dest="subcommand")

    open_p = subparsers.add_parser("open", help="Abrir URL en navegador")
    open_p.add_argument("url", help="Dirección web a abrir")

    search_p = subparsers.add_parser("search", help="Buscar en la web")
    search_p.add_argument("query", help="Términos de búsqueda")
    search_p.add_argument("--engine", default="google", help="Motor (google, duckduckgo, bing, youtube)")

    extract_p = subparsers.add_parser("extract", help="Extraer texto de URL con Playwright")
    extract_p.add_argument("url", help="Dirección web a scrapear")

    args = parser.parse_args()

    if args.subcommand == "open":
        res = browser_tool.abrir_url(args.url)
        print(res.get("mensaje"))
    elif args.subcommand == "search":
        res = browser_tool.buscar_en_web(args.query, args.engine)
        print(f"Buscando '{args.query}' con {args.engine}...")
    elif args.subcommand == "extract":
        res = browser_tool.extraer_texto_pagina(args.url)
        if res.get("exito"):
            print(f"Título: {res.get('titulo')}\nContenido:\n{res.get('texto')[:500]}...")
        else:
            print(f"Error: {res.get('error')}")
    else:
        print("Módulo Browser JARVIS v5 cargado. Usa --help para opciones de comando.")
