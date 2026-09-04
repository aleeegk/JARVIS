"""
Canal Telegram para JARVIS v5 (solo GUI / Ollama).
=================================================
Proporciona control remoto total del PC desde Telegram:
1. Recepción y guardado inteligente de archivos/fotos (Downloads por defecto, o carpetas específicas/nuevas indicadas por el usuario).
2. Envío de archivos desde el PC hacia Telegram (búsqueda y despacho automático).
3. Visión e interpretación de imágenes enviadas por chat con Qwen2.5-VL (qwen2.5vl:7b).
4. Inspección de pantalla y aplicaciones/ventanas activas con envío de capturas.
5. Exploración de carpetas y verificación visual.
6. Delegación de órdenes del sistema al motor central de JARVIS v5.

Handoff para el siguiente agente:
- Usa exclusivamente `requests` para interactuar con la Bot API de Telegram (cero dependencias externas rotas).
- Token vive en config/.env (TELEGRAM_BOT_TOKEN), nunca en git ni en logs.
- Dueño: TELEGRAM_ALLOWED_CHAT_ID o el primer /start (telegram_owner_chat_id en jarvis_settings.json).
- El hilo es daemon: muere al cerrar la ventana PyWebView.
"""
from __future__ import annotations

import base64
import ctypes
from ctypes import wintypes
import io
import json
import os
import re
import sys
import threading
import time
from typing import Callable, Optional, Tuple, List

import requests

# Raíz del repo (JARVIS/) para cargar config/.env aunque cwd sea apps/ollama_v5
_MODULES_DIR = os.path.dirname(os.path.abspath(__file__))
_OLLAMA_DIR = os.path.dirname(_MODULES_DIR)
_ROOT_DIR = os.path.dirname(os.path.dirname(_OLLAMA_DIR))
_ENV_PATH = os.path.join(_ROOT_DIR, "config", ".env")

for _p in (_MODULES_DIR, _OLLAMA_DIR, _ROOT_DIR):
    if _p not in sys.path:
        sys.path.insert(0, _p)

def _cargar_env_local(path: str) -> None:
    """Lee config/.env aunque no esté instalado python-dotenv."""
    if not os.path.isfile(path):
        return
    try:
        from dotenv import load_dotenv
        load_dotenv(path)
    except ImportError:
        pass
    try:
        with open(path, "r", encoding="utf-8") as f:
            for raw in f:
                line = raw.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, val = line.partition("=")
                key = key.strip()
                val = val.strip().strip('"').strip("'")
                if key and key not in os.environ:
                    os.environ[key] = val
    except Exception as e:
        print(f"[Telegram] No se pudo leer .env: {e}")


_cargar_env_local(_ENV_PATH)

TELEGRAM_API = "https://api.telegram.org/bot{token}/{method}"
TELEGRAM_FILE_API = "https://api.telegram.org/file/bot{token}/{file_path}"
MAX_TG_CHARS = 3900
SETTINGS_OWNER_KEY = "telegram_owner_chat_id"

_ORDENES_CAPTURA_SIMPLE = {
    "captura de pantalla",
    "captura pantalla",
    "manda una captura",
    "manda captura",
    "saca una captura",
    "foto de la pantalla",
    "pantallazo",
}


