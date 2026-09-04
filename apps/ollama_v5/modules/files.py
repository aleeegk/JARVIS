"""
JARVIS v5 — Módulo de Gestión de Archivos para Windows (files.py)
Operaciones del sistema de archivos, búsqueda inteligente y detección
de archivos seleccionados en el Explorador de Windows con pywinselect.
"""
import os
import sys
import shutil
import pathlib
import subprocess
from typing import List, Dict, Any, Optional

try:
    import pywinselect
    PYWINSELECT_AVAILABLE = True
except ImportError:
    PYWINSELECT_AVAILABLE = False

try:
    import send2trash
    SEND2TRASH_AVAILABLE = True
except ImportError:
    SEND2TRASH_AVAILABLE = False


class FileController:
    """Controlador de operaciones de archivos y carpetas en Windows."""

    def __init__(self):
        pass

    # =========================================================================
    # 1. INTEGRACIÓN CON EXPLORADOR DE WINDOWS (pywinselect)
    # =========================================================================

    def obtener_archivos_seleccionados(self) -> Dict[str, Any]:
        """
        Retorna la lista de rutas de archivos o carpetas seleccionados
        actualmente por el usuario en el Explorador de Windows.
        """
        if not PYWINSELECT_AVAILABLE:
            return {
                "exito": False,
                "error": "pywinselect no disponible",
                "seleccionados": []
            }
        try:
            seleccionados = pywinselect.get_selected()
            return {
                "exito": True,
                "total": len(seleccionados),
                "seleccionados": seleccionados,
                "mensaje": f"{len(seleccionados)} elemento(s) seleccionado(s) en Explorer."
            }
        except Exception as e:
            return {
                "exito": False,
                "error": str(e),
                "seleccionados": []
            }

    # =========================================================================
    # 2. BÚSQUEDA Y NAVEGACIÓN
    # =========================================================================

    def buscar_archivos(self, directorio: str, patron: str = "*", recursivo: bool = True, limite: int = 50) -> Dict[str, Any]:
        """Busca archivos que coincidan con un patrón glob dentro de un directorio."""
        dir_path = pathlib.Path(directorio).expanduser().resolve()
        if not dir_path.exists() or not dir_path.is_dir():
            return {"exito": False, "error": f"Directorio no válido: {directorio}", "archivos": []}

        resultados = []
        try:
            generator = dir_path.rglob(patron) if recursivo else dir_path.glob(patron)
            for item in generator:
                if len(resultados) >= limite:
                    break
                try:
                    resultados.append({
                        "nombre": item.name,
                        "ruta": str(item),
                        "es_directorio": item.is_dir(),
                        "tamano_bytes": item.stat().st_size if item.is_file() else 0
                    })
                except Exception:
                    continue

            return {
                "exito": True,
                "total": len(resultados),
                "archivos": resultados,
                "patron": patron,
                "directorio": str(dir_path)
            }
        except Exception as e:
            return {"exito": False, "error": str(e), "archivos": []}

    def abrir_archivo(self, ruta: str) -> Dict[str, Any]:
        """Abre un archivo o programa con su aplicación asociada en Windows."""
        abs_path = os.path.abspath(ruta)
        if not os.path.exists(abs_path):
            return {"exito": False, "error": f"El archivo no existe: {ruta}"}

        try:
            os.startfile(abs_path)
            return {"exito": True, "mensaje": f"Abriendo '{abs_path}' en Windows."}
        except Exception as e:
            return {"exito": False, "error": str(e)}

    def mostrar_en_explorer(self, ruta: str) -> Dict[str, Any]:
        """Abre el Explorador de Windows y resalta el archivo o carpeta indicado."""
        abs_path = os.path.abspath(ruta)
        if not os.path.exists(abs_path):
            return {"exito": False, "error": f"Ruta no encontrada: {ruta}"}

        try:
            if os.path.isdir(abs_path):
                subprocess.Popen(f'explorer "{abs_path}"')
            else:
                subprocess.Popen(f'explorer /select,"{abs_path}"')
            return {"exito": True, "mensaje": f"Mostrando en Explorer: {abs_path}"}
        except Exception as e:
            return {"exito": False, "error": str(e)}

    # =========================================================================
    # 3. MANIPULACIÓN DE ARCHIVOS
    # =========================================================================

    def copiar(self, origen: str, destino: str) -> Dict[str, Any]:
        """Copia un archivo o carpeta a una nueva ubicación."""
        try:
            src = pathlib.Path(origen).resolve()
            dst = pathlib.Path(destino).resolve()
            if not src.exists():
                return {"exito": False, "error": f"Origen no existe: {origen}"}

            if src.is_dir():
                shutil.copytree(src, dst, dirs_exist_ok=True)
            else:
                if dst.is_dir():
                    shutil.copy2(src, dst / src.name)
                else:
                    shutil.copy2(src, dst)

            return {"exito": True, "mensaje": f"Copiado '{origen}' -> '{destino}'"}
        except Exception as e:
            return {"exito": False, "error": str(e)}

    def mover(self, origen: str, destino: str) -> Dict[str, Any]:
        """Mueve o renombra un archivo o carpeta."""
        try:
            shutil.move(origen, destino)
            return {"exito": True, "mensaje": f"Movido '{origen}' -> '{destino}'"}
        except Exception as e:
            return {"exito": False, "error": str(e)}

    def eliminar(self, ruta: str, enviar_a_papelera: bool = True) -> Dict[str, Any]:
        """Elimina un archivo o carpeta (por defecto a la Papelera de Reciclaje)."""
        abs_path = os.path.abspath(ruta)
        if not os.path.exists(abs_path):
            return {"exito": False, "error": f"Ruta no existe: {ruta}"}

        try:
            if enviar_a_papelera and SEND2TRASH_AVAILABLE:
                send2trash.send2trash(abs_path)
                return {"exito": True, "mensaje": f"Enviado a la Papelera: {abs_path}"}
            else:
                if os.path.isdir(abs_path):
                    shutil.rmtree(abs_path)
                else:
                    os.remove(abs_path)
                return {"exito": True, "mensaje": f"Eliminado permanentemente: {abs_path}"}
        except Exception as e:
            return {"exito": False, "error": str(e)}

    def leer_archivo(self, ruta: str, max_caracteres: int = 20000, encoding: str = "utf-8") -> Dict[str, Any]:
        """Lee el contenido textual de un archivo."""
        if not os.path.isfile(ruta):
            return {"exito": False, "error": f"No es un archivo válido: {ruta}"}

        try:
            with open(ruta, "r", encoding=encoding, errors="replace") as f:
                contenido = f.read(max_caracteres)
            return {
                "exito": True,
                "ruta": ruta,
                "contenido": contenido,
                "truncado": len(contenido) >= max_caracteres
            }
        except Exception as e:
            return {"exito": False, "error": str(e)}

    def escribir_archivo(self, ruta: str, contenido: str, agregar: bool = False, encoding: str = "utf-8") -> Dict[str, Any]:
        """Escribe o anexa texto a un archivo en disco."""
        try:
            os.makedirs(os.path.dirname(os.path.abspath(ruta)), exist_ok=True)
            modo = "a" if agregar else "w"
            with open(ruta, modo, encoding=encoding) as f:
                f.write(contenido)
            return {"exito": True, "ruta": ruta, "bytes_escritos": len(contenido.encode(encoding))}
        except Exception as e:
            return {"exito": False, "error": str(e)}

    def obtener_metadatos(self, ruta: str) -> Dict[str, Any]:
        """Obtiene información detallada sobre un archivo o carpeta."""
        p = pathlib.Path(ruta).resolve()
        if not p.exists():
            return {"exito": False, "error": "Ruta no encontrada."}

        st = p.stat()
        return {
            "exito": True,
            "nombre": p.name,
            "ruta": str(p),
            "es_directorio": p.is_dir(),
            "extension": p.suffix,
            "tamano_bytes": st.st_size,
            "fecha_modificacion": st.st_mtime
        }


