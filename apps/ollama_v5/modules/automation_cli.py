"""
JARVIS v5 — Sistema Unificado de Comandos y Automatización (automation_cli.py)
Despachador central para invocar tareas de browser, desktop y files
de forma reutilizable y sin configuración compleja en Windows.
"""
import os
import sys
import json

# Asegurar rutas de importación
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from browser import browser_tool
from desktop import desktop_tool
from files import file_tool


def ejecutar_comando(modulo: str, accion: str, params: dict = None) -> dict:
    """
    Despacha y ejecuta una acción sobre uno de los tres módulos locales.
    Retorna un diccionario estructurado con el resultado.
    """
    params = params or {}
    modulo = str(modulo).lower()
    accion = str(accion).lower()

    # 1. BROWSER
    if modulo in ["browser", "web", "navegador"]:
        if accion in ["open", "abrir"]:
            return browser_tool.abrir_url(params.get("url", "https://google.com"))
        elif accion in ["search", "buscar"]:
            return browser_tool.buscar_en_web(params.get("query", ""), params.get("engine", "google"))
        elif accion in ["extract", "extraer"]:
            return browser_tool.extraer_texto_pagina(params.get("url", ""))
        elif accion in ["screenshot", "captura"]:
            return browser_tool.capturar_pagina(params.get("url", ""), params.get("output"))
        elif accion in ["info"]:
            return browser_tool.info_soporte()

    # 2. DESKTOP
    elif modulo in ["desktop", "escritorio", "pc"]:
        if accion in ["windows", "ventanas", "list"]:
            return {"exito": True, "ventanas": desktop_tool.listar_ventanas()}
        elif accion in ["focus", "enfocar"]:
            return desktop_tool.enfocar_ventana(params.get("title", ""))
        elif accion in ["minimize", "minimizar"]:
            return desktop_tool.minimizar_ventana(params.get("title", ""))
        elif accion in ["close", "cerrar"]:
            return desktop_tool.cerrar_ventana(params.get("title", ""))
        elif accion in ["launch", "lanzar"]:
            return desktop_tool.lanzar_aplicacion(params.get("command", ""))
        elif accion in ["type", "escribir"]:
            return desktop_tool.escribir_texto(params.get("text", ""))
        elif accion in ["click"]:
            return desktop_tool.click(x=params.get("x"), y=params.get("y"), boton=params.get("button", "left"))
        elif accion in ["hotkey", "atajo"]:
            teclas = params.get("keys", [])
            if isinstance(teclas, str):
                teclas = teclas.split()
            return desktop_tool.ejecutar_atajo(*teclas)
        elif accion in ["screensize", "resolucion"]:
            return desktop_tool.obtener_resolucion()
        elif accion in ["screenshot", "captura"]:
            return desktop_tool.capturar_pantalla(params.get("output"))

    # 3. FILES
    elif modulo in ["files", "archivos", "file"]:
        if accion in ["selected", "seleccionados"]:
            return file_tool.obtener_archivos_seleccionados()
        elif accion in ["find", "buscar"]:
            return file_tool.buscar_archivos(params.get("dir", "."), params.get("pattern", "*"))
        elif accion in ["open", "abrir"]:
            return file_tool.abrir_archivo(params.get("path", ""))
        elif accion in ["reveal", "mostrar"]:
            return file_tool.mostrar_en_explorer(params.get("path", ""))
        elif accion in ["copy", "copiar"]:
            return file_tool.copiar(params.get("source", ""), params.get("dest", ""))
        elif accion in ["move", "mover"]:
            return file_tool.mover(params.get("source", ""), params.get("dest", ""))
        elif accion in ["delete", "eliminar"]:
            return file_tool.eliminar(params.get("path", ""), params.get("trash", True))
        elif accion in ["read", "leer"]:
            return file_tool.leer_archivo(params.get("path", ""))
        elif accion in ["write", "escribir"]:
            return file_tool.escribir_archivo(params.get("path", ""), params.get("content", ""))

    return {
        "exito": False,
        "error": f"Acción '{accion}' no reconocida para el módulo '{modulo}'."
    }


def main():
    if len(sys.argv) < 3:
        print("=" * 65)
        print("🤖 JARVIS — SISTEMA DE COMANDOS DE AUTOMATIZACIÓN LOCAL")
        print("=" * 65)
        print("Uso: python automation_cli.py <modulo> <accion> [parametros en json o texto]")
        print("\nEjemplos:")
        print("  python automation_cli.py browser open https://github.com")
        print("  python automation_cli.py browser search 'noticias de tecnologia'")
        print("  python automation_cli.py desktop windows")
        print("  python automation_cli.py desktop focus 'Chrome'")
        print("  python automation_cli.py desktop hotkey ctrl alt delete")
        print("  python automation_cli.py files selected")
        print("  python automation_cli.py files find . --pattern '*.bat'")
        print("=" * 65)
        return

    mod = sys.argv[1].lower()
    acc = sys.argv[2].lower()

    # Construir params según el comando
    params = {}
    rest_args = sys.argv[3:]

    if mod in ["browser", "web"]:
        if acc in ["open", "extract"]:
            if rest_args: params["url"] = rest_args[0]
        elif acc in ["search"]:
            params["query"] = " ".join(rest_args)
    elif mod in ["desktop", "pc"]:
        if acc in ["focus", "minimize", "close"]:
            if rest_args: params["title"] = " ".join(rest_args)
        elif acc in ["type"]:
            params["text"] = " ".join(rest_args)
        elif acc in ["hotkey"]:
            params["keys"] = rest_args
        elif acc in ["launch"]:
            params["command"] = " ".join(rest_args)
    elif mod in ["files", "archivos"]:
        if acc in ["open", "reveal", "read", "delete"]:
            if rest_args: params["path"] = rest_args[0]
        elif acc in ["find"]:
            params["dir"] = rest_args[0] if rest_args else "."
            if len(rest_args) > 1 and rest_args[1] == "--pattern" and len(rest_args) > 2:
                params["pattern"] = rest_args[2]

    res = ejecutar_comando(mod, acc, params)
    print(json.dumps(res, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