def _load_json(path: str) -> dict:
    if not os.path.isfile(path):
        return {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def _save_json(path: str, data: dict) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def _owner_chat_id(settings_path: str) -> Optional[int]:
    """Env tiene prioridad; si no, el chat emparejado en settings (primer /start)."""
    raw = (os.getenv("TELEGRAM_ALLOWED_CHAT_ID") or "").strip()
    if raw:
        try:
            return int(raw)
        except ValueError:
            print("[Telegram] TELEGRAM_ALLOWED_CHAT_ID no es un número; se ignora.")
    data = _load_json(settings_path)
    saved = data.get(SETTINGS_OWNER_KEY)
    if saved is None or saved == "":
        return None
    try:
        return int(saved)
    except (TypeError, ValueError):
        return None


def _set_owner_chat_id(settings_path: str, chat_id: int) -> None:
    data = _load_json(settings_path)
    data[SETTINGS_OWNER_KEY] = chat_id
    _save_json(settings_path, data)


def _tg_url(token: str, method: str) -> str:
    return TELEGRAM_API.format(token=token, method=method)


def _send_text(token: str, chat_id: int, text: str) -> None:
    if not text:
        text = "(sin respuesta)"
    chunks = [text[i : i + MAX_TG_CHARS] for i in range(0, len(text), MAX_TG_CHARS)] or [text]
    for chunk in chunks:
        try:
            requests.post(
                _tg_url(token, "sendMessage"),
                json={"chat_id": chat_id, "text": chunk},
                timeout=30,
            )
        except Exception as e:
            print(f"[Telegram] Error enviando mensaje: {e}")


def _send_screenshot_bytes() -> Optional[bytes]:
    """Toma captura de pantalla con mss o Pillow y devuelve los bytes PNG."""
    try:
        import mss
        import mss.tools
        with mss.mss() as screen:
            mon = screen.monitors[1] if len(screen.monitors) > 1 else screen.monitors[0]
            imagen = screen.grab(mon)
            return mss.tools.to_png(imagen.rgb, imagen.size)
    except Exception as e:
        print(f"[Telegram] Error con mss en captura: {e}")

    try:
        from PIL import ImageGrab
        img = ImageGrab.grab(all_screens=True)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()
    except Exception as e:
        print(f"[Telegram] Error con ImageGrab en captura: {e}")
        return None


def _send_screenshot(token: str, chat_id: int, caption: str = "") -> None:
    """Captura el escritorio actual y lo entrega al chat."""
    png = _send_screenshot_bytes()
    if not png:
        _send_text(token, chat_id, "❌ No pude realizar la captura de pantalla en este momento.")
        return

    try:
        data = {"chat_id": str(chat_id)}
        if caption:
            data["caption"] = caption[:1024]
        res = requests.post(
            _tg_url(token, "sendPhoto"),
            data=data,
            files={"photo": ("captura-jarvis.png", png, "image/png")},
            timeout=35,
        )
        if res.status_code != 200:
            print(f"[Telegram] Error enviando captura: HTTP {res.status_code}")
    except Exception as e:
        print(f"[Telegram] Error enviando captura: {e}")
        _send_text(token, chat_id, "❌ Error al enviar la captura de pantalla.")


def _send_document(token: str, chat_id: int, file_path: str, caption: str = "") -> bool:
    """Envía un archivo del sistema al chat de Telegram."""
    if not os.path.isfile(file_path):
        _send_text(token, chat_id, f"❌ El archivo no existe: {file_path}")
        return False

    filename = os.path.basename(file_path)
    try:
        data = {"chat_id": str(chat_id)}
        if caption:
            data["caption"] = caption[:1024]

        with open(file_path, "rb") as f:
            files = {"document": (filename, f)}
            res = requests.post(
                _tg_url(token, "sendDocument"),
                data=data,
                files=files,
                timeout=60,
            )
        if res.status_code == 200:
            return True
        else:
            _send_text(token, chat_id, f"❌ Telegram devolvió error al enviar el archivo (HTTP {res.status_code}).")
            return False
    except Exception as e:
        print(f"[Telegram] Error enviando documento: {e}")
        _send_text(token, chat_id, f"❌ Error enviando archivo: {e}")
        return False


def _get_file_info(token: str, file_id: str) -> Optional[dict]:
    """Consulta la ruta de un archivo recibido en Telegram."""
    try:
        res = requests.get(_tg_url(token, "getFile"), params={"file_id": file_id}, timeout=20)
        if res.status_code == 200 and res.json().get("ok"):
            return res.json().get("result")
    except Exception as e:
        print(f"[Telegram] Error obteniendo info de archivo: {e}")
    return None


def _download_file(token: str, file_path: str) -> Optional[bytes]:
    """Descarga los bytes de un archivo desde la API de Telegram."""
    try:
        url = TELEGRAM_FILE_API.format(token=token, file_path=file_path)
        res = requests.get(url, timeout=60)
        if res.status_code == 200:
            return res.content
    except Exception as e:
        print(f"[Telegram] Error descargando archivo: {e}")
    return None


def _resolver_destino_guardado(texto_instruccion: str, nombre_original: str) -> str:
    """
    Handoff 2026-08-31: Determina la ruta donde se guardará el archivo enviado por Telegram.
    - Por defecto: Carpeta Descargas del usuario.
    - Si el usuario dice "en la carpeta jarvis en documentos", "en documentos", "crea la carpeta X en documentos", etc.:
      resuelve o crea el directorio correspondiente y ubica el archivo.
    """
    user_home = os.path.expanduser("~")
    downloads_dir = os.path.join(user_home, "Downloads")
    docs_dir = os.path.join(user_home, "Documents")
    desktop_dir = os.path.join(user_home, "Desktop")
    jarvis_dir = os.path.join(docs_dir, "JARVIS")

    destino_dir = downloads_dir
    nombre_limpio = os.path.basename(nombre_original).strip()
    if not nombre_limpio:
        nombre_limpio = f"archivo_{int(time.time())}"

    txt = texto_instruccion.lower().strip() if texto_instruccion else ""

    if txt:
        # Detectar peticiones de creación de carpetas explícitas (ej: "crea una carpeta llamada X en documentos y guarda")
        match_crear = re.search(r"crea(?:r)?\s+(?:una\s+)?carpeta\s+(?:llamada\s+|con\s+nombre\s+)?([a-zA-Z0-9_\-\s]+?)\s+en\s+([a-zA-Z0-9_\-\s\\]+)", txt)
        if match_crear:
            sub = match_crear.group(1).strip()
            padre = match_crear.group(2).strip()
            if "documento" in padre:
                base_padre = docs_dir
            elif "descarga" in padre:
                base_padre = downloads_dir
            elif "escritorio" in padre:
                base_padre = desktop_dir
            elif "jarvis" in padre:
                base_padre = jarvis_dir
            else:
                base_padre = docs_dir
            destino_dir = os.path.join(base_padre, sub)
        elif "jarvis" in txt:
            destino_dir = jarvis_dir
        elif "escritorio" in txt or "desktop" in txt:
            destino_dir = desktop_dir
        elif "documento" in txt or "documents" in txt:
            match_sub = re.search(r"carpeta\s+([a-zA-Z0-9_\-]+)", txt)
            if match_sub and match_sub.group(1) not in ("jarvis", "documentos"):
                destino_dir = os.path.join(docs_dir, match_sub.group(1).strip())
            else:
                destino_dir = docs_dir
        elif "descarga" in txt or "downloads" in txt:
            destino_dir = downloads_dir
        elif os.path.isabs(texto_instruccion.strip()):
            posible_dir = texto_instruccion.strip()
            if os.path.isdir(posible_dir) or not os.path.splitext(posible_dir)[1]:
                destino_dir = posible_dir

    try:
        os.makedirs(destino_dir, exist_ok=True)
    except Exception as e:
        print(f"[Telegram] No se pudo crear directorio {destino_dir}: {e}")
        destino_dir = downloads_dir
        os.makedirs(destino_dir, exist_ok=True)

    ruta_final = os.path.join(destino_dir, nombre_limpio)
    # Evitar sobreescritura accidental agregando índice si existe
    if os.path.exists(ruta_final):
        base, ext = os.path.splitext(nombre_limpio)
        idx = 1
        while os.path.exists(os.path.join(destino_dir, f"{base}_{idx}{ext}")):
            idx += 1
        ruta_final = os.path.join(destino_dir, f"{base}_{idx}{ext}")

    return ruta_final


def _buscar_archivo_para_enviar(termino_o_nombre: str) -> Optional[str]:
    """
    Handoff 2026-08-31: Localiza un archivo solicitado en las carpetas comunes del usuario.
    """
    termino = termino_o_nombre.strip().strip('"').strip("'")
    if not termino:
        return None

    # 1. Si es ruta directa existente
    if os.path.isfile(termino):
        return os.path.abspath(termino)

    user_home = os.path.expanduser("~")
    carpetas_busqueda = [
        os.path.join(user_home, "Documents", "JARVIS"),
        os.path.join(user_home, "Downloads"),
        os.path.join(user_home, "Documents"),
        os.path.join(user_home, "Desktop"),
        _ROOT_DIR,
    ]

    nombre_bajo = termino.lower()

    # Búsqueda directa exacta
    for base in carpetas_busqueda:
        if not os.path.isdir(base):
            continue
        candidato = os.path.join(base, termino)
        if os.path.isfile(candidato):
            return candidato

    # Búsqueda parcial o recursiva moderada
    for base in carpetas_busqueda:
        if not os.path.isdir(base):
            continue
        for root, dirs, files in os.walk(base):
            for f in files:
                if f.lower() == nombre_bajo or termino.lower() in f.lower():
                    return os.path.join(root, f)
            # Limitar profundidad
            if root.count(os.sep) - base.count(os.sep) >= 2:
                dirs.clear()

    return None


def _obtener_ventanas_y_programas_activos() -> str:
    """
    Handoff 2026-08-31: Obtiene títulos de ventanas activas visibles y aplicaciones en ejecución.
    """
    ventanas = []

    # 1. Enumeración por Windows API
    try:
        user32 = ctypes.windll.user32
        def enum_handler(hwnd, extra):
            if user32.IsWindowVisible(hwnd):
                length = user32.GetWindowTextLengthW(hwnd)
                if length > 0:
                    buff = ctypes.create_unicode_buffer(length + 1)
                    user32.GetWindowTextW(hwnd, buff, length + 1)
                    t = buff.value.strip()
                    ignorar = {"Program Manager", "Settings", "Default IME", "MSCTFIME UI", "Windows Shell Experience Host"}
                    if t and t not in ignorar and not t.startswith("Cortana"):
                        ventanas.append(t)
            return True

        WNDENUMPROC = ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)
        user32.EnumWindows(WNDENUMPROC(enum_handler), 0)
    except Exception as e:
        print(f"[Telegram] Error enumerando ventanas: {e}")

    # 2. Procesos de usuario interactivos relevantes
    procesos_relevantes = []
    try:
        import psutil
        apps_conocidas = {
            "chrome.exe": "Google Chrome",
            "code.exe": "Visual Studio Code",
            "explorer.exe": "Explorador de Windows",
            "telegram.exe": "Telegram Desktop",
            "spotify.exe": "Spotify",
            "notepad.exe": "Bloc de Notas",
            "discord.exe": "Discord",
            "msedge.exe": "Microsoft Edge",
            "opera.exe": "Opera Browser",
            "brave.exe": "Brave Browser",
            "powershell.exe": "PowerShell",
            "cmd.exe": "Símbolo del Sistema",
            "ollama app.exe": "Ollama Server",
        }
        vistos = set()
        for p in psutil.process_iter(["name"]):
            try:
                pname = (p.info["name"] or "").lower()
                if pname in apps_conocidas and pname not in vistos:
                    vistos.add(pname)
                    procesos_relevantes.append(apps_conocidas[pname])
            except Exception:
                pass
    except Exception:
        pass

    lineas = []
    lineas.append("🖥️ **Estado actual del escritorio y aplicaciones:**\n")
    if ventanas:
        lineas.append("📌 **Ventanas visibles abiertas:**")
        for v in sorted(set(ventanas))[:10]:
            lineas.append(f" • {v}")
    
    if procesos_relevantes:
        lineas.append("\n⚙️ **Aplicaciones activas en ejecución:**")
        for app in sorted(procesos_relevantes)[:10]:
            lineas.append(f" • {app}")

    if not ventanas and not procesos_relevantes:
        lineas.append("No se detectaron ventanas visibles de aplicaciones activas.")

    return "\n".join(lineas)


