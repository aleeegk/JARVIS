r"""
JARVIS v5 — Asistente Dinámico Autónomo Multimodal con Memoria (Windows)
======================================================================
Modelo Único: qwen2.5vl:7b (Texto + Visión de Pantalla + Código + Memoria Dual)
- Acceso y escaneo a TODOS los discos y particiones del sistema (C:\, D:\, E:\, F:\).
- Búsqueda de videos por NOMBRE exacto o por CARPETA/SUBDIRECTORIOS con orden temporal.
- Memoria Persistente entre Sesiones: Registra el historial de tareas previas para recordarlo siempre.
- Memoria de Corto Plazo: Recuerda todo el contexto de la conversación actual.
- Motor dinámico universal con auto-corrección en bucle.
- Parche global de red para evitar bloqueos HTTP 403.
- Visión de pantalla multi-monitor integrada.
"""

import os
import sys
import re
import json
import time
import glob
import math
import random
import string
import shutil
import tempfile
import subprocess
import traceback
import urllib.parse
import base64
import ctypes
from ctypes import wintypes
import requests
import bs4
from datetime import datetime
from pathlib import Path

# =====================================================================
# Parche Global de Red (Garantiza User-Agent de navegador en toda petición)
# =====================================================================
_orig_session_request = requests.Session.request

def _patched_session_request(self, method, url, *args, **kwargs):
    headers = kwargs.get("headers")
    if headers is None:
        headers = {}
    else:
        headers = dict(headers)
    if "User-Agent" not in headers and "user-agent" not in headers:
        headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    kwargs["headers"] = headers
    return _orig_session_request(self, method, url, *args, **kwargs)

requests.Session.request = _patched_session_request

try:
    import winreg
except ImportError:
    winreg = None

try:
    from dotenv import load_dotenv
    load_dotenv()
    # jarvis_v5.py está en apps/ollama_v5 → raíz del repo es dos niveles arriba de esa carpeta
    _this_dir = os.path.dirname(os.path.abspath(__file__))
    _root_env = os.path.join(os.path.dirname(os.path.dirname(_this_dir)), "config", ".env")
    if os.path.isfile(_root_env):
        load_dotenv(_root_env)
except ImportError:
    pass

from ollama_opts import extra_generate, opciones_generate

# =====================================================================
# 0. Configuración de Ollama, Seguridad y Memoria Persistente
# =====================================================================
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
MODELO = os.getenv("MODELO", "qwen2.5vl:7b")

RUTA_MEMORIA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "jarvis_memoria.json")


def cargar_memoria() -> dict:
    if os.path.exists(RUTA_MEMORIA):
        try:
            with open(RUTA_MEMORIA, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "usuario": {
            "nombre": "Alejandro",
            "navegador_favorito": "Opera",
            "preferencias": {}
        },
        "recuerdos": [],
        "ultimas_tareas": []
    }


def guardar_memoria(memoria: dict):
    try:
        with open(RUTA_MEMORIA, "w", encoding="utf-8") as f:
            json.dump(memoria, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Jarvis: No pude guardar la memoria persistente ({e}).")


MEMORIA = cargar_memoria()
HISTORIAL_CONVERSACION = []

ACCIONES_PERMITIDAS = {
    "abrir_bloc_notas",
    "abrir_aplicacion",
    "cerrar_aplicacion",
    "controlar_ventana",
    "abrir_sitio_web",
    "buscar_en_internet",
    "controlar_navegador",
    "descargar_video",
    "abrir_carpeta",
    "renombrar_archivos",
    "mover_archivo",
    "copiar_archivo",
    "eliminar_archivo",
    "crear_carpeta",
    "buscar_archivos",
    "controlar_volumen",
    "controlar_reproductor",
    "grabar_pantalla",
    "capturar_pantalla",
    "reproducir_video",
    "enviar_email",
    "leer_emails",
    "enviar_whatsapp",
    "enviar_telegram",
    "publicar_tweet",
    "crear_evento_calendario",
    "traducir_texto",
    "secuencia_acciones",
    "ejecutar_codigo_python",
    "guardar_recuerdo",
    "ver_pantalla",
    "buscar_elemento_en_pantalla",
    "detectar_error",
    "conversar",
    "ninguna",
}



BANNER = r"""
     _   _    ____  __     __ ___  ____
    | | / \  |  _ \ \ \   / /|_ _|/ ___|
 _  | |/ _ \ | |_) | \ \ / /  | | \___ \
| |_| / ___ \|  _ <   \ V /   | |  ___) |
 \___/_/   \_\_| \_\   \_/   |___||____/

        A S I S T E N T E   D I N Á M I C O   (v5)
"""


def mostrar_banner():
    print(BANNER)


def saludar():
    hora = time.localtime().tm_hour
    momento = "Buenos días" if hora < 12 else "Buenas tardes" if hora < 20 else "Buenas noches"
    nombre_user = MEMORIA.get("usuario", {}).get("nombre")
    saludo_nombre = f", {nombre_user}" if nombre_user else ""
    print(f"{momento}{saludo_nombre}. Soy Jarvis ({MODELO}). Memoria activa y sincronizada.")
    print("Escribe 'salir' cuando quieras terminar.\n")


# =====================================================================
# 1. Buscador Dinámico de Discos, Aplicaciones y Carpetas
# =====================================================================

def _obtener_todas_las_unidades_disco() -> list:
    r"""Devuelve todas las unidades de disco lógicas disponibles en Windows (C:\, D:\, E:\, etc.)."""
    drives = []
    try:
        bitmask = ctypes.windll.kernel32.GetLogicalDrives()
        for letter in string.ascii_uppercase:
            if bitmask & 1:
                path = f"{letter}:\\"
                if os.path.exists(path):
                    drives.append(path)
            bitmask >>= 1
    except Exception:
        drives = [r"C:\\"]
    return drives


def _buscar_aplicacion_en_sistema(nombre: str) -> str:
    """Busca dinámicamente cualquier aplicación o programa en Windows."""
    if not nombre:
        return None

    target = nombre.lower().strip()

    alias_consola = {
        "bloc de notas": "notepad",
        "notepad": "notepad",
        "calculadora": "calc",
        "calc": "calc",
        "paint": "mspaint",
        "cmd": "cmd",
        "consola": "cmd",
        "terminal": "wt",
        "powershell": "powershell",
        "explorador": "explorer",
        "panel de control": "control",
        "administrador de tareas": "taskmgr",
        "visual studio code": "code",
        "vs code": "code",
        "vscode": "code",
        "code": "code",
    }
    if target in alias_consola:
        return alias_consola[target]

    if winreg:
        for hkey in (winreg.HKEY_LOCAL_MACHINE, winreg.HKEY_CURRENT_USER):
            try:
                with winreg.OpenKey(hkey, r'SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths') as key:
                    num_subkeys = winreg.QueryInfoKey(key)[0]
                    for i in range(num_subkeys):
                        subkey_name = winreg.EnumKey(key, i)
                        name_clean = os.path.splitext(subkey_name.lower())[0]
                        if target in name_clean or name_clean in target:
                            try:
                                with winreg.OpenKey(key, subkey_name) as subkey:
                                    exe_path, _ = winreg.QueryValueEx(subkey, '')
                                    if exe_path and os.path.exists(exe_path):
                                        return exe_path
                            except OSError:
                                pass
            except OSError:
                pass

    rutas_escaneo = [
        os.path.expandvars(r'%PROGRAMDATA%\Microsoft\Windows\Start Menu\Programs'),
        os.path.expandvars(r'%APPDATA%\Microsoft\Windows\Start Menu\Programs'),
        os.path.expandvars(r'%LOCALAPPDATA%\Programs'),
        os.path.expandvars(r'%USERPROFILE%\Desktop'),
        os.path.expandvars(r'%PUBLIC%\Desktop'),
    ]

    coincidencias_lnk = []
    coincidencias_exe = []

    for ruta_base in rutas_escaneo:
        if os.path.exists(ruta_base):
            for root, _, files in os.walk(ruta_base):
                for f in files:
                    f_lower = f.lower()
                    nombre_sin_ext = os.path.splitext(f_lower)[0]
                    if target in nombre_sin_ext or nombre_sin_ext in target:
                        full_path = os.path.join(root, f)
                        if f_lower.endswith('.lnk'):
                            coincidencias_lnk.append(full_path)
                        elif f_lower.endswith('.exe'):
                            coincidencias_exe.append(full_path)

    if coincidencias_lnk:
        return coincidencias_lnk[0]
    if coincidencias_exe:
        return coincidencias_exe[0]

    program_dirs = [
        os.environ.get("ProgramFiles", r"C:\Program Files"),
        os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)"),
    ]
    for p_dir in program_dirs:
        if os.path.exists(p_dir):
            for root, _, files in os.walk(p_dir):
                rel_depth = root[len(p_dir):].count(os.sep)
                if rel_depth > 3:
                    continue
                for f in files:
                    if f.lower().endswith('.exe'):
                        base = os.path.splitext(f.lower())[0]
                        if base == target or target in base:
                            return os.path.join(root, f)

    return None


def _buscar_carpetas_en_sistema(nombre_o_ruta: str = "") -> list:
    r"""Busca dinámicamente carpetas en TODAS las particiones de disco del sistema (C:\, D:\, E:\, etc.)."""
    if not nombre_o_ruta:
        return []

    if os.path.isdir(nombre_o_ruta):
        return [os.path.abspath(nombre_o_ruta)]

    user_home = os.path.expanduser("~")
    mapeo_carpetas = {
        "descargas": os.path.join(user_home, "Downloads"),
        "descargar": os.path.join(user_home, "Downloads"),
        "downloads": os.path.join(user_home, "Downloads"),
        "download": os.path.join(user_home, "Downloads"),

        "documentos": os.path.join(user_home, "Documents"),
        "documento": os.path.join(user_home, "Documents"),
        "documents": os.path.join(user_home, "Documents"),

        "escritorio": os.path.join(user_home, "Desktop"),
        "desktop": os.path.join(user_home, "Desktop"),

        "imagenes": os.path.join(user_home, "Pictures"),
        "imágenes": os.path.join(user_home, "Pictures"),
        "imagen": os.path.join(user_home, "Pictures"),
        "imágen": os.path.join(user_home, "Pictures"),
        "fotos": os.path.join(user_home, "Pictures"),
        "foto": os.path.join(user_home, "Pictures"),
        "pictures": os.path.join(user_home, "Pictures"),
        "picture": os.path.join(user_home, "Pictures"),
        "photos": os.path.join(user_home, "Pictures"),
        "photo": os.path.join(user_home, "Pictures"),

        "videos": os.path.join(user_home, "Videos"),
        "vídeos": os.path.join(user_home, "Videos"),
        "video": os.path.join(user_home, "Videos"),
        "vídeo": os.path.join(user_home, "Videos"),
        "peliculas": os.path.join(user_home, "Videos"),
        "películas": os.path.join(user_home, "Videos"),

        "musica": os.path.join(user_home, "Music"),
        "música": os.path.join(user_home, "Music"),
        "music": os.path.join(user_home, "Music"),
        "canciones": os.path.join(user_home, "Music"),
    }

    clave = nombre_o_ruta.lower().strip()
    if clave in mapeo_carpetas and os.path.exists(mapeo_carpetas[clave]):
        return [mapeo_carpetas[clave]]

    target = clave.replace("carpeta", "").replace("de", "").replace("la", "").replace("el", "").replace("mi", "").strip()
    if target in mapeo_carpetas and os.path.exists(mapeo_carpetas[target]):
        return [mapeo_carpetas[target]]

    parent_dirs = [
        user_home,
        os.path.join(user_home, "Desktop"),
        os.path.join(user_home, "Documents"),
        os.path.join(user_home, "Downloads"),
        os.path.join(user_home, "Pictures"),
        os.path.join(user_home, "Videos"),
        os.getcwd(),
    ]
    for d in _obtener_todas_las_unidades_disco():
        if d not in parent_dirs:
            parent_dirs.append(d)

    hallazgos = []
    vistos = set()

    for p_dir in parent_dirs:
        if os.path.exists(p_dir):
            try:
                for root, dirs, _ in os.walk(p_dir, onerror=lambda e: None):
                    dirs[:] = [d for d in dirs if not d.startswith("$") and d != "System Volume Information" and "cache" not in d.lower()]
                    for d in dirs:
                        d_lower = d.lower()
                        if target and (target == d_lower or target in d_lower or d_lower in target):
                            full = os.path.join(root, d)
                            if full not in vistos:
                                vistos.add(full)
                                hallazgos.append(full)
                    rel_depth = root[len(p_dir):].count(os.sep)
                    if rel_depth > 3:
                        break
            except Exception:
                pass

    hallazgos.sort(key=lambda x: (os.path.basename(x).lower() != target, len(x)))
    return hallazgos


