"""
Módulo de Navegación Web Avanzada para JARVIS:
- Control de pestañas, recarga, historial e incógnito vía Win32 / atajos
- Apertura de múltiples sitios simultáneamente
- Resolución de dominios y alias
"""
import os
import sys
import time
import ctypes
import subprocess
import urllib.parse
import webbrowser

class NavegacionAvanzada:
    """Control de pestañas y atajos de navegador en Windows."""

    @staticmethod
    def ejecutar_accion_navegador(accion: str):
        user32 = ctypes.windll.user32
        VK_CONTROL = 0x11
        VK_SHIFT = 0x10
        VK_TAB = 0x09
        VK_W = 0x57
        VK_T = 0x54
        VK_L = 0x4C
        VK_R = 0x52
        VK_F5 = 0x74
        VK_BROWSER_BACK = 0xA6
        VK_BROWSER_FORWARD = 0xA7
        VK_N = 0x4E
        KEYEVENTF_KEYUP = 0x0002

        def pulsar(vk):
            user32.keybd_event(vk, 0, 0, 0)
            time.sleep(0.02)
            user32.keybd_event(vk, 0, KEYEVENTF_KEYUP, 0)

        def combo(*keys):
            for k in keys:
                user32.keybd_event(k, 0, 0, 0)
                time.sleep(0.02)
            time.sleep(0.03)
            for k in reversed(keys):
                user32.keybd_event(k, 0, KEYEVENTF_KEYUP, 0)
                time.sleep(0.02)

        accion_clean = accion.lower().strip() if accion else ""

        acciones_map = {
            "nueva_pestana": ("Abriendo nueva pestaña (Ctrl+T)...", lambda: combo(VK_CONTROL, VK_T)),
            "cerrar_pestana": ("Cerrando pestaña actual (Ctrl+W)...", lambda: combo(VK_CONTROL, VK_W)),
            "siguiente_pestana": ("Cambiando a siguiente pestaña (Ctrl+Tab)...", lambda: combo(VK_CONTROL, VK_TAB)),
            "anterior_pestana": ("Cambiando a pestaña anterior (Ctrl+Shift+Tab)...", lambda: combo(VK_CONTROL, VK_SHIFT, VK_TAB)),
            "recargar": ("Recargando página (F5)...", lambda: pulsar(VK_F5)),
            "atras": ("Navegando atrás en el historial...", lambda: pulsar(VK_BROWSER_BACK)),
            "adelante": ("Navegando adelante en el historial...", lambda: pulsar(VK_BROWSER_FORWARD)),
            "barra_direccion": ("Enfocando barra de direcciones (Ctrl+L)...", lambda: combo(VK_CONTROL, VK_L)),
            "nueva_ventana": ("Abriendo nueva ventana (Ctrl+N)...", lambda: combo(VK_CONTROL, VK_N)),
            "incognito": ("Abriendo ventana de incógnito (Ctrl+Shift+N)...", lambda: combo(VK_CONTROL, VK_SHIFT, VK_N)),
            "restaurar_pestana": ("Restaurando última pestaña cerrada (Ctrl+Shift+T)...", lambda: combo(VK_CONTROL, VK_SHIFT, VK_T)),
        }

        aliases = {
            "nueva pestaña": "nueva_pestana", "abrir pestaña": "nueva_pestana",
            "cerrar pestaña": "cerrar_pestana", "cierra pestaña": "cerrar_pestana",
            "siguiente pestaña": "siguiente_pestana", "anterior pestaña": "anterior_pestana",
            "recargar": "recargar", "refrescar": "recargar", "f5": "recargar",
            "atras": "atras", "atrás": "atras", "volver": "atras",
            "adelante": "adelante", "avanzar": "adelante",
            "incognito": "incognito", "incógnito": "incognito", "privado": "incognito",
            "restaurar pestaña": "restaurar_pestana",
        }

        final_k = aliases.get(accion_clean, accion_clean)
        if final_k in acciones_map:
            msg, func = acciones_map[final_k]
            print(f"Jarvis: {msg}")
            func()
        else:
            print(f"Jarvis: Acción '{accion}' no reconocida.")