def _explorar_carpeta(nombre_o_ruta: str) -> Tuple[str, Optional[str]]:
    """
    Handoff 2026-08-31: Explora una carpeta y devuelve un listado estructurado de archivos.
    """
    user_home = os.path.expanduser("~")
    txt = nombre_o_ruta.lower().strip()

    if "jarvis" in txt:
        target = os.path.join(user_home, "Documents", "JARVIS")
    elif "descarga" in txt or "downloads" in txt:
        target = os.path.join(user_home, "Downloads")
    elif "escritorio" in txt or "desktop" in txt:
        target = os.path.join(user_home, "Desktop")
    elif "documento" in txt or "documents" in txt:
        target = os.path.join(user_home, "Documents")
    elif os.path.isdir(nombre_o_ruta.strip()):
        target = os.path.abspath(nombre_o_ruta.strip())
    else:
        candidato = os.path.join(user_home, "Documents", nombre_o_ruta.strip())
        if os.path.isdir(candidato):
            target = candidato
        else:
            target = os.path.join(user_home, "Downloads", nombre_o_ruta.strip())

    if not os.path.isdir(target):
        return f"❌ No se encontró la carpeta solicitada: '{nombre_o_ruta}'", None

    try:
        items = os.listdir(target)
        carpetas = []
        archivos = []
        for it in sorted(items):
            full = os.path.join(target, it)
            if os.path.isdir(full):
                carpetas.append(f"📁 [{it}]")
            else:
                tam = os.path.getsize(full)
                if tam > 1024 * 1024:
                    tam_str = f"{tam / (1024*1024):.1f} MB"
                elif tam > 1024:
                    tam_str = f"{tam / 1024:.1f} KB"
                else:
                    tam_str = f"{tam} B"
                archivos.append(f"📄 {it} ({tam_str})")

        res = [f"📂 **Contenido de:** `{target}`\n"]
        if carpetas:
            res.append(f"**Subcarpetas ({len(carpetas)}):**\n" + "\n".join(carpetas[:15]))
        if archivos:
            res.append(f"\n**Archivos ({len(archivos)}):**\n" + "\n".join(archivos[:25]))
        if not carpetas and not archivos:
            res.append("La carpeta está vacía.")

        return "\n".join(res), target
    except Exception as e:
        return f"❌ Error explorando la carpeta: {e}", None