def _buscar_video_por_nombre(nombre_archivo: str) -> str:
    """Busca un archivo de video específico por su nombre en todos los discos del equipo."""
    target = nombre_archivo.lower().strip()
    exts = (".mp4", ".mov", ".mkv", ".avi", ".webm", ".m4v")
    user_home = os.path.expanduser("~")

    rutas_base = [
        "D:\\", "E:\\", "F:\\",
        os.path.join(user_home, "Videos"),
        os.path.join(user_home, "Downloads"),
        os.path.join(user_home, "Desktop"),
        os.path.join(user_home, "Documents"),
        "C:\\"
    ]

    for base in rutas_base:
        if os.path.exists(base):
            try:
                for root, dirs, files in os.walk(base, onerror=lambda e: None):
                    dirs[:] = [d for d in dirs if not d.startswith("$") and d != "System Volume Information" and "cache" not in d.lower()]
                    for f in files:
                        f_lower = f.lower()
                        if target in f_lower and f_lower.endswith(exts):
                            return os.path.join(root, f)
            except Exception:
                pass
    return None


def _numero_a_letras(n: int) -> str:
    resultado = []
    while n >= 0:
        resultado.append(chr(ord('a') + (n % 26)))
        n = (n // 26) - 1
    return "".join(reversed(resultado))


def _capturar_pantalla_native() -> str:
    """Captura el lienzo completo (abarcando todos los monitores si hay varios)."""
    ruta_tmp = os.path.join(tempfile.gettempdir(), "jarvis_screenshot.png")

    try:
        from PIL import ImageGrab
        img = ImageGrab.grab(all_screens=True)
        img.save(ruta_tmp)
        if os.path.exists(ruta_tmp) and os.path.getsize(ruta_tmp) > 1000:
            return ruta_tmp
    except Exception:
        pass

    try:
        user32 = ctypes.windll.user32
        gdi32 = ctypes.windll.gdi32
        v_left = user32.GetSystemMetrics(76) or 0
        v_top = user32.GetSystemMetrics(77) or 0
        v_width = user32.GetSystemMetrics(78) or user32.GetSystemMetrics(0)
        v_height = user32.GetSystemMetrics(79) or user32.GetSystemMetrics(1)
        hwnd = user32.GetDesktopWindow()
        hdc_screen = user32.GetDC(hwnd)
        hdc_mem = gdi32.CreateCompatibleDC(hdc_screen)
        hbitmap = gdi32.CreateCompatibleBitmap(hdc_screen, v_width, v_height)
        gdi32.SelectObject(hdc_mem, hbitmap)
        gdi32.BitBlt(hdc_mem, 0, 0, v_width, v_height, hdc_screen, v_left, v_top, 0x00CC0020)
        gdi32.DeleteObject(hbitmap)
        gdi32.DeleteDC(hdc_mem)
        user32.ReleaseDC(hwnd, hdc_screen)
    except Exception:
        pass

    ruta_ps = ruta_tmp.replace("\\", "/")
    ps_cmd = (
        f"[Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); "
        f"$v = [System.Windows.Forms.SystemInformation]::VirtualScreen; "
        f"$bmp = New-Object System.Drawing.Bitmap $v.Width, $v.Height; "
        f"$g = [System.Drawing.Graphics]::FromImage($bmp); "
        f"$g.CopyFromScreen($v.Left, $v.Top, 0, 0, $v.Size); "
        f"$bmp.Save('{ruta_ps}', [System.Drawing.Imaging.ImageFormat]::Png); "
        f"$g.Dispose(); $bmp.Dispose()"
    )
    subprocess.run(["powershell", "-Command", ps_cmd], capture_output=True)
    return ruta_tmp if os.path.exists(ruta_tmp) else None


def capturar_pantalla(**kwargs) -> str:
    """Handoff 2026-08-31: Toma una captura de pantalla estática del escritorio."""
    ruta = _capturar_pantalla_native()
    print("Jarvis: Captura de pantalla realizada exitosamente.")
    return ruta or ""


# =====================================================================
# 2. Acciones del Sistema y Ejecución Dinámica
# =====================================================================

def abrir_bloc_notas(texto: str = None, **kwargs):
    texto_limpio = str(texto).strip() if texto else ""
    ignorar_textos = ("null", "none", "en blanco", "blanco", "vacio", "vacío", "ninguno")

    if not texto or texto_limpio.lower() in ignorar_textos:
        print("Jarvis: Abriendo el Bloc de notas en blanco...")
        subprocess.Popen(["notepad.exe"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    else:
        ruta_temp = os.path.join(tempfile.gettempdir(), "jarvis_nota.txt")
        with open(ruta_temp, "w", encoding="utf-8") as f:
            f.write(texto_limpio)
        print(f"Jarvis: Abriendo el Bloc de notas con tu texto...")
        os.startfile(ruta_temp)


def abrir_aplicacion(nombre: str = None, **kwargs):
    if not nombre:
        print("Jarvis: Especifica qué aplicación o programa te gustaría abrir.")
        return

    ruta_o_cmd = _buscar_aplicacion_en_sistema(nombre)
    if ruta_o_cmd:
        print(f"Jarvis: Abriendo {nombre}...")
        try:
            if os.path.isabs(ruta_o_cmd) and ruta_o_cmd.lower().endswith(('.exe', '.lnk')):
                os.startfile(ruta_o_cmd)
            else:
                creation_flag = subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0
                subprocess.Popen(
                    ruta_o_cmd,
                    shell=True,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    creationflags=creation_flag
                )
        except Exception:
            try:
                os.startfile(ruta_o_cmd)
            except Exception as e:
                print(f"Jarvis: No pude iniciar la aplicación ({e}).")
    else:
        print(f"Jarvis: Busqué en tu sistema pero no encontré la aplicación '{nombre}'.")


def cerrar_aplicacion(nombre: str = None, **kwargs):
    """Cierra una aplicación o proceso en ejecución en Windows."""
    if not nombre:
        print("Jarvis: Especifica qué aplicación deseas cerrar.")
        return

    target = nombre.lower().strip()
    mapa_procesos = {
        "spotify": "Spotify.exe",
        "discord": "Discord.exe",
        "steam": "steam.exe",
        "bloc de notas": "Notepad.exe",
        "notepad": "Notepad.exe",
        "calculadora": "CalculatorApp.exe",
        "calc": "CalculatorApp.exe",
        "paint": "mspaint.exe",
        "opera": "opera.exe",
        "chrome": "chrome.exe",
        "edge": "msedge.exe",
        "firefox": "firefox.exe",
        "code": "Code.exe",
        "vscode": "Code.exe",
        "visual studio code": "Code.exe",
        "roblox": "RobloxPlayerBeta.exe",
        "terminal": "WindowsTerminal.exe",
        "cmd": "cmd.exe",
        "powershell": "powershell.exe",
    }

    exe_target = mapa_procesos.get(target, target if target.endswith(".exe") else f"{target}.exe")

    # Intentar cierre directo con taskkill
    print(f"Jarvis: Cerrando {nombre}...")
    res = subprocess.run(["taskkill", "/F", "/IM", exe_target], capture_output=True, text=True)
    if res.returncode == 0:
        print(f"Jarvis: '{nombre}' ha sido cerrado exitosamente.")
        return

    # Si no funcionó directo, buscar coincidencias en tasklist
    res_tl = subprocess.run(["tasklist", "/FO", "CSV"], capture_output=True, text=True)
    cerrado = False
    for line in res_tl.stdout.splitlines()[1:]:
        parts = line.replace('"', '').split(',')
        if len(parts) >= 1:
            p_name = parts[0]
            if target in p_name.lower():
                subprocess.run(["taskkill", "/F", "/IM", p_name], capture_output=True)
                cerrado = True

    if cerrado:
        print(f"Jarvis: Proceso(s) de '{nombre}' cerrados exitosamente.")
    else:
        print(f"Jarvis: No encontré '{nombre}' en ejecución para cerrar.")


def _buscar_ventanas_de_aplicacion(nombre_app: str) -> list:
    """Encuentra los HWNDs reales de cualquier aplicación visible en el escritorio interactivo."""
    if not nombre_app:
        return []

    target = nombre_app.lower().strip()
    alias_map = {
        "bloc de notas": ["bloc de notas", "notepad"],
        "notepad": ["bloc de notas", "notepad"],
        "calculadora": ["calculadora", "calculator"],
        "paint": ["paint"],
        "opera": ["opera"],
        "chrome": ["chrome", "google chrome"],
        "edge": ["edge", "microsoft edge"],
        "firefox": ["firefox", "mozilla firefox"],
        "code": ["visual studio code", "code", "antigravity"],
        "vs code": ["visual studio code", "code", "antigravity"],
        "visual studio code": ["visual studio code", "code", "antigravity"],
        "spotify": ["spotify"],
        "discord": ["discord"],
        "steam": ["steam"],
        "terminal": ["windows powershell", "terminal", "cmd", "símbolo del sistema"],
        "powershell": ["windows powershell", "powershell"],
        "cmd": ["cmd", "símbolo del sistema"],
    }

    palabras_clave = alias_map.get(target, [target])

    user32 = ctypes.windll.user32
    WNDENUMPROC = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)
    DESKTOP_READOBJECTS = 0x0001
    DESKTOP_ENUMERATE = 0x0040

    hDesktop = user32.OpenInputDesktop(0, False, DESKTOP_READOBJECTS | DESKTOP_ENUMERATE)
    coincidencias = []

    def enum_proc(hwnd, lparam):
        if user32.IsWindowVisible(hwnd):
            length = user32.GetWindowTextLengthW(hwnd)
            if length > 0:
                buff = ctypes.create_unicode_buffer(length + 1)
                user32.GetWindowTextW(hwnd, buff, length + 1)
                title = buff.value.strip()
                title_lower = title.lower()
                for kw in palabras_clave:
                    if kw in title_lower:
                        coincidencias.append((hwnd, title))
                        break
        return True

    cb = WNDENUMPROC(enum_proc)
    user32.EnumDesktopWindows(hDesktop, cb, 0)
    if hDesktop:
        user32.CloseDesktop(hDesktop)

    return coincidencias


def controlar_ventana(accion: str = "alternar", ventana: str = None, **kwargs):
    """Minimiza, maximiza, restaura, alterna o enfoca ventanas en Windows de forma fiable."""
    user32 = ctypes.windll.user32
    VK_MENU = 0x12  # ALT
    VK_TAB = 0x09   # TAB
    KEYEVENTF_KEYUP = 0x0002

    SW_SHOWMINIMIZED = 2
    SW_MAXIMIZE = 3
    SW_RESTORE = 9

    accion_clean = accion.lower().strip() if accion else "alternar"

    # 1. Minimizar todas las ventanas / Mostrar escritorio
    if accion_clean in ("mostrar_escritorio", "minimizar_todo", "escritorio", "minimizar_todas", "minimizar todas"):
        print("Jarvis: Minimizando todas las ventanas y mostrando el escritorio...")
        subprocess.run(["powershell", "-NoProfile", "-Command", "(New-Object -ComObject Shell.Application).MinimizeAll()"])
        return

    # 2. Restaurar todas las ventanas
    if accion_clean in ("restaurar_todo", "restaurar_todas", "deshacer_minimizar"):
        print("Jarvis: Restaurando todas las ventanas...")
        subprocess.run(["powershell", "-NoProfile", "-Command", "(New-Object -ComObject Shell.Application).UndoMinimizeALL()"])
        return

    # 3. Alternar entre ventanas (Alt+Tab)
    if accion_clean in ("alternar", "cambiar", "siguiente") and not ventana:
        print("Jarvis: Alternando a la siguiente ventana abierta...")
        user32.keybd_event(VK_MENU, 0, 0, 0)
        user32.keybd_event(VK_TAB, 0, 0, 0)
        time.sleep(0.05)
        user32.keybd_event(VK_TAB, 0, KEYEVENTF_KEYUP, 0)
        user32.keybd_event(VK_MENU, 0, KEYEVENTF_KEYUP, 0)
        return

    # 4. Control de una ventana específica por nombre (ej. Opera, Bloc de notas, Spotify, etc.)
    if ventana:
        ventanas_encontradas = _buscar_ventanas_de_aplicacion(ventana)
        if ventanas_encontradas:
            print(f"Jarvis: Aplicando '{accion_clean}' a la ventana de '{ventana}'...")
            for hwnd, titulo in ventanas_encontradas:
                if accion_clean in ("minimizar", "minimize"):
                    user32.ShowWindow(hwnd, SW_SHOWMINIMIZED)
                elif accion_clean in ("maximizar", "maximize"):
                    user32.ShowWindow(hwnd, SW_MAXIMIZE)
                    user32.SetForegroundWindow(hwnd)
                elif accion_clean in ("restaurar", "restore", "normal"):
                    user32.ShowWindow(hwnd, SW_RESTORE)
                    user32.SetForegroundWindow(hwnd)
                else:  # enfocar / cambiar
                    user32.ShowWindow(hwnd, SW_RESTORE)
                    user32.SetForegroundWindow(hwnd)
            return
        else:
            # Fallback con AppActivate
            ps_cmd = f'$wshell = New-Object -ComObject WScript.Shell; $wshell.AppActivate("{ventana}")'
            subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], capture_output=True)
            time.sleep(0.1)
            hwnd_fg = user32.GetForegroundWindow()
            if hwnd_fg:
                if accion_clean in ("minimizar", "minimize"):
                    user32.ShowWindow(hwnd_fg, SW_SHOWMINIMIZED)
                elif accion_clean in ("maximizar", "maximize"):
                    user32.ShowWindow(hwnd_fg, SW_MAXIMIZE)
                else:
                    user32.ShowWindow(hwnd_fg, SW_RESTORE)
            print(f"Jarvis: Ventana de '{ventana}' actualizada.")
            return

    # 5. Si no se especificó ventana, aplicar a la ventana activa
    hwnd_activo = user32.GetForegroundWindow()
    if hwnd_activo:
        if accion_clean in ("minimizar", "minimize"):
            print("Jarvis: Minimizando ventana activa...")
            user32.ShowWindow(hwnd_activo, SW_SHOWMINIMIZED)
        elif accion_clean in ("maximizar", "maximize"):
            print("Jarvis: Maximizando ventana activa...")
            user32.ShowWindow(hwnd_activo, SW_MAXIMIZE)
        elif accion_clean in ("restaurar", "restore"):
            print("Jarvis: Restaurando ventana activa...")
            user32.ShowWindow(hwnd_activo, SW_RESTORE)
        else:
            print("Jarvis: Ventana actualizada.")