# Instancia global para importación directa
file_tool = FileController()


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="JARVIS File Management Tool")
    subparsers = parser.add_subparsers(dest="subcommand")

    subparsers.add_parser("selected", help="Obtener archivos seleccionados en Explorer")

    find_p = subparsers.add_parser("find", help="Buscar archivos")
    find_p.add_argument("dir", help="Directorio base")
    find_p.add_argument("--pattern", default="*", help="Patrón glob (ej: *.txt)")

    open_p = subparsers.add_parser("open", help="Abrir archivo o carpeta")
    open_p.add_argument("path", help="Ruta a abrir")

    reveal_p = subparsers.add_parser("reveal", help="Mostrar archivo en Explorer")
    reveal_p.add_argument("path", help="Ruta a resaltar")

    args = parser.parse_args()

    if args.subcommand == "selected":
        sel = file_tool.obtener_archivos_seleccionados()
        if sel.get("exito"):
            items = sel.get("seleccionados", [])
            print(f"\n--- Archivos seleccionados en Explorer ({len(items)}) ---")
            for it in items:
                print(f" -> {it}")
        else:
            print(f"Error: {sel.get('error')}")
    elif args.subcommand == "find":
        res = file_tool.buscar_archivos(args.dir, args.pattern)
        if res.get("exito"):
            archivos = res.get("archivos", [])
            print(f"\nEncontrados {len(archivos)} resultado(s):")
            for a in archivos:
                print(f" {'[DIR]' if a['es_directorio'] else '[FILE]'} {a['ruta']}")
        else:
            print(f"Error: {res.get('error')}")
    elif args.subcommand == "open":
        res = file_tool.abrir_archivo(args.path)
        print(res.get("mensaje", res.get("error")))
    elif args.subcommand == "reveal":
        res = file_tool.mostrar_en_explorer(args.path)
        print(res.get("mensaje", res.get("error")))
    else:
        print("Módulo Files JARVIS v5 cargado. Usa --help para ver comandos disponibles.")