def _analizar_foto_con_vision(img_bytes: bytes, prompt_usuario: str) -> str:
    """
    Handoff 2026-08-31: Envía una imagen recibida por Telegram al motor Qwen2.5-VL.
    """
    try:
        from vision import VisionJARVIS
        v = VisionJARVIS()
        prompt = prompt_usuario if prompt_usuario else "¿Qué observas en esta imagen? Describe los detalles relevantes en español."
        return v.analizar_imagen_bytes(img_bytes, prompt)
    except Exception as e:
        print(f"[Telegram] Error cargando VisionJARVIS: {e}")
        return f"❌ Error al procesar visión: {e}"


def _autorizado(chat_id: int, owner: Optional[int]) -> bool:
    return owner is not None and int(chat_id) == int(owner)


def _verificar_bot(token: str) -> bool:
    """Verifica credenciales del bot al arrancar."""
    try:
        res = requests.get(_tg_url(token, "getMe"), timeout=15)
        data = res.json()
    except Exception as e:
        print(f"[Telegram] No se pudo contactar la API: {e}")
        return False
    if res.status_code == 401 or not data.get("ok"):
        print("[Telegram] Token rechazado (401). Revisa TELEGRAM_BOT_TOKEN en config/.env.")
        return False
    username = (data.get("result") or {}).get("username") or "?"
    print(f"[Telegram] Bot verificado: @{username}. Control remoto activo para tu PC.")
    return True