def abrir_sitio_web(url_o_sitio: str = None, navegador: str = None, **kwargs):
    if not url_o_sitio:
        print("Jarvis: Especifica qué página web deseas abrir.")
        return

    sitio = url_o_sitio.strip()
    sitio_lower = sitio.lower()

    # Si se pasó el nombre de un navegador sin URL (ej. "opera", "chrome", "edge", "firefox")
    navegadores_conocidos = ("opera", "chrome", "edge", "firefox", "brave", "safari")
    if sitio_lower in navegadores_conocidos or sitio_lower.startswith("navegador "):
        nav_nombre = sitio_lower.replace("navegador ", "").strip()
        abrir_aplicacion(nombre=nav_nombre)
        return

    if not sitio_lower.startswith(("http://", "https://")):
        if "." in sitio:
            url = f"https://{sitio}"
        else:
            url = f"https://www.{sitio}.com"
    else:
        url = sitio  # PRESERVA MAYÚSCULAS Y MINÚSCULAS EXACTAS DE LA URL (Crucial para YouTube IDs)

    nav_elegido = navegador or MEMORIA.get("usuario", {}).get("navegador_favorito")
    if nav_elegido:
        ruta_nav = _buscar_aplicacion_en_sistema(nav_elegido)
        if ruta_nav:
            print(f"Jarvis: Abriendo {url} en {nav_elegido}...")
            try:
                creation_flag = subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0
                if ruta_nav.lower().endswith('.lnk'):
                    subprocess.Popen(f'start "" "{ruta_nav}" "{url}"', shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    subprocess.Popen([ruta_nav, url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=creation_flag)
                return
            except Exception:
                pass

    print(f"Jarvis: Abriendo {url} en tu navegador...")
    import webbrowser
    webbrowser.open(url)


def buscar_en_internet(termino: str = None, sitio: str = None, navegador: str = None, **kwargs):
    if not termino:
        print("Jarvis: Especifica qué te gustaría buscar.")
        return

    sitio_clean = sitio.lower().strip() if sitio else "google"
    termino_encoded = urllib.parse.quote(termino)

    # 1. Caso YouTube: Auto-play directo del primer video
    if sitio_clean == "youtube":
        from modules.musica import YouTube
        direct_url = YouTube.obtener_url_primer_video(termino)
        print(f"Jarvis: Reproduciendo '{termino}' en YouTube -> {direct_url}")
        abrir_sitio_web(direct_url, navegador=navegador)
        return

    # 2. Caso Amazon: Extracción de precios y productos
    if sitio_clean == "amazon":
        from modules.compras import AmazonScraper
        AmazonScraper.mostrar_resultados(termino)
        url = f"https://www.amazon.es/s?k={termino_encoded}"
        abrir_sitio_web(url, navegador=navegador)
        return

    # 3. Caso Spotify:
    if sitio_clean == "spotify":
        from modules.musica import SpotifyPlayer
        url = SpotifyPlayer.reproducir_cancion(termino)
        abrir_sitio_web(url, navegador=navegador)
        return

    # 4. Caso general de motores
    motores = {
        "google": f"https://www.google.com/search?q={termino_encoded}",
        "bing": f"https://www.bing.com/search?q={termino_encoded}",
        "duckduckgo": f"https://duckduckgo.com/?q={termino_encoded}",
        "ecosia": f"https://www.ecosia.org/search?q={termino_encoded}",
        "github": f"https://github.com/search?q={termino_encoded}",
        "wikipedia": f"https://es.wikipedia.org/wiki/Special:Search?search={termino_encoded}",
        "reddit": f"https://www.reddit.com/search/?q={termino_encoded}",
        "twitter": f"https://x.com/search?q={termino_encoded}",
        "x": f"https://x.com/search?q={termino_encoded}",
        "twitch": f"https://www.twitch.tv/search?term={termino_encoded}",
        "soundcloud": f"https://soundcloud.com/search?q={termino_encoded}",
        "deezer": f"https://www.deezer.com/search/{termino_encoded}",
    }

    url = motores.get(sitio_clean, f"https://www.google.com/search?q={termino_encoded}")
    print(f"Jarvis: Buscando en {sitio_clean}: {termino}")
    abrir_sitio_web(url, navegador=navegador)


def controlar_navegador(accion: str = None, **kwargs):
    """Controla pestañas y navegación del navegador activo mediante atajos de teclado del sistema."""
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
        "barra_direccion": ("Enfocando la barra de direcciones (Ctrl+L)...", lambda: combo(VK_CONTROL, VK_L)),
        "nueva_ventana": ("Abriendo nueva ventana del navegador (Ctrl+N)...", lambda: combo(VK_CONTROL, VK_N)),
        "incognito": ("Abriendo ventana de incógnito (Ctrl+Shift+N)...", lambda: combo(VK_CONTROL, VK_SHIFT, VK_N)),
        "restaurar_pestana": ("Restaurando última pestaña cerrada (Ctrl+Shift+T)...", lambda: combo(VK_CONTROL, VK_SHIFT, VK_T)),
    }

    # Aliases en español natural
    aliases = {
        "nueva pestaña": "nueva_pestana", "abrir pestaña": "nueva_pestana", "nueva tab": "nueva_pestana",
        "cerrar pestaña": "cerrar_pestana", "cierra pestaña": "cerrar_pestana", "cerrar tab": "cerrar_pestana",
        "siguiente pestaña": "siguiente_pestana", "pestaña siguiente": "siguiente_pestana",
        "anterior pestaña": "anterior_pestana", "pestaña anterior": "anterior_pestana",
        "recargar": "recargar", "refrescar": "recargar", "actualizar": "recargar", "f5": "recargar",
        "atras": "atras", "atrás": "atras", "volver": "atras", "pagina anterior": "atras",
        "adelante": "adelante", "avanzar": "adelante", "pagina siguiente": "adelante",
        "incognito": "incognito", "incógnito": "incognito", "privado": "incognito",
        "restaurar pestaña": "restaurar_pestana", "recuperar pestaña": "restaurar_pestana",
    }

    accion_final = aliases.get(accion_clean, accion_clean)
    if accion_final in acciones_map:
        msg, func = acciones_map[accion_final]
        print(f"Jarvis: {msg}")
        func()
    else:
        print(f"Jarvis: Acción de navegador no reconocida: '{accion}'. Acciones: {', '.join(acciones_map.keys())}")


def descargar_video(url: str = None, termino: str = None, carpeta: str = None, **kwargs):
    """Descarga un video o audio de YouTube u otras plataformas usando yt-dlp."""
    import shutil as _shutil

    yt_dlp_path = _shutil.which("yt-dlp")
    if not yt_dlp_path:
        print("Jarvis: yt-dlp no está instalado. Instalándolo ahora...")
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "yt-dlp"], capture_output=True, check=True)
            yt_dlp_path = _shutil.which("yt-dlp")
            if not yt_dlp_path:
                yt_dlp_path = "yt-dlp"
        except Exception as e:
            print(f"Jarvis: Error instalando yt-dlp ({e}). Instálalo manualmente con: pip install yt-dlp")
            return

    # Si no se dio URL pero sí un término de búsqueda, buscar en YouTube
    if not url and termino:
        url = f"ytsearch:{termino}"
    elif not url:
        print("Jarvis: Especifica la URL del video o un término de búsqueda para descargar.")
        return

    # Carpeta de destino
    dest_dir = os.path.expanduser("~/Downloads")
    if carpeta:
        r_c = _resolver_ruta_carpeta(carpeta)
        if r_c:
            dest_dir = r_c

    output_template = os.path.join(dest_dir, "%(title)s.%(ext)s")

    cmd = [
        yt_dlp_path,
        "-o", output_template,
        "--no-playlist",
        "--merge-output-format", "mp4",
        url
    ]

    print(f"Jarvis: Descargando video de '{url}' a '{dest_dir}'...")
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        if result.returncode == 0:
            # Encontrar el archivo descargado
            lines = result.stdout.splitlines()
            for line in reversed(lines):
                if "Destination:" in line or "has already been downloaded" in line or "Merging" in line:
                    print(f"Jarvis: {line.strip()}")
                    break
            print(f"Jarvis: Video descargado exitosamente en '{dest_dir}'.")
        else:
            error_msg = result.stderr[:200] if result.stderr else "Error desconocido"
            print(f"Jarvis: Error al descargar ({error_msg}).")
    except subprocess.TimeoutExpired:
        print("Jarvis: La descarga tardó demasiado (timeout 5 min).")
    except Exception as e:
        print(f"Jarvis: Error al descargar el video ({e}).")


