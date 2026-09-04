"""
JARVIS // CMD — Neural AI Command Center [DEMO DE ESCRITORIO OFFLINE]
Lanzador de escritorio nativo con PyWebView para la nueva interfaz gráfica de JARVIS.
Opera 100% offline, sin dependencias externas y sin conectar a Ollama.
"""
import os
import sys
import threading
import http.server
import socketserver
import socket
import webview

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, "dist")
INDEX_PATH = os.path.join(DIST_DIR, "index.html")


def get_free_port():
    """Encuentra un puerto libre en localhost."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


class SilentHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Servidor HTTP estático ultra-silencioso para servir la bundle de React offline."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST_DIR, **kwargs)

    def log_message(self, format, *args):
        # Silenciar logs en consola
        pass


def start_local_server(port):
    """Inicia el servidor local de archivos estáticos en un hilo daemon."""
    handler = SilentHTTPRequestHandler
    with socketserver.TCPServer(("127.0.0.1", port), handler) as httpd:
        httpd.serve_forever()


def main():
    if not os.path.exists(INDEX_PATH):
        print(f"[ERROR] No se encontró el bundle compilado en: {INDEX_PATH}")
        print("Por favor ejecuta 'npm run build' dentro de demos/ui_nueva antes de iniciar.")
        input("Presiona Enter para salir...")
        sys.exit(1)

    port = get_free_port()
    server_thread = threading.Thread(target=start_local_server, args=(port,), daemon=True)
    server_thread.start()

    url = f"http://127.0.0.1:{port}/index.html"
    print(f"[DEMO JARVIS NUEVA UI] Iniciando ventana nativa de escritorio desde {url}...")

    window = webview.create_window(
        title="⚡ JARVIS // CMD — Neural AI Command Center [MODO DEMO OFFLINE]",
        url=url,
        width=1360,
        height=880,
        min_size=(1024, 680),
        resizable=True,
        frameless=False,
        easy_drag=False,
        text_select=True,
        confirm_close=False,
        background_color="#090b10"
    )

    webview.start(debug=False)


if __name__ == "__main__":
    main()