def _bucle_polling(
    token: str,
    settings_path: str,
    process_orden: Callable[[str], dict],
) -> None:
    offset = None
    if not _verificar_bot(token):
        return

    while True:
        params = {"timeout": 25}
        if offset is not None:
            params["offset"] = offset
        try:
            res = requests.get(_tg_url(token, "getUpdates"), params=params, timeout=40)
        except Exception as e:
            print(f"[Telegram] Error de red en getUpdates: {e}")
            time.sleep(3)
            continue

        if res.status_code == 409:
            print("[Telegram] Conflicto 409: otro proceso ya hace getUpdates. Cierra la otra instancia.")
            time.sleep(10)
            continue
        if res.status_code == 429:
            wait = 5
            try:
                wait = int(res.json().get("parameters", {}).get("retry_after", 5))
            except Exception:
                pass
            time.sleep(max(wait, 1))
            continue
        if res.status_code != 200:
            print(f"[Telegram] getUpdates HTTP {res.status_code}")
            time.sleep(3)
            continue

        try:
            payload = res.json()
        except Exception:
            time.sleep(2)
            continue

        if not payload.get("ok"):
            time.sleep(2)
            continue

        for upd in payload.get("result") or []:
            offset = int(upd["update_id"]) + 1
            msg = upd.get("message") or upd.get("edited_message")
            if not msg:
                continue

            chat = msg.get("chat") or {}
            chat_id = chat.get("id")
            if chat_id is None:
                continue

            owner = _owner_chat_id(settings_path)
            caption = (msg.get("caption") or "").strip()
            texto = (msg.get("text") or "").strip()

            # Comandos de bienvenida y vinculación
            if texto.startswith("/start"):
                if owner is None:
                    _set_owner_chat_id(settings_path, int(chat_id))
                    _send_text(
                        token,
                        chat_id,
                        "🤖 **JARVIS Conectado a tu PC.**\n\n"
                        "Este chat ha quedado registrado como el PROPIETARIO exclusivo.\n"
                        "Capacidades remotas disponibles:\n"
                        " • Control y automatización de Windows (abrir apps, música, notas, etc.).\n"
                        " • Ver programas abiertos y pantalla (*'¿Qué hay abierto en la pantalla?'*).\n"
                        " • Enviar y recibir archivos bidireccionalmente (*'Envíame tal archivo'* o mándame un archivo y lo guardo).\n"
                        " • Visión de imágenes con IA (envía cualquier foto para analizarla).\n"
                        " • Exploración de carpetas y capturas de verificación.",
                    )
                elif _autorizado(int(chat_id), owner):
                    _send_text(token, chat_id, "🤖 JARVIS en línea y listo para recibir órdenes.")
                else:
                    _send_text(token, chat_id, "⛔ Este bot ya está vinculado exclusivamente a otro propietario.")
                continue

            if texto.startswith("/help"):
                _send_text(
                    token,
                    chat_id,
                    "📖 **Guía de Control Remoto de JARVIS:**\n\n"
                    "📸 **Pantalla y Ventanas:**\n"
                    " - *'Manda captura'*: Envía la captura actual.\n"
                    " - *'¿Qué hay abierto en la pantalla?'*: Lista ventanas y envía captura.\n\n"
                    "📥 **Recibir Archivos en tu PC:**\n"
                    " - Manda un archivo/foto y se guardará en `Descargas` por defecto.\n"
                    " - O añade en el texto dónde guardarlo (*'en la carpeta jarvis en documentos'*).\n\n"
                    "📤 **Pedir Archivos de tu PC:**\n"
                    " - *'Envíame el archivo informe.pdf'* o *'Mándame el archivo tal'*.\n\n"
                    "👁️ **Visión con IA:**\n"
                    " - Envía cualquier foto con tu pregunta y Qwen2.5-VL la interpretará.\n\n"
                    "📂 **Exploración de Carpetas:**\n"
                    " - *'¿Qué hay en la carpeta Descargas?'* o *'¿Qué hay en Documentos/JARVIS?'*.",
                )
                continue

            if owner is None:
                _send_text(token, chat_id, "⚠️ Envía primero /start para vincular este chat como propietario.")
                continue

            if not _autorizado(int(chat_id), owner):
                _send_text(token, chat_id, "⛔ Acceso no autorizado. Este JARVIS pertenece a otro usuario.")
                continue

            # =========================================================
            # CASO A: EL USUARIO ENVÍA UN ARCHIVO / DOCUMENTO / AUDIO
            # =========================================================
            doc = msg.get("document") or msg.get("audio") or msg.get("video")
            if doc:
                file_id = doc.get("file_id")
                orig_name = doc.get("file_name") or f"archivo_{int(time.time())}"
                file_info = _get_file_info(token, file_id) if file_id else None
                if file_info and file_info.get("file_path"):
                    _send_text(token, chat_id, f"⏳ Descargando `{orig_name}` en tu PC...")
                    data_bytes = _download_file(token, file_info["file_path"])
                    if data_bytes:
                        ruta_guardada = _resolver_destino_guardado(caption, orig_name)
                        try:
                            with open(ruta_guardada, "wb") as f:
                                f.write(data_bytes)
                            _send_text(token, chat_id, f"✅ **Archivo recibido y guardado exitosamente:**\n📂 `{ruta_guardada}`")
                        except Exception as e:
                            _send_text(token, chat_id, f"❌ Error escribiendo archivo en disco: {e}")
                    else:
                        _send_text(token, chat_id, "❌ No se pudo descargar el archivo desde Telegram.")
                else:
                    _send_text(token, chat_id, "❌ No se pudo obtener la información del archivo.")
                continue

            # =========================================================
            # CASO B: EL USUARIO ENVÍA UNA FOTO
            # =========================================================
            photo_list = msg.get("photo")
            if photo_list:
                # Tomar la imagen de mayor resolución (última de la lista)
                mejor_foto = photo_list[-1]
                file_id = mejor_foto.get("file_id")
                file_info = _get_file_info(token, file_id) if file_id else None

                if file_info and file_info.get("file_path"):
                    data_bytes = _download_file(token, file_info["file_path"])
                    if data_bytes:
                        # Si el caption indica guardar explícitamente
                        txt_cap = caption.lower()
                        if any(w in txt_cap for w in ("guarda", "guardar", "descarga", "salva", "almacena")):
                            orig_name = f"foto_{int(time.time())}.jpg"
                            ruta_guardada = _resolver_destino_guardado(caption, orig_name)
                            try:
                                with open(ruta_guardada, "wb") as f:
                                    f.write(data_bytes)
                                _send_text(token, chat_id, f"✅ **Foto guardada exitosamente:**\n📂 `{ruta_guardada}`")
                            except Exception as e:
                                _send_text(token, chat_id, f"❌ Error guardando foto: {e}")
                        else:
                            # Procesar con IA Vision (Qwen2.5-VL)
                            _send_text(token, chat_id, "👁️ Analizando imagen con Qwen2.5-VL...")
                            respuesta_vision = _analizar_foto_con_vision(data_bytes, caption)
                            _send_text(token, chat_id, respuesta_vision)
                    else:
                        _send_text(token, chat_id, "❌ Error descargando la foto para análisis.")
                continue

            # =========================================================
            # CASO C: MENSAJES DE TEXTO Y ÓRDENES A TRAVÉS DE LA IA
            # =========================================================
            if not texto:
                continue

            texto_lower = texto.lower()

            # Delegación directa al núcleo de IA de JARVIS v5 (Ollama / qwen2.5vl:7b)
            try:
                resultado = process_orden(texto)
            except Exception as e:
                _send_text(token, chat_id, f"❌ Error al procesar la orden: {e}")
                continue

            respuesta = ""
            accion = ""
            if isinstance(resultado, dict):
                respuesta = str(resultado.get("respuesta") or "")
                accion = str(resultado.get("accion") or "")
            else:
                respuesta = str(resultado)

            # Si la IA determinó capturar pantalla o la orden solicita captura/inspección visual
            if accion == "capturar_pantalla" or (any(p in texto_lower for p in ("captura", "pantallazo", "foto de la pantalla", "foto del escritorio")) and not any(w in texto_lower for w in ("grabar", "video", "graba"))):
                _send_screenshot(token, int(chat_id), caption="📸 Captura actual de tu pantalla")
                if respuesta and "captura" not in respuesta.lower():
                    _send_text(token, chat_id, respuesta)
            elif accion == "ver_pantalla":
                _send_screenshot(token, int(chat_id), caption="📸 Vista analizada por JARVIS")
                if respuesta:
                    _send_text(token, chat_id, respuesta)
            else:
                if respuesta:
                    _send_text(token, chat_id, respuesta)


def start_telegram_control(process_orden: Callable[[str], dict], settings_path: str) -> Optional[threading.Thread]:
    """Arranca el poller en segundo plano. Si no hay token, no hace nada (la GUI sigue)."""
    token = (os.getenv("TELEGRAM_BOT_TOKEN") or "").strip()
    if not token:
        print("[Telegram] Sin TELEGRAM_BOT_TOKEN en config/.env — canal Telegram desactivado.")
        return None

    t = threading.Thread(
        target=_bucle_polling,
        args=(token, settings_path, process_orden),
        name="jarvis-telegram",
        daemon=True,
    )
    t.start()
    return t