def abrir_carpeta(nombre_o_ruta: str = None, **kwargs):
    user_home = os.path.expanduser("~")

    # Si se pide abrir una carpeta aleatoria o cualquiera
    if not nombre_o_ruta or str(nombre_o_ruta).lower().strip() in ("aleatoria", "cualquiera", "random", "una carpeta"):
        posibles = [
            os.path.join(user_home, "Downloads"),
            os.path.join(user_home, "Documents"),
            os.path.join(user_home, "Pictures"),
            os.path.join(user_home, "Videos"),
            os.path.join(user_home, "Desktop"),
            r"D:\DJI POCKET 3",
            r"D:\Go Pro Hero 13 Black",
        ]
        carpetas_validas = [p for p in posibles if os.path.exists(p)]
        if carpetas_validas:
            elegida = random.choice(carpetas_validas)
            print(f"Jarvis: Abriendo carpeta aleatoria '{os.path.basename(elegida)}' ({elegida})...")
            os.startfile(elegida)
            return

    rutas_encontradas = _buscar_carpetas_en_sistema(nombre_o_ruta)
    if not rutas_encontradas:
        print(f"Jarvis: No encontré ninguna carpeta que coincida con '{nombre_o_ruta}' en tus discos.")
        return

    if len(rutas_encontradas) == 1:
        ruta = rutas_encontradas[0]
        print(f"Jarvis: Abriendo carpeta '{os.path.basename(ruta)}' ({ruta})...")
        os.startfile(ruta)
        return

    print(f"\nJarvis: Encontré {len(rutas_encontradas)} carpetas que coinciden con '{nombre_o_ruta}':")
    for idx, r in enumerate(rutas_encontradas, 1):
        print(f"  {idx}. {r}")

    try:
        eleccion = input(f"\n¿Cuál de ellas te gustaría abrir? (1-{len(rutas_encontradas)}, o pulsa Enter para cancelar): ").strip()
        if eleccion.isdigit():
            num = int(eleccion)
            if 1 <= num <= len(rutas_encontradas):
                ruta_elegida = rutas_encontradas[num - 1]
                print(f"Jarvis: Abriendo carpeta '{os.path.basename(ruta_elegida)}' ({ruta_elegida})...")
                os.startfile(ruta_elegida)
                return
        print("Jarvis: Operación cancelada.")
    except (KeyboardInterrupt, EOFError):
        print("\nJarvis: Operación cancelada.")


def renombrar_archivos(
    origen: str = None,
    nuevo_nombre: str = None,
    carpeta: str = None,
    modo: str = "numerico",
    prefijo: str = "",
    buscar: str = "",
    reemplazar: str = "",
    plantilla: str = "",
    extension_filtro: str = None,
    **kwargs
):
    if origen and nuevo_nombre:
        ruta_origen = origen
        if not os.path.exists(ruta_origen):
            parent_dirs = [
                os.getcwd(),
                os.path.expanduser("~/Desktop"),
                os.path.expanduser("~/Documents"),
                os.path.expanduser("~/Downloads"),
            ]
            for d in _obtener_todas_las_unidades_disco():
                if d not in parent_dirs:
                    parent_dirs.append(d)
            for p in parent_dirs:
                posible = os.path.join(p, origen)
                if os.path.exists(posible):
                    ruta_origen = posible
                    break

        if os.path.isfile(ruta_origen):
            dir_padre = os.path.dirname(ruta_origen)
            ruta_destino = os.path.join(dir_padre, nuevo_nombre) if not os.path.isabs(nuevo_nombre) else nuevo_nombre
            os.rename(ruta_origen, ruta_destino)
            print(f"Jarvis: Archivo renombrado exitosamente de '{os.path.basename(ruta_origen)}' a '{os.path.basename(ruta_destino)}'.")
            return

    rutas_carpeta = _buscar_carpetas_en_sistema(carpeta) if carpeta else []
    if not rutas_carpeta:
        print(f"Jarvis: No encuentro la carpeta especificada para renombrar ('{carpeta}').")
        return

    ruta_carpeta = rutas_carpeta[0]
    if len(rutas_carpeta) > 1:
        print(f"\nJarvis: Encontré múltiples carpetas que coinciden con '{carpeta}':")
        for idx, r in enumerate(rutas_carpeta, 1):
            print(f"  {idx}. {r}")
        try:
            eleccion = input(f"¿En cuál deseas renombrar archivos? (1-{len(rutas_carpeta)}): ").strip()
            if eleccion.isdigit() and 1 <= int(eleccion) <= len(rutas_carpeta):
                ruta_carpeta = rutas_carpeta[int(eleccion) - 1]
            else:
                print("Jarvis: Operación cancelada.")
                return
        except (KeyboardInterrupt, EOFError):
            return

    archivos = sorted([
        f for f in os.listdir(ruta_carpeta)
        if os.path.isfile(os.path.join(ruta_carpeta, f))
    ])

    if extension_filtro:
        ext_clean = extension_filtro if extension_filtro.startswith(".") else f".{extension_filtro}"
        archivos = [f for f in archivos if f.lower().endswith(ext_clean.lower())]

    if not archivos:
        print(f"Jarvis: No hay archivos para renombrar en '{ruta_carpeta}'.")
        return

    contador = 0
    renombrados = 0

    for nombre in archivos:
        ruta_vieja = os.path.join(ruta_carpeta, nombre)
        base_nombre, extension = os.path.splitext(nombre)

        if modo == "alfabetico":
            secuencia_letras = _numero_a_letras(contador)
            nuevo_nombre_final = f"{prefijo}{secuencia_letras}{extension}"
        elif modo == "reemplazar":
            if buscar and buscar in base_nombre:
                base_modificada = base_nombre.replace(buscar, reemplazar)
                nuevo_nombre_final = f"{base_modificada}{extension}"
            else:
                continue
        elif modo == "plantilla" and plantilla:
            secuencia_letras = _numero_a_letras(contador)
            nuevo_base = plantilla.format(
                num=contador + 1,
                letra=secuencia_letras,
                orig=base_nombre
            )
            nuevo_nombre_final = f"{nuevo_base}{extension}"
        else:
            pref = prefijo if prefijo else "archivo_"
            nuevo_nombre_final = f"{pref}{contador + 1}{extension}"

        ruta_nueva = os.path.join(ruta_carpeta, nuevo_nombre_final)

        if ruta_vieja != ruta_nueva:
            os.rename(ruta_vieja, ruta_nueva)
            renombrados += 1
            contador += 1

    print(f"Jarvis: {renombrados} archivo(s) renombrados exitosamente en '{ruta_carpeta}' (modo: {modo}).")


def _resolver_ruta_archivo(nombre_o_ruta: str) -> str:
    """Resuelve una ruta de archivo si es relativa o busca en carpetas comunes del usuario."""
    if not nombre_o_ruta:
        return None
    ruta = os.path.expanduser(nombre_o_ruta.strip())
    if os.path.exists(ruta):
        return os.path.abspath(ruta)

    carpetas_base = [
        os.getcwd(),
        os.path.expanduser("~/Desktop"),
        os.path.expanduser("~/Downloads"),
        os.path.expanduser("~/Documents"),
        os.path.expanduser("~/Videos"),
        os.path.expanduser("~/Pictures"),
    ]
    for b in carpetas_base:
        posible = os.path.join(b, nombre_o_ruta)
        if os.path.exists(posible):
            return os.path.abspath(posible)

    base_name = os.path.basename(nombre_o_ruta).lower()
    for b in carpetas_base:
        if os.path.exists(b):
            for root, _, files in os.walk(b, onerror=lambda e: None):
                for f in files:
                    if f.lower() == base_name or base_name in f.lower():
                        return os.path.join(root, f)
    return None


def _resolver_ruta_carpeta(nombre_o_ruta: str, crear_si_no_existe: bool = False) -> str:
    """Resuelve una ruta de carpeta en el sistema."""
    if not nombre_o_ruta:
        return os.path.expanduser("~/Desktop")
    ruta = os.path.expanduser(nombre_o_ruta.strip())
    if os.path.isdir(ruta):
        return os.path.abspath(ruta)

    carpetas_alias = {
        "escritorio": os.path.expanduser("~/Desktop"),
        "desktop": os.path.expanduser("~/Desktop"),
        "descargas": os.path.expanduser("~/Downloads"),
        "downloads": os.path.expanduser("~/Downloads"),
        "documentos": os.path.expanduser("~/Documents"),
        "documents": os.path.expanduser("~/Documents"),
        "videos": os.path.expanduser("~/Videos"),
        "imagenes": os.path.expanduser("~/Pictures"),
        "imágenes": os.path.expanduser("~/Pictures"),
        "música": os.path.expanduser("~/Music"),
        "musica": os.path.expanduser("~/Music"),
    }

    clean_k = nombre_o_ruta.lower().strip()
    if clean_k in carpetas_alias:
        return carpetas_alias[clean_k]

    encontradas = _buscar_carpetas_en_sistema(nombre_o_ruta)
    if encontradas:
        return encontradas[0]

    if crear_si_no_existe:
        posible = os.path.join(os.path.expanduser("~/Documents"), nombre_o_ruta)
        os.makedirs(posible, exist_ok=True)
        return posible

    return None


def _resolver_ruta_destino(destino: str) -> str:
    """Resuelve la ruta de destino tanto si es una carpeta como si es un archivo con nombre específico."""
    if not destino:
        return os.path.expanduser("~/Desktop")
    d_clean = destino.strip()
    d_exp = os.path.expanduser(d_clean)

    # Si ya es un directorio existente
    if os.path.isdir(d_exp):
        return os.path.abspath(d_exp)

    # Si tiene extensión de archivo (ej: .txt, .pdf, .mp4), el destino es una ruta de archivo
    if os.path.splitext(d_exp)[1]:
        padre = os.path.dirname(d_exp)
        if padre:
            os.makedirs(padre, exist_ok=True)
        return os.path.abspath(d_exp)

    # Si coincide con alias de carpeta conocida
    r_carpeta = _resolver_ruta_carpeta(d_clean, crear_si_no_existe=False)
    if r_carpeta and os.path.isdir(r_carpeta):
        return r_carpeta

    # Por defecto, crear la carpeta si no existe
    return _resolver_ruta_carpeta(d_clean, crear_si_no_existe=True)


def mover_archivo(origen: str = None, destino: str = None, **kwargs):
    """Mueve un archivo o carpeta a otra ubicación."""
    if not origen or not destino:
        print("Jarvis: Especifica qué archivo deseas mover y a qué carpeta de destino.")
        return

    ruta_origen = _resolver_ruta_archivo(origen)
    if not ruta_origen:
        print(f"Jarvis: No encontré el archivo de origen '{origen}'.")
        return

    ruta_dest = _resolver_ruta_destino(destino)

    try:
        dest_final = shutil.move(ruta_origen, ruta_dest)
        print(f"Jarvis: Archivo '{os.path.basename(ruta_origen)}' movido exitosamente a '{dest_final}'.")
    except Exception as e:
        print(f"Jarvis: Error al mover el archivo ({e}).")


def copiar_archivo(origen: str = None, destino: str = None, **kwargs):
    """Copia un archivo o carpeta a otra ubicación."""
    if not origen or not destino:
        print("Jarvis: Especifica qué archivo deseas copiar y la carpeta de destino.")
        return

    ruta_origen = _resolver_ruta_archivo(origen)
    if not ruta_origen:
        print(f"Jarvis: No encontré el archivo de origen '{origen}'.")
        return

    ruta_dest = _resolver_ruta_destino(destino)

    try:
        if os.path.isdir(ruta_origen):
            if os.path.isdir(ruta_dest):
                dest_final = shutil.copytree(ruta_origen, os.path.join(ruta_dest, os.path.basename(ruta_origen)), dirs_exist_ok=True)
            else:
                dest_final = shutil.copytree(ruta_origen, ruta_dest, dirs_exist_ok=True)
        else:
            dest_final = shutil.copy2(ruta_origen, ruta_dest)
        print(f"Jarvis: Archivo '{os.path.basename(ruta_origen)}' copiado exitosamente a '{dest_final}'.")
    except Exception as e:
        print(f"Jarvis: Error al copiar el archivo ({e}).")


def eliminar_archivo(ruta: str = None, papelera: bool = True, **kwargs):
    """Elimina un archivo o lo envía a la Papelera de Reciclaje de Windows de forma segura."""
    if not ruta:
        print("Jarvis: Especifica qué archivo deseas eliminar.")
        return

    ruta_real = _resolver_ruta_archivo(ruta)
    if not ruta_real:
        print(f"Jarvis: No encontré el archivo '{ruta}' para eliminar.")
        return

    try:
        if papelera:
            ps_cmd = f'''Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile('{ruta_real}', 'OnlyErrorDialogs', 'SendToRecycleBin')'''
            res = subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], capture_output=True, text=True)
            if res.returncode == 0:
                print(f"Jarvis: Archivo '{os.path.basename(ruta_real)}' enviado a la Papelera de Reciclaje de forma segura.")
            else:
                os.remove(ruta_real)
                print(f"Jarvis: Archivo '{os.path.basename(ruta_real)}' eliminado.")
        else:
            if os.path.isdir(ruta_real):
                shutil.rmtree(ruta_real)
            else:
                os.remove(ruta_real)
            print(f"Jarvis: Archivo '{os.path.basename(ruta_real)}' eliminado permanentemente.")
    except Exception as e:
        print(f"Jarvis: Error al eliminar el archivo ({e}).")


