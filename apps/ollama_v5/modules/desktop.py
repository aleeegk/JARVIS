"""
JARVIS v5 — Módulo de Automatización de Escritorio Windows (desktop.py)
Control local de ratón, teclado, ventanas activas y aplicaciones nativas.
Utiliza pyautogui-next / pyautogui y pywinauto de forma 100% offline.
"""
import os
import sys
import time
import subprocess
from typing import Optional, List, Dict, Any

try:
    import pyautogui
    # Configuración de seguridad
    pyautogui.FAILSAFE = True
    pyautogui.PAUSE = 0.1
    PYAUTOGUI_AVAILABLE = True
except ImportError:
    PYAUTOGUI_AVAILABLE = False

try:
    from pywinauto import Desktop, Application
    PYWINAUTO_AVAILABLE = True
except ImportError:
    PYWINAUTO_AVAILABLE = False


class DesktopController:
    """Controlador de automatización de interfaz y aplicaciones Windows."""

    def __init__(self):
        pass

    # =========================================================================
    # 1. CONTROL DE RATÓN
    # =========================================================================

    def obtener_posicion_raton(self) -> Dict[str, Any]:
        """Retorna la posición actual (x, y) del puntero del ratón."""
        if not PYAUTOGUI_AVAILABLE:
            return {"exito": False, "error": "pyautogui no disponible"}
        x, y = pyautogui.position()
        return {"exito": True, "x": x, "y": y}

    def mover_raton(self, x: int, y: int, duracion: float = 0.2) -> Dict[str, Any]:
        """Mueve el ratón a las coordenadas indicadas."""
        if not PYAUTOGUI_AVAILABLE:
            return {"exito": False, "error": "pyautogui no disponible"}
        try:
            pyautogui.moveTo(x, y, duration=duracion)
            return {"exito": True, "x": x, "y": y}
        except Exception as e:
            return {"exito": False, "error": str(e)}

    def click(self, x: Optional[int] = None, y: Optional[int] = None, boton: str = "left", clicks: int = 1) -> Dict[str, Any]:
        """Ejecuta un click (izquierdo, derecho o doble) en la posición indicada o actual."""
        if not PYAUTOGUI_AVAILABLE:
            return {"exito": False, "error": "pyautogui no disponible"}
        try:
            pyautogui.click(x=x, y=y, clicks=clicks, button=boton)
            return {"exito": True, "boton": boton, "clicks": clicks}
        except Exception as e:
            return {"exito": False, "error": str(e)}

    def scroll(self, cantidad: int) -> Dict[str, Any]:
        """Realiza scroll vertical (positivo = arriba, negativo = abajo)."""
        if not PYAUTOGUI_AVAILABLE:
            return {"exito": False, "error": "pyautogui no disponible"}
        try:
            pyautogui.scroll(cantidad)
            return {"exito": True, "scroll": cantidad}
        except Exception as e:
            return {"exito": False, "error": str(e)}

    # =========================================================================
    # 2. CONTROL DE TECLADO Y ATAJOS
    # =========================================================================

    def escribir_texto(self, texto: str, intervalo: float = 0.02) -> Dict[str, Any]:
        """Escribe texto simulando pulsaciones de teclado físicas."""
        if not PYAUTOGUI_AVAILABLE:
            return {"exito": False, "error": "pyautogui no disponible"}
        try:
            pyautogui.write(texto, interval=intervalo)
            return {"exito": True, "longitud": len(texto)}
        except Exception as e:
            return {"exito": False, "error": str(e)}

    def presionar_tecla(self, tecla: str) -> Dict[str, Any]:
        """Presiona una tecla específica (enter, esc, tab, backspace, etc.)."""
        if not PYAUTOGUI_AVAILABLE:
            return {"exito": False, "error": "pyautogui no disponible"}
        try:
            pyautogui.press(tecla.lower())
            return {"exito": True, "tecla": tecla}
        except Exception as e:
            return {"exito": False, "error": str(e)}

    def ejecutar_atajo(self, *teclas) -> Dict[str, Any]:
        """Ejecuta una combinación de teclas (ej: 'ctrl', 'c' o 'alt', 'tab')."""
        if not PYAUTOGUI_AVAILABLE:
            return {"exito": False, "error": "pyautogui no disponible"}
        try:
            pyautogui.hotkey(*[t.lower() for t in teclas])
            return {"exito": True, "atajo": list(teclas)}
        except Exception as e:
            return {"exito": False, "error": str(e)}

    # =========================================================================
    # 3. CONTROL DE VENTANAS Y APPS DE WINDOWS (pywinauto)
    # =========================================================================

    def listar_ventanas(self) -> List[Dict[str, Any]]:
        """Lista todas las ventanas visibles abiertas en el escritorio de Windows."""
        ventanas = []
        if PYWINAUTO_AVAILABLE:
            try:
                desktop = Desktop(backend="uia")
                for w in desktop.windows():
                    txt = w.window_text().strip()
                    if txt and w.is_visible():
                        rect = w.rectangle()
                        ventanas.append({
                            "titulo": txt,
                            "control_type": w.element_info.control_type,
                            "x": rect.left,
                            "y": rect.top,
                            "ancho": rect.width(),
                            "alto": rect.height()
                        })
                return ventanas
            except Exception:
                pass

        # Fallback con pygetwindow si está instalado
        try:
            import pygetwindow as gw
            for w in gw.getAllWindows():
                if w.title.strip() and w.visible:
                    ventanas.append({
                        "titulo": w.title.strip(),
                        "x": w.left,
                        "y": w.top,
                        "ancho": w.width,
                        "alto": w.height
                    })
        except Exception:
            pass

        return ventanas

    def enfocar_ventana(self, filtro_titulo: str) -> Dict[str, Any]:
        """Busca una ventana por coincidencia parcial de título y la trae al frente."""
        filtro = filtro_titulo.lower()

        if PYWINAUTO_AVAILABLE:
            try:
                desktop = Desktop(backend="uia")
                for w in desktop.windows():
                    titulo = w.window_text()
                    if filtro in titulo.lower() and w.is_visible():
                        w.set_focus()
                        return {"exito": True, "ventana": titulo, "mensaje": f"Ventana '{titulo}' enfocada."}
            except Exception:
                pass

        try:
            import pygetwindow as gw
            for w in gw.getAllWindows():
                if filtro in w.title.lower() and w.visible:
                    if w.isMinimized:
                        w.restore()
                    w.activate()
                    return {"exito": True, "ventana": w.title, "mensaje": f"Ventana '{w.title}' enfocada."}
        except Exception as e:
            return {"exito": False, "error": str(e)}

        return {"exito": False, "error": f"No se encontró ninguna ventana visible con: '{filtro_titulo}'"}

    def minimizar_ventana(self, filtro_titulo: str) -> Dict[str, Any]:
        """Minimiza una ventana abierta."""
        filtro = filtro_titulo.lower()
        try:
            import pygetwindow as gw
            for w in gw.getAllWindows():
                if filtro in w.title.lower():
                    w.minimize()
                    return {"exito": True, "ventana": w.title}
        except Exception as e:
            return {"exito": False, "error": str(e)}
        return {"exito": False, "error": "Ventana no encontrada."}

    def cerrar_ventana(self, filtro_titulo: str) -> Dict[str, Any]:
        """Cierra una ventana abierta de forma limpia."""
        filtro = filtro_titulo.lower()
        try:
            import pygetwindow as gw
            for w in gw.getAllWindows():
                if filtro in w.title.lower():
                    w.close()
                    return {"exito": True, "ventana": w.title}
        except Exception as e:
            return {"exito": False, "error": str(e)}
        return {"exito": False, "error": "Ventana no encontrada."}

    def lanzar_aplicacion(self, comando: str) -> Dict[str, Any]:
        """Inicia una aplicación en Windows (ej: 'notepad', 'calc', 'explorer')."""
        try:
            proc = subprocess.Popen(comando, shell=True)
            return {"exito": True, "pid": proc.pid, "mensaje": f"Aplicación lanzada: {comando}"}
        except Exception as e:
            return {"exito": False, "error": str(e)}

    # =========================================================================
    # 4. PANTALLA Y RESOLUCIÓN
    # =========================================================================

    def obtener_resolucion(self) -> Dict[str, Any]:
        """Retorna el ancho y alto de la pantalla principal."""
        if not PYAUTOGUI_AVAILABLE:
            return {"exito": False, "error": "pyautogui no disponible"}
        w, h = pyautogui.size()
        return {"exito": True, "ancho": w, "alto": h}

    def capturar_pantalla(self, ruta_salida: Optional[str] = None) -> Dict[str, Any]:
        """Toma una captura del escritorio completo."""
        if not PYAUTOGUI_AVAILABLE:
            return {"exito": False, "error": "pyautogui no disponible"}

        if not ruta_salida:
            import tempfile
            ruta_salida = os.path.join(tempfile.gettempdir(), f"desktop_cap_{int(time.time())}.png")

        try:
            screenshot = pyautogui.screenshot()
            screenshot.save(ruta_salida)
            return {"exito": True, "captura": ruta_salida}
        except Exception as e:
            return {"exito": False, "error": str(e)}