def crear_carpeta(nombre: str = None, ruta: str = None, **kwargs):
    """Crea una nueva carpeta en la ruta indicada o en el Escritorio/Documentos."""
    if not nombre:
        print("Jarvis: Especifica el nombre de la carpeta que deseas crear.")
        return

    dir_padre = _resolver_ruta_carpeta(ruta) if ruta else os.path.expanduser("~/Desktop")
    nueva_ruta = os.path.join(dir_padre, nombre.strip())

    try:
        os.makedirs(nueva_ruta, exist_ok=True)
        print(f"Jarvis: Carpeta '{nombre}' creada exitosamente en '{dir_padre}'.")
    except Exception as e:
        print(f"Jarvis: Error al crear la carpeta ({e}).")


def buscar_archivos(nombre: str = None, tipo: str = None, dias: int = None, carpeta: str = None, **kwargs):
    """Busca archivos en el sistema por nombre, tipo/extensión o fecha de modificación reciente."""
    extension_map = {
        "pdf": [".pdf"], "documento": [".docx", ".doc", ".pdf", ".txt"], "word": [".docx", ".doc"],
        "excel": [".xlsx", ".xls", ".csv"], "imagen": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
        "foto": [".png", ".jpg", ".jpeg"], "video": [".mp4", ".mkv", ".mov", ".avi"],
        "musica": [".mp3", ".wav", ".flac", ".m4a"], "audio": [".mp3", ".wav", ".flac"],
        "codigo": [".py", ".js", ".html", ".css", ".json", ".cpp", ".c"], "texto": [".txt", ".md"],
    }

    exts = None
    if tipo:
        t_clean = tipo.lower().strip().replace(".", "")
        if t_clean in extension_map:
            exts = extension_map[t_clean]
        else:
            exts = [f".{t_clean}"]

    rutas_base = []
    if carpeta:
        r_c = _resolver_ruta_carpeta(carpeta)
        if r_c:
            rutas_base.append(r_c)

    if not rutas_base:
        rutas_base = [
            os.path.expanduser("~/Desktop"),
            os.path.expanduser("~/Downloads"),
            os.path.expanduser("~/Documents"),
            os.path.expanduser("~/Videos"),
            os.path.expanduser("~/Pictures"),
        ]

    limite_tiempo = None
    if dias:
        try:
            limite_tiempo = time.time() - (float(dias) * 86400)
        except (ValueError, TypeError):
            pass

    coincidencias = []
    nombre_clean = nombre.lower().strip() if nombre else None

    for base in rutas_base:
        if not os.path.exists(base):
            continue
        for root, _, files in os.walk(base, onerror=lambda e: None):
            if any(ign in root.lower() for ign in ["appdata", "node_modules", ".git", "cache"]):
                continue
            for f in files:
                f_lower = f.lower()

                if nombre_clean and nombre_clean not in f_lower:
                    continue

                if exts and not any(f_lower.endswith(ext) for ext in exts):
                    continue

                full_p = os.path.join(root, f)

                if limite_tiempo:
                    try:
                        mtime = os.path.getmtime(full_p)
                        if mtime < limite_tiempo:
                            continue
                    except Exception:
                        continue

                coincidencias.append(full_p)
                if len(coincidencias) >= 12:
                    break
            if len(coincidencias) >= 12:
                break

    if not coincidencias:
        print(f"Jarvis: No encontré ningún archivo que coincida con los criterios de búsqueda.")
        return

    print(f"\nJarvis: Encontré {len(coincidencias)} archivo(s):")
    for idx, c in enumerate(coincidencias, 1):
        mtime_str = datetime.fromtimestamp(os.path.getmtime(c)).strftime("%d/%m/%Y %H:%M")
        size_kb = round(os.path.getsize(c) / 1024, 1)
        print(f"  {idx}. {os.path.basename(c)} ({size_kb} KB, {mtime_str}) -> '{os.path.dirname(c)}'")
    print()


def controlar_volumen(accion: str = "subir", pasos: int = 5, **kwargs):
    """Controla el volumen de Windows (subir, bajar, silenciar/mute)."""
    user32 = ctypes.windll.user32
    VK_VOLUME_MUTE = 0xAD
    VK_VOLUME_DOWN = 0xAE
    VK_VOLUME_UP = 0xAF
    KEYEVENTF_KEYUP = 0x0002

    accion_clean = accion.lower().strip() if accion else "subir"

    def pulsar(vk):
        user32.keybd_event(vk, 0, 0, 0)
        time.sleep(0.02)
        user32.keybd_event(vk, 0, KEYEVENTF_KEYUP, 0)

    try:
        num_pasos = max(1, min(int(pasos), 25))
    except (ValueError, TypeError):
        num_pasos = 5

    if accion_clean in ("mutear", "silenciar", "mute", "silencio"):
        pulsar(VK_VOLUME_MUTE)
        print("Jarvis: Volumen silenciado / restaurado (Mute).")
    elif accion_clean in ("bajar", "disminuir", "menos", "down"):
        for _ in range(num_pasos):
            pulsar(VK_VOLUME_DOWN)
            time.sleep(0.02)
        print(f"Jarvis: Volumen reducido ({num_pasos} pasos).")
    else:
        for _ in range(num_pasos):
            pulsar(VK_VOLUME_UP)
            time.sleep(0.02)
        print(f"Jarvis: Volumen aumentado ({num_pasos} pasos).")


def controlar_reproductor(accion: str = "pausa_play", **kwargs):
    """Controla la reproducción multimedia activa en Windows (Spotify, YouTube, VLC)."""
    user32 = ctypes.windll.user32
    VK_MEDIA_NEXT_TRACK = 0xB0
    VK_MEDIA_PREV_TRACK = 0xB1
    VK_MEDIA_PLAY_PAUSE = 0xB3
    KEYEVENTF_KEYUP = 0x0002

    def pulsar(vk):
        user32.keybd_event(vk, 0, 0, 0)
        time.sleep(0.02)
        user32.keybd_event(vk, 0, KEYEVENTF_KEYUP, 0)

    accion_clean = accion.lower().strip() if accion else "pausa_play"

    if accion_clean in ("siguiente", "next", "pasar", "avanzar", "proxima", "adelantar"):
        pulsar(VK_MEDIA_NEXT_TRACK)
        print("Jarvis: Siguiente pista multimedia (Next).")
    elif accion_clean in ("anterior", "previous", "prev", "atras", "atrás"):
        pulsar(VK_MEDIA_PREV_TRACK)
        print("Jarvis: Pista multimedia anterior (Previous).")
    else:
        pulsar(VK_MEDIA_PLAY_PAUSE)
        print("Jarvis: Reproducción pausada / reanudada (Play/Pause).")


def grabar_pantalla(accion: str = "alternar", **kwargs):
    """Inicia o detiene la grabación de pantalla nativa de Windows (Game Bar: Win+Alt+R)."""
    user32 = ctypes.windll.user32
    VK_LWIN = 0x5B
    VK_MENU = 0x12
    VK_R = 0x52
    KEYEVENTF_KEYUP = 0x0002

    print("Jarvis: Enviando atajo de grabación de pantalla de Windows (Win+Alt+R)...")
    user32.keybd_event(VK_LWIN, 0, 0, 0)
    user32.keybd_event(VK_MENU, 0, 0, 0)
    user32.keybd_event(VK_R, 0, 0, 0)
    time.sleep(0.05)
    user32.keybd_event(VK_R, 0, KEYEVENTF_KEYUP, 0)
    user32.keybd_event(VK_MENU, 0, KEYEVENTF_KEYUP, 0)
    user32.keybd_event(VK_LWIN, 0, KEYEVENTF_KEYUP, 0)
    print("Jarvis: Grabación de pantalla iniciada / detenida (Win+Alt+R). Los videos se guardan en 'Videos\\Captures'.")


def guardar_recuerdo(recuerdo: str = None, clave: str = None, valor: str = None, **kwargs):
    """Guarda un hecho, preferencia o memoria de forma permanente."""
    texto_recuerdo = recuerdo or (f"{clave}: {valor}" if clave and valor else None)
    if texto_recuerdo and texto_recuerdo not in MEMORIA["recuerdos"]:
        MEMORIA["recuerdos"].append(texto_recuerdo)
        print(f"Jarvis: He guardado este recuerdo en mi memoria: \"{texto_recuerdo}\"")

    if clave and valor:
        clave_clean = clave.lower().strip()
        if clave_clean in ("nombre", "mi_nombre", "usuario"):
            MEMORIA["usuario"]["nombre"] = valor
            print(f"Jarvis: Guardado en memoria: tu nombre es {valor}.")
        elif clave_clean in ("navegador", "navegador_favorito", "browser"):
            MEMORIA["usuario"]["navegador_favorito"] = valor
            print(f"Jarvis: Guardado en memoria: tu navegador preferido es {valor}.")
        else:
            if "preferencias" not in MEMORIA["usuario"]:
                MEMORIA["usuario"]["preferencias"] = {}
            MEMORIA["usuario"]["preferencias"][clave] = valor
            print(f"Jarvis: Guardado en tus preferencias: {clave} = {valor}.")

    guardar_memoria(MEMORIA)


def reproducir_video(
    nombre_archivo: str = None,
    termino: str = None,
    destino: str = "auto",
    carpeta: str = None,
    criterio: str = "reciente",
    **kwargs
):
    """Reproduce videos locales en disco o música/videos en YouTube según la petición."""
    termino_busqueda = termino or nombre_archivo or kwargs.get("cancion") or kwargs.get("musica") or ""
    termino_str = str(termino_busqueda).strip()

    # Detectar si la petición es para YouTube / música / online
    es_youtube = (
        str(destino).lower() == "youtube" or
        (carpeta and "youtube" in str(carpeta).lower()) or
        (termino_str and ("youtube" in termino_str.lower() or any(w in termino_str.lower() for w in ["musica", "música", "cancion", "canción", "tema", "queen", "lofi", "rock", "pop", "video de", "vídeo de"])))
    )

    if es_youtube:
        termino_limpio = re.sub(r"(?i)\s*(en|de)?\s*youtube\s*", "", termino_str).strip()
        if not termino_limpio and carpeta:
            termino_limpio = str(carpeta).replace("youtube", "").strip()
        if not termino_limpio:
            termino_limpio = "música"
        print(f"Jarvis: Buscando y reproduciendo '{termino_limpio}' en YouTube...")
        buscar_en_internet(termino=termino_limpio, sitio="youtube")
        return

    # 1. Si se pidió un archivo de video local específico por su nombre
    if nombre_archivo:
        nombre_clean = str(nombre_archivo).strip()
        print(f"Jarvis: Buscando el video '{nombre_clean}' en tus discos...")
        video_encontrado = _buscar_video_por_nombre(nombre_clean)
        if video_encontrado:
            print(f"Jarvis: Reproduciendo '{os.path.basename(video_encontrado)}' desde '{os.path.dirname(video_encontrado)}'...")
            os.startfile(video_encontrado)
            return
        else:
            print(f"Jarvis: No encontré ningún archivo local '{nombre_clean}'. Buscando en YouTube...")
            buscar_en_internet(termino=nombre_clean, sitio="youtube")
            return

    # 2. Escaneo en carpetas locales (DJI, GoPro, Descargas, Videos)
    extensiones_video = (".mp4", ".mkv", ".avi", ".mov", ".webm", ".m4v")
    rutas_a_escanear = []

    if carpeta and str(carpeta).lower() not in ("videos", "descargas", "downloads"):
        encontradas = _buscar_carpetas_en_sistema(carpeta)
        if encontradas:
            rutas_a_escanear = encontradas[:2]
        else:
            print(f"Jarvis: No encontré la carpeta '{carpeta}' en ninguno de tus discos.")
            return
    else:
        user_home = os.path.expanduser("~")
        rutas_a_escanear = [os.path.join(user_home, "Downloads"), os.path.join(user_home, "Videos")]

    videos_encontrados = []
    for r_dir in rutas_a_escanear:
        if os.path.exists(r_dir):
            for root, _, files in os.walk(r_dir, onerror=lambda e: None):
                if "cache" in root.lower():
                    continue
                for f in files:
                    if f.lower().endswith(extensiones_video):
                        videos_encontrados.append(os.path.join(root, f))

    if not videos_encontrados:
        origen = f"en '{carpeta}'" if carpeta else "en tu carpeta de Descargas"
        print(f"Jarvis: No encontré ningún archivo de video {origen}.")
        return

    if criterio == "aleatorio":
        video_elegido = random.choice(videos_encontrados)
    else:
        video_elegido = max(videos_encontrados, key=os.path.getmtime)

    nombre_vid = os.path.basename(video_elegido)
    directorio_vid = os.path.dirname(video_elegido)
    print(f"Jarvis: Reproduciendo '{nombre_vid}' desde '{directorio_vid}'...")
    os.startfile(video_elegido)


def ver_pantalla(pregunta: str = None, **kwargs):
    """Captura la pantalla y utiliza VisionJARVIS con qwen2.5vl:7b para analizar lo que ve."""
    from modules.vision import VisionJARVIS
    vision = VisionJARVIS()
    print("Jarvis: Capturando y analizando pantalla con Visión Continua...")
    q = pregunta or "Describe en detalle y en español lo que ves en esta captura de pantalla de Windows (ventanas activas, navegador, aplicaciones, reproductor)."
    descripcion = vision.ver_pantalla(q)
    print(f"\nJarvis [Visión]: {descripcion}\n")


def buscar_elemento_en_pantalla(elemento: str = None, **kwargs):
    """Busca un botón o elemento visual en la pantalla."""
    if not elemento:
        print("Jarvis: Especifica qué elemento visual deseas buscar.")
        return
    from modules.vision import VisionJARVIS
    vision = VisionJARVIS()
    print(f"Jarvis: Buscando elemento '{elemento}' en pantalla...")
    res = vision.buscar_elemento(elemento)
    if res.get("encontrado"):
        print(f"Jarvis [Visión]: '{elemento}' ENCONTRADO en: {res.get('ubicacion')} ({res.get('descripcion')})")
    else:
        print(f"Jarvis [Visión]: No se encontró '{elemento}' en la pantalla.")


def detectar_error(**kwargs):
    """Verifica si en la pantalla hay algún mensaje de error, página rota o fallo."""
    from modules.vision import VisionJARVIS
    vision = VisionJARVIS()
    print("Jarvis: Inspeccionando pantalla en busca de errores...")
    res = vision.detectar_error()
    if res.get("hay_error"):
        print(f"\n⚠️ Jarvis [Visión] Detectó un posible error en pantalla: {res.get('mensaje')}\n")
    else:
        print("✅ Jarvis [Visión]: No se detectaron errores en pantalla. Todo en orden.")


def enviar_email(destinatario: str = None, asunto: str = None, cuerpo: str = None, adjunto: str = None, cliente: str = "gmail", **kwargs):
    """Envía o redacta un correo electrónico vía SMTP o interfaz web pre-rellenada."""
    from modules.gestor_email import GestorEmail
    GestorEmail.enviar_email(
        destinatario=destinatario,
        asunto=asunto or "Mensaje desde JARVIS",
        cuerpo=cuerpo or "",
        adjunto=adjunto,
        cliente=cliente
    )


def leer_emails(cliente: str = "gmail", **kwargs):
    """Abre la bandeja de entrada del correo."""
    from modules.gestor_email import GestorEmail
    GestorEmail.leer_emails(cliente=cliente)


def enviar_whatsapp(telefono: str = None, mensaje: str = "", **kwargs):
    """Abre WhatsApp Web con el contacto y mensaje listos."""
    from modules.mensajeria import MensajeriaJARVIS
    MensajeriaJARVIS.enviar_whatsapp(telefono=telefono, mensaje=mensaje)


def enviar_telegram(usuario: str = None, mensaje: str = "", **kwargs):
    """Abre Telegram Web con el chat o usuario indicado."""
    from modules.mensajeria import MensajeriaJARVIS
    MensajeriaJARVIS.enviar_telegram(usuario=usuario, mensaje=mensaje)


def publicar_tweet(texto: str = None, **kwargs):
    """Abre Twitter/X con el tweet redactado para publicar con 1 clic."""
    from modules.mensajeria import MensajeriaJARVIS
    MensajeriaJARVIS.publicar_tweet(texto=texto)


def crear_evento_calendario(titulo: str = None, fecha: str = None, descripcion: str = "", **kwargs):
    """Crea un evento en Google Calendar."""
    from modules.productividad import ProductividadJARVIS
    ProductividadJARVIS.crear_evento_calendario(titulo=titulo, fecha=fecha, descripcion=descripcion)


def traducir_texto(texto: str = None, idioma_destino: str = "es", **kwargs):
    """Abre el traductor de Google con el texto indicado."""
    from modules.productividad import ProductividadJARVIS
    ProductividadJARVIS.traducir_texto(texto=texto, idioma_destino=idioma_destino)


def _sanitizar_codigo_python(codigo: str) -> str:
    """Extrae código Python limpio y corrige saltos de línea rotos en strings."""
    if not codigo:
        return ""
    txt = codigo.strip()
    match = re.search(r"```(?:python)?\s*\n(.*?)\n```", txt, re.DOTALL)
    if match:
        txt = match.group(1).strip()
    elif txt.startswith("```"):
        lineas = txt.splitlines()
        if lineas and lineas[0].startswith("```"):
            lineas = lineas[1:]
        if lineas and lineas[-1].startswith("```"):
            lineas = lineas[:-1]
        txt = "\n".join(lineas).strip()

    txt = re.sub(r"'\s*\n+\s*'\.join", r"'\\n\\n'.join", txt)
    txt = re.sub(r'"\s*\n+\s*"\.join', r'"\\n\\n".join', txt)
    return txt


def _autocorregir_codigo(codigo_fallido: str, error_msg: str) -> str:
    """Envía el error a qwen2.5vl:7b para que devuelva el código Python corregido."""
    prompt_fix = f"""El siguiente código Python falló al ejecutarse en Windows.
Error:
{error_msg}

Código que falló:
```python
{codigo_fallido}
```

Librerías disponibles: requests, bs4 (BeautifulSoup), re, os, subprocess, tempfile, json, webbrowser, math, sys, glob, shutil, urllib.
Corrige el error. IMPORTANTE: Cierra siempre todas las comillas y paréntesis. RESPONDE ÚNICAMENTE CON EL CÓDIGO PYTHON CORREGIDO, sin markdown y sin explicaciones."""

    try:
        payload = {
            "model": MODELO,
            "prompt": prompt_fix,
            "stream": False,
            "options": opciones_generate(predict=512),
            **extra_generate(),
        }
        res = requests.post(OLLAMA_URL, json=payload, timeout=35)
        if res.status_code == 200:
            texto = res.json().get("response", "")
            return _sanitizar_codigo_python(texto)
    except Exception:
        pass
    return None


def ejecutar_codigo_python(codigo: str = "", descripcion: str = "Ejecutar lógica dinámica", **kwargs):
    """Ejecuta código Python dinámico con bucle de auto-corrección de errores."""
    if not codigo:
        print("Jarvis: No se recibió ningún código ejecutable.")
        return

    codigo_limpio = _sanitizar_codigo_python(codigo)

    print(f"\n--- [CÓDIGO GENERADO POR JARVIS] ---")
    if descripcion:
        print(f"# Propósito: {descripcion}")
    print(codigo_limpio)
    print("------------------------------------\n")

    entorno_globals = {
        "os": os,
        "sys": sys,
        "math": math,
        "re": re,
        "datetime": datetime,
        "shutil": shutil,
        "glob": glob,
        "tempfile": tempfile,
        "subprocess": subprocess,
        "Path": Path,
        "requests": requests,
        "bs4": bs4,
        "BeautifulSoup": bs4.BeautifulSoup,
        "json": json,
        "base64": base64,
        "urllib": urllib,
        "webbrowser": __import__("webbrowser"),
        "abrir_bloc_notas": abrir_bloc_notas,
        "abrir_sitio_web": abrir_sitio_web,
        "buscar_en_internet": buscar_en_internet,
        "buscar_app": _buscar_aplicacion_en_sistema,
        "buscar_carpetas": _buscar_carpetas_en_sistema,
        "reproducir_video": reproducir_video,
        "guardar_recuerdo": guardar_recuerdo,
        "print": print,
    }

    max_intentos = 2
    codigo_actual = codigo_limpio

    for intento in range(max_intentos):
        try:
            compiled = compile(codigo_actual, "<jarvis_dynamic>", "exec")
            exec(compiled, entorno_globals)
            print("Jarvis: Tarea completada con éxito.")
            return
        except Exception as e:
            error_detallado = traceback.format_exc()
            if intento < max_intentos - 1:
                print(f"Jarvis: Error detectado ({type(e).__name__}: {e}). Auto-corrigiendo código...")
                codigo_corregido = _autocorregir_codigo(codigo_actual, error_detallado)
                if codigo_corregido:
                    codigo_actual = codigo_corregido
                    print(f"\n--- [CÓDIGO CORREGIDO] ---\n{codigo_actual}\n-------------------------\n")
                    continue
            print(f"Jarvis: Error al ejecutar el código dinámico: {e}")


def conversar(respuesta: str = None, **kwargs):
    texto = respuesta or kwargs.get("mensaje_usuario") or "Entendido."
    print(f"Jarvis: {texto}")


FUNCIONES = {
    "abrir_bloc_notas": lambda p: abrir_bloc_notas(**p),
    "abrir_aplicacion": lambda p: abrir_aplicacion(**p),
    "cerrar_aplicacion": lambda p: cerrar_aplicacion(**p),
    "controlar_ventana": lambda p: controlar_ventana(**p),
    "abrir_sitio_web": lambda p: abrir_sitio_web(**p),
    "buscar_en_internet": lambda p: buscar_en_internet(**p),
    "controlar_navegador": lambda p: controlar_navegador(**p),
    "descargar_video": lambda p: descargar_video(**p),
    "abrir_carpeta": lambda p: abrir_carpeta(**p),
    "renombrar_archivos": lambda p: renombrar_archivos(**p),
    "mover_archivo": lambda p: mover_archivo(**p),
    "copiar_archivo": lambda p: copiar_archivo(**p),
    "eliminar_archivo": lambda p: eliminar_archivo(**p),
    "crear_carpeta": lambda p: crear_carpeta(**p),
    "buscar_archivos": lambda p: buscar_archivos(**p),
    "controlar_volumen": lambda p: controlar_volumen(**p),
    "controlar_reproductor": lambda p: controlar_reproductor(**p),
    "grabar_pantalla": lambda p: grabar_pantalla(**p),
    "capturar_pantalla": lambda p: capturar_pantalla(**p),
    "reproducir_video": lambda p: reproducir_video(**p),
    "ejecutar_codigo_python": lambda p: ejecutar_codigo_python(**p),
    "guardar_recuerdo": lambda p: guardar_recuerdo(**p),
    "ver_pantalla": lambda p: ver_pantalla(**p),
    "buscar_elemento_en_pantalla": lambda p: buscar_elemento_en_pantalla(**p),
    "detectar_error": lambda p: detectar_error(**p),
    "enviar_email": lambda p: enviar_email(**p),
    "leer_emails": lambda p: leer_emails(**p),
    "enviar_whatsapp": lambda p: enviar_whatsapp(**p),
    "enviar_telegram": lambda p: enviar_telegram(**p),
    "publicar_tweet": lambda p: publicar_tweet(**p),
    "crear_evento_calendario": lambda p: crear_evento_calendario(**p),
    "traducir_texto": lambda p: traducir_texto(**p),
    "conversar": lambda p: conversar(**p),
}

# =====================================================================
# 3. Interpretación Inteligente con Memoria en Ollama
# =====================================================================