# Instancia global para importación directa
desktop_tool = DesktopController()


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="JARVIS Desktop Automation Tool")
    subparsers = parser.add_subparsers(dest="subcommand")

    subparsers.add_parser("list-windows", help="Listar ventanas abiertas")
    
    focus_p = subparsers.add_parser("focus", help="Enfocar ventana por título")
    focus_p.add_argument("title", help="Parte del título de la ventana")

    type_p = subparsers.add_parser("type", help="Escribir texto")
    type_p.add_argument("text", help="Texto a teclear")

    hotkey_p = subparsers.add_parser("hotkey", help="Ejecutar atajo de teclado")
    hotkey_p.add_argument("keys", nargs="+", help="Teclas (ej: ctrl shift esc)")

    subparsers.add_parser("screen-size", help="Obtener resolución de pantalla")

    args = parser.parse_args()

    if args.subcommand == "list-windows":
        wins = desktop_tool.listar_ventanas()
        print(f"\n--- Ventanas abiertas ({len(wins)}) ---")
        for i, w in enumerate(wins, 1):
            print(f"{i}. {w['titulo']} ({w['ancho']}x{w['alto']})")
    elif args.subcommand == "focus":
        res = desktop_tool.enfocar_ventana(args.title)
        print(res.get("mensaje", res.get("error")))
    elif args.subcommand == "type":
        desktop_tool.escribir_texto(args.text)
        print(f"Texto tecleado: '{args.text}'")
    elif args.subcommand == "hotkey":
        desktop_tool.ejecutar_atajo(*args.keys)
        print(f"Atajo ejecutado: {' + '.join(args.keys)}")
    elif args.subcommand == "screen-size":
        sz = desktop_tool.obtener_resolucion()
        print(f"Resolución: {sz.get('ancho')}x{sz.get('alto')}")
    else:
        print("Módulo Desktop JARVIS v5 cargado. Usa --help para ver opciones.")