REMAPEOS_ACCIONES = {
    "cerrar_pestana": ("controlar_navegador", {"accion": "cerrar_pestana"}),
    "nueva_pestana": ("controlar_navegador", {"accion": "nueva_pestana"}),
    "recargar": ("controlar_navegador", {"accion": "recargar"}),
    "recargar_pagina": ("controlar_navegador", {"accion": "recargar"}),
    "atras": ("controlar_navegador", {"accion": "atras"}),
    "adelante": ("controlar_navegador", {"accion": "adelante"}),
    "incognito": ("controlar_navegador", {"accion": "incognito"}),
    "restaurar_pestana": ("controlar_navegador", {"accion": "restaurar_pestana"}),
    "cerrar_app": ("cerrar_aplicacion", {}),
    "abrir_app": ("abrir_aplicacion", {}),
    "pausar_musica": ("controlar_reproductor", {"accion": "pausa_play"}),
    "siguiente_cancion": ("controlar_reproductor", {"accion": "siguiente"}),
    "subir_volumen": ("controlar_volumen", {"accion": "subir"}),
    "bajar_volumen": ("controlar_volumen", {"accion": "bajar"}),
    "silenciar": ("controlar_volumen", {"accion": "silenciar"}),
    "mute": ("controlar_volumen", {"accion": "silenciar"}),
    "screenshot": ("capturar_pantalla", {}),
    "tomar_captura": ("capturar_pantalla", {}),
    "sacar_captura": ("capturar_pantalla", {}),
    "captura": ("capturar_pantalla", {}),
}

def _construir_prompt_sistema() -> str:
    memoria_info = []
    if MEMORIA.get("usuario", {}).get("nombre"):
        memoria_info.append(f"- Nombre del usuario: {MEMORIA['usuario']['nombre']}")
    if MEMORIA.get("usuario", {}).get("navegador_favorito"):
        memoria_info.append(f"- Navegador preferido: {MEMORIA['usuario']['navegador_favorito']}")
    if MEMORIA.get("recuerdos"):
        memoria_info.append("- Recuerdos permanentes:\n" + "\n".join(f"  * {r}" for r in MEMORIA["recuerdos"][-5:]))
    if MEMORIA.get("ultimas_tareas"):
        tareas_previas = "\n".join(f"  - [{t['hora']}] \"{t['orden']}\" (Accion: {t['accion']})" for t in MEMORIA["ultimas_tareas"][-5:])
        memoria_info.append(f"- Historial de peticiones y tareas realizadas anteriormente:\n{tareas_previas}")

    bloque_memoria = "\n".join(memoria_info) if memoria_info else "- Sin datos guardados aun."

    return f"""Eres el modulo de interpretacion de JARVIS, un asistente inteligente en Windows.
El usuario se comunica en espanol usando lenguaje natural.

REGLAS CRITICAS (OBLIGATORIAS):
1. NUNCA repitas lo que dijo el usuario. Tu respuesta debe ser ORIGINAL y UTIL.
2. Para "conversar", pon tu respuesta DENTRO de parametros.respuesta. NO en mensaje_usuario.
3. "mensaje_usuario" es SOLO para un aviso breve ANTES de ejecutar una accion (ej: "Buscando..."). Para conversar, ponlo en null.
4. ORDENES MULTIPLES / COMPUESTAS (OBLIGATORIO): Si el mensaje del usuario contiene dos o mas ordenes o verbos de accion conectados por "y", "luego", "después", "a continuación", "y pon", "y abre", o comas (ej: "crea una carpeta X y abrela", "sube el volumen y pon música de Queen", "abre Opera y busca X", "abre Spotify y pon Bohemian Rhapsody", "abre bloc de notas y escribe X y luego minimiza", "abre calculadora y luego paint"):
DEBES usar SIEMPRE accion="secuencia_acciones" con la lista ordenada de TODOS los pasos en parametros.pasos. NUNCA ejecutes solo una parte de la orden cuando el usuario pide varias.
5. REPRODUCIR MUSICA O VIDEOS EN YOUTUBE: Si el usuario pide reproducir, poner o escuchar canciones, musica, artistas o videos de YouTube o internet (ej: "reproduce la musica mas famosa de queen", "reproduce queen en youtube", "pon bohemian rhapsody", "de la busqueda anterior reproduce..."), usa SIEMPRE "buscar_en_internet" con sitio="youtube". NUNCA uses "reproducir_video" para YouTube.
6. "reproducir_video" es EXCLUSIVAMENTE para archivos de video locales guardados en los discos duros de la PC (DJI Pocket, GoPro, Descargas, Videos).
7. MINIMIZAR TODAS LAS VENTANAS / MOSTRAR ESCRITORIO: Si el usuario dice "minimiza todas las ventanas", "minimiza todo", "muestra el escritorio", usa "controlar_ventana" con accion="mostrar_escritorio" y ventana=null.
8. CAPTURAS DE PANTALLA VS GRABAR VIDEO (OBLIGATORIO): Si el usuario pide "captura de pantalla", "pantallazo", "foto de la pantalla", "saca una captura", "envíame una captura", usa SIEMPRE accion="capturar_pantalla" (o "ver_pantalla" si pide analizarla). NUNCA uses "grabar_pantalla" para fotos o capturas estáticas. "grabar_pantalla" es SOLO si pide explícitamente "grabar video".

MEMORIA PERSISTENTE DEL USUARIO Y SESIONES ANTERIORES:
{bloque_memoria}

ACCIONES DISPONIBLES ({', '.join(sorted(ACCIONES_PERMITIDAS))}):

1. conversar:
   - parametros: {{"respuesta": "<TU RESPUESTA ORIGINAL al usuario. NO repitas su mensaje.>"}}
   - mensaje_usuario: null
   * USA ESTA ACCION para charlas, saludos, agradecimientos, o para RESPONDER preguntas.

2. reproducir_video:
   - "nombre_archivo": "<nombre o fragmento del archivo de video local si dio un nombre especifico, ej. 'DJI_20260807224001_0036_D', o null>",
   - "carpeta": "<nombre de la carpeta local donde buscar videos, ej. 'dji pocket 3', 'gopro', 'videos', o null>",
   - "criterio": "<'reciente' para el mas nuevo, o 'aleatorio'>"
   * USA ESTA ACCION EXCLUSIVAMENTE para videos locales guardados en el disco duro.

3. buscar_en_internet:
   - "termino": "<que buscar o reproducir, ej. 'musica mas famosa de queen', 'lofi hip hop'>",
   - "sitio": "<'youtube'|'google'|'bing'|'wikipedia'|'github'|'amazon'|null>",
   - "navegador": "<null>"
   * USA ESTA ACCION para buscar o reproducir musica, canciones, artistas o videos en YOUTUBE (sitio='youtube').
   * Para buscar productos en Amazon, usa sitio='amazon'.

23. controlar_navegador:
    - "accion": "<'nueva_pestana'|'cerrar_pestana'|'siguiente_pestana'|'anterior_pestana'|'recargar'|'atras'|'adelante'|'incognito'|'restaurar_pestana'>"
    * "abre una nueva pestaña" -> accion="controlar_navegador", parametros={{"accion": "nueva_pestana"}}
    * "cierra esta pestaña" / "cerrar pestaña" -> accion="controlar_navegador", parametros={{"accion": "cerrar_pestana"}}
    * "recarga la pagina" -> accion="controlar_navegador", parametros={{"accion": "recargar"}}
    * "navega atras" / "volver" -> accion="controlar_navegador", parametros={{"accion": "atras"}}
    * "navega adelante" -> accion="controlar_navegador", parametros={{"accion": "adelante"}}
    * "abre incognito" / "modo privado" -> accion="controlar_navegador", parametros={{"accion": "incognito"}}
    * "restaura la pestaña" -> accion="controlar_navegador", parametros={{"accion": "restaurar_pestana"}}

24. descargar_video:
    - "url": "<URL del video de YouTube u otra plataforma, o null>",
    - "termino": "<busqueda si no se dio URL, ej. 'tutorial python', o null>",
    - "carpeta": "<carpeta donde guardar la descarga, ej. 'Descargas', 'Videos', o null>"
    * USA ESTA ACCION para descargar videos de YouTube u otras plataformas a disco local. Usa yt-dlp.

4. controlar_ventana:
   - "accion": "<'minimizar'|'maximizar'|'restaurar'|'alternar'|'cambiar'|'mostrar_escritorio'>",
   - "ventana": "<nombre de la aplicacion/ventana si se indico, ej. 'opera', 'code', 'bloc de notas', o null>"
   * "minimiza todas las ventanas" -> accion="mostrar_escritorio", ventana=null
   * "minimiza la ventana de opera" -> accion="minimizar", ventana="opera"
   * "maximiza la ventana de opera" -> accion="maximizar", ventana="opera"
   * "cambia a la ventana de bloc de notas" -> accion="cambiar", ventana="bloc de notas"

5. controlar_volumen:
   - "accion": "<'subir'|'bajar'|'silenciar'>",
   - "pasos": <numero entero entre 1 y 20, ej. 5>
   * USA ESTA ACCION para subir, bajar o silenciar (mutear) el volumen del sistema.

6. controlar_reproductor:
   - "accion": "<'pausa_play'|'siguiente'|'anterior'>"
   * USA ESTA ACCION para pausar, reanudar o cambiar de cancion en Spotify, YouTube o reproductores multimedia.

7. grabar_pantalla:
   - "accion": "<'alternar'|'iniciar'|'detener'>"
   * USA ESTA ACCION EXCLUSIVAMENTE para grabar VIDEO continuo de la pantalla (Win+Alt+R). NO la uses para fotos o capturas estáticas.

27. capturar_pantalla:
    - {{}}
    * USA ESTA ACCION cuando el usuario pida tomar, sacar, hacer o enviar una captura de pantalla, pantallazo o foto de la pantalla o del escritorio. NUNCA uses grabar_pantalla para capturas de pantalla.

8. mover_archivo:
   - "origen": "<nombre o ruta del archivo a mover>",
   - "destino": "<carpeta de destino, ej. 'Documentos', 'Escritorio', 'Descargas', 'D:\\Nueva'>"

9. copiar_archivo:
   - "origen": "<nombre o ruta del archivo a copiar>",
   - "destino": "<carpeta de destino>"

10. eliminar_archivo:
    - "ruta": "<nombre o ruta del archivo a eliminar>",
    - "papelera": true
    * Envia archivos a la Papelera de Reciclaje de forma segura.

11. crear_carpeta:
    - "nombre": "<nombre de la nueva carpeta>",
    - "ruta": "<donde crearla, ej. 'Escritorio', 'Documentos', o null>"

12. buscar_archivos:
    - "nombre": "<texto o palabra clave en el nombre, o null>",
    - "tipo": "<'pdf'|'imagen'|'video'|'musica'|'documento'|'excel'|'codigo'|'texto'|null>",
    - "dias": <numero de dias recientes para filtrar por fecha, o null>,
    - "carpeta": "<carpeta donde buscar, o null para buscar en todo el usuario>"

13. renombrar_archivos:
    - "origen": "<nombre de archivo>", "nuevo_nombre": "<nuevo nombre>", "carpeta": "<carpeta>", "modo": "'numerico'|'alfabetico'|'reemplazar'|'plantilla'"

14. abrir_carpeta:
    - "nombre_o_ruta": "<nombre o ruta de la carpeta, o 'aleatoria'>"

15. abrir_bloc_notas:
    - "texto": "<el texto EXACTO que el usuario pidio dictar; si no dicto texto, PON null>"

16. abrir_aplicacion:
    - "nombre": "<nombre de la aplicacion o navegador, ej. 'opera', 'chrome', 'edge', 'calculadora', 'paint', 'spotify', 'discord', 'steam'>"

17. cerrar_aplicacion:
    - "nombre": "<nombre de la aplicacion o programa a cerrar, ej. 'spotify', 'discord', 'steam', 'bloc de notas', 'opera'>"

18. abrir_sitio_web:
    - "url_o_sitio": "<dominio o sitio con direccion web real, ej. 'google.com', 'github.com'>", "navegador": "<'opera'|'chrome'|'edge'|null>"

19. ver_pantalla:
    - "pregunta": "<pregunta opcional sobre la pantalla, ej. '¿qué hay en pantalla?', 'mira mi pantalla', o null>"
    * USA ESTA ACCION para capturar, ver y analizar la pantalla con el modelo de visión.

25. buscar_elemento_en_pantalla:
    - "elemento": "<nombre del botón o elemento visual a buscar, ej. 'botón de play', 'icono de cerrar'>"
    * USA ESTA ACCION cuando el usuario pregunte dónde está un botón o elemento en la pantalla.

26. detectar_error:
    - {{}}
    * USA ESTA ACCION para verificar con visión si hay mensajes de error o pantallas rotas.

20. guardar_recuerdo:
    - "recuerdo": "<hecho o dato a recordar>", "clave": "<'nombre'|'navegador_favorito'|'preferencia'|null>", "valor": "<valor>"

21. secuencia_acciones:
    - "pasos": [
        {{"accion": "<primera accion>", "parametros": {{<parametros>}}}},
        {{"accion": "<segunda accion>", "parametros": {{<parametros>}}}}
      ]
    * OBLIGATORIO para CUALQUIER orden con 2 o mas acciones:
      - "sube el volumen y pon musica de Queen en YouTube" -> pasos: [{{"accion": "controlar_volumen", "parametros": {{"accion": "subir"}}}}, {{"accion": "buscar_en_internet", "parametros": {{"sitio": "youtube", "termino": "musica de Queen"}}}}]
      - "crea una carpeta llamada X y abre la carpeta" -> pasos: [{{"accion": "crear_carpeta", "parametros": {{"nombre": "X"}}}}, {{"accion": "abrir_carpeta", "parametros": {{"nombre_o_ruta": "X"}}}}]
      - "abre opera y busca en youtube X" -> pasos: [{{"accion": "abrir_aplicacion", "parametros": {{"nombre": "opera"}}}}, {{"accion": "buscar_en_internet", "parametros": {{"sitio": "youtube", "termino": "X"}}}}]
      - "abre bloc de notas, escribe X y minimiza" -> pasos: [{{"accion": "abrir_bloc_notas", "parametros": {{"texto": "X"}}}}, {{"accion": "controlar_ventana", "parametros": {{"accion": "minimizar"}}}}]
      - "abre calculadora y luego paint" -> pasos: [{{"accion": "abrir_aplicacion", "parametros": {{"nombre": "calculadora"}}}}, {{"accion": "abrir_aplicacion", "parametros": {{"nombre": "paint"}}}}]

22. ejecutar_codigo_python:
    - "codigo": "<codigo Python VALIDO y COMPLETO>", "descripcion": "<resumen>"
    - USA ESTA ACCION para tareas de scraping o logica compleja de multiples llamadas a APIs.

23. ninguna: {{}}

FORMATO DE RESPUESTA (JSON estricto):
{{
  "accion": "<accion>",
  "parametros": {{<parametros de la accion>}},
  "confianza": <0.0 a 1.0>,
  "mensaje_usuario": "<aviso breve previo a la accion, o null>"
}}
RESPONDE UNICAMENTE CON EL JSON. SIN MARKDOWN.
"""


def procesar_orden_con_ia(orden: str) -> dict:
    prompt_sistema = _construir_prompt_sistema()

    historial_texto = ""
    if HISTORIAL_CONVERSACION:
        historial_texto = "\nHISTORIAL RECIENTE DE LA CONVERSACIÓN:\n"
        for t in HISTORIAL_CONVERSACION[-4:]:
            historial_texto += f"- {t['rol']}: {t['texto']}\n"

    prompt_completo = f"{prompt_sistema}\n{historial_texto}\nMensaje actual del usuario: \"{orden}\""

    payload = {
        "model": MODELO,
        "prompt": prompt_completo,
        "stream": False,
        "format": "json",
        "options": opciones_generate(),
        **extra_generate(),
    }

    try:
        respuesta = requests.post(OLLAMA_URL, json=payload, timeout=35)
        respuesta.raise_for_status()
    except requests.RequestException as e:
        print(f"Jarvis: No pude conectar con Ollama ({e}). ¿Está corriendo?")
        return {"accion": "ninguna", "parametros": {}, "confianza": 0.0, "mensaje_usuario": None}

    texto_modelo = respuesta.json().get("response", "")

    try:
        datos = json.loads(texto_modelo)
    except json.JSONDecodeError:
        print("Jarvis: La IA no devolvió un JSON válido.")
        return {"accion": "ninguna", "parametros": {}, "confianza": 0.0, "mensaje_usuario": None}

    # Si la IA devolvió una lista directa de pasos [ {...}, {...} ]
    if isinstance(datos, list):
        datos = {
            "accion": "secuencia_acciones",
            "parametros": {"pasos": datos},
            "confianza": 0.95,
            "mensaje_usuario": "Ejecutando secuencia de acciones..."
        }

    # Si la IA devolvió {"acciones": [...]}
    if isinstance(datos, dict) and "acciones" in datos and isinstance(datos["acciones"], list):
        datos = {
            "accion": "secuencia_acciones",
            "parametros": {"pasos": datos["acciones"]},
            "confianza": 0.95,
            "mensaje_usuario": datos.get("mensaje_usuario")
        }

    accion = datos.get("accion")
    parametros = datos.get("parametros", {})
    confianza = datos.get("confianza", 0.0)
    mensaje = datos.get("mensaje_usuario")

    # Si la acción es secuencia_acciones y parametros vino como lista directa [ {...}, {...} ]
    if accion == "secuencia_acciones" and isinstance(parametros, list):
        parametros = {"pasos": parametros}
    elif isinstance(parametros, dict) and "acciones" in parametros and "pasos" not in parametros:
        parametros["pasos"] = parametros["acciones"]

    # Remapeo inteligente de acciones directas que el LLM pueda sugerir
    if accion in REMAPEOS_ACCIONES:
        nueva_acc, param_extra = REMAPEOS_ACCIONES[accion]
        if isinstance(parametros, dict):
            parametros.update(param_extra)
        else:
            parametros = param_extra
        accion = nueva_acc

    # Corrección inteligente: si el modelo sugirió grabar_pantalla pero la orden pide una foto/captura estática
    if accion == "grabar_pantalla" and any(w in orden.lower() for w in ("captura", "pantallazo", "foto de la pantalla", "foto del escritorio")) and not any(w in orden.lower() for w in ("grabar", "video", "graba")):
        accion = "capturar_pantalla"
        parametros = {}

    if accion not in ACCIONES_PERMITIDAS:
        print(f"Jarvis: La IA sugirió la acción '{accion}' que no está permitida.")
        return {"accion": "ninguna", "parametros": {}, "confianza": 0.0, "mensaje_usuario": None}

    if not isinstance(parametros, dict):
        parametros = {}

    try:
        confianza = float(confianza)
    except (TypeError, ValueError):
        confianza = 0.0

    return {"accion": accion, "parametros": parametros, "confianza": confianza, "mensaje_usuario": mensaje}


# =====================================================================
# 4. Bucle Principal y Ejecución Segura
# =====================================================================

def _es_eco_del_usuario(texto: str, orden_usuario: str) -> bool:
    """Detecta si un texto es simplemente un eco de lo que dijo el usuario."""
    if not texto:
        return True
    t = texto.strip().lower().rstrip(".").rstrip("?").rstrip("!")
    o = orden_usuario.strip().lower().rstrip(".").rstrip("?").rstrip("!")
    if not t or not o:
        return not t
    # Eco exacto o casi exacto
    if t == o:
        return True
    # El mensaje es un prefijo/sufijo del input del usuario
    if t in o or o in t:
        # Solo si es muy similar (>80% de longitud)
        if len(t) > len(o) * 0.8 or len(o) > len(t) * 0.8:
            return True
    return False


def ejecutar_accion(resultado: dict, orden_usuario: str):
    accion = resultado["accion"]
    parametros = resultado["parametros"]
    confianza = resultado["confianza"]
    mensaje = resultado["mensaje_usuario"]

    # --- Registrar en historial en vivo ---
    HISTORIAL_CONVERSACION.append({"rol": "Usuario", "texto": orden_usuario})

    # --- Acción: conversar ---
    if accion == "conversar":
        texto = parametros.get("respuesta") or ""
        # Guard anti-eco: si la respuesta está vacía o es eco del usuario, usar fallback
        if not texto or _es_eco_del_usuario(texto, orden_usuario):
            texto = mensaje or ""
            if not texto or _es_eco_del_usuario(texto, orden_usuario):
                texto = "Entendido. \u00bfEn qu\u00e9 m\u00e1s puedo ayudarte?"
        HISTORIAL_CONVERSACION.append({"rol": "Jarvis", "texto": texto})
        conversar(respuesta=texto)
        return

    # --- Registrar en memoria persistente de tareas (solo acciones, no charla) ---
    if "ultimas_tareas" not in MEMORIA:
        MEMORIA["ultimas_tareas"] = []
    MEMORIA["ultimas_tareas"].append({
        "orden": orden_usuario,
        "accion": accion,
        "hora": datetime.now().strftime("%d/%m %H:%M")
    })
    MEMORIA["ultimas_tareas"] = MEMORIA["ultimas_tareas"][-30:]
    guardar_memoria(MEMORIA)

    # Imprimir mensaje previo SOLO si no es eco del usuario
    if mensaje and not _es_eco_del_usuario(mensaje, orden_usuario):
        print(f"Jarvis: {mensaje}")

    if accion == "ninguna":
        print("Jarvis: No puedo realizar esa acción por el momento.")
        HISTORIAL_CONVERSACION.append({"rol": "Jarvis", "texto": "No pude realizar la acción."})
        return

    # --- Acción compuesta: secuencia_acciones ---
    if accion == "secuencia_acciones" or (isinstance(parametros, dict) and "pasos" in parametros and isinstance(parametros["pasos"], list)):
        pasos = parametros.get("pasos", [])
        total_pasos = len(pasos)
        print(f"\nJarvis: Ejecutando secuencia de {total_pasos} pasos:")
        for idx, paso in enumerate(pasos, 1):
            if not isinstance(paso, dict):
                continue
            sub_acc = paso.get("accion")
            sub_params = paso.get("parametros", {})
            if not isinstance(sub_params, dict):
                sub_params = {}

            # Remapeo si aplica
            if sub_acc in REMAPEOS_ACCIONES:
                sub_acc_nueva, p_extra = REMAPEOS_ACCIONES[sub_acc]
                sub_params.update(p_extra)
                sub_acc = sub_acc_nueva

            sub_func = FUNCIONES.get(sub_acc)
            if sub_func:
                print(f"  > [Paso {idx}/{total_pasos}] {sub_acc}...")
                try:
                    sub_func(sub_params)
                except Exception as e:
                    print(f"    Error en paso {idx}: {e}")
            else:
                print(f"  > [Paso {idx}/{total_pasos}] Accion '{sub_acc}' no reconocida.")
            time.sleep(0.6)  # Pausa para sincronización en Windows
        print("Jarvis: Secuencia de acciones completada exitosamente.\n")
        HISTORIAL_CONVERSACION.append({"rol": "Jarvis", "texto": f"Secuencia de {total_pasos} acciones ejecutada."})
        return

    funcion = FUNCIONES.get(accion)
    if funcion is None:
        print(f"Jarvis: La acci\u00f3n '{accion}' no tiene implementaci\u00f3n asociada.")
        HISTORIAL_CONVERSACION.append({"rol": "Jarvis", "texto": f"Acci\u00f3n {accion} no encontrada."})
        return

    # Registrar en historial con descripción útil
    desc_historial = mensaje if (mensaje and not _es_eco_del_usuario(mensaje, orden_usuario)) else f"Ejecutando {accion}"
    HISTORIAL_CONVERSACION.append({"rol": "Jarvis", "texto": desc_historial})

    try:
        funcion(parametros)
    except TypeError as e:
        print(f"Jarvis: Error en los par\u00e1metros para '{accion}': {e}")
    except Exception as e:
        print(f"Jarvis: Ocurri\u00f3 un error inesperado al ejecutar '{accion}': {e}")


def procesar_orden(orden: str) -> bool:
    orden_normalizada = orden.lower().strip()
    if not orden_normalizada:
        return True  # Ignorar pulsación de Enter vacía

    if orden_normalizada in ("salir", "apagar", "adiós", "adios", "exit"):
        print("Jarvis: Hasta luego.")
        guardar_memoria(MEMORIA)
        return False

    resultado = procesar_orden_con_ia(orden)
    ejecutar_accion(resultado, orden)
    return True


def main():
    mostrar_banner()
    saludar()

    if os.name != "nt":
        print("Aviso: Este script está optimizado para Windows.\n")

    activo = True
    while activo:
        try:
            orden = input("Tú: ")
        except (KeyboardInterrupt, EOFError):
            print("\nJarvis: Hasta luego.")
            guardar_memoria(MEMORIA)
            break
        activo = procesar_orden(orden)


if __name__ == "__main__":
    main()
