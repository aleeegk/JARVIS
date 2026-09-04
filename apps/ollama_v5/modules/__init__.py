"""
Módulos de Capacidades, Automatización y APIs de JARVIS v5.
"""
from .browser import browser_tool, BrowserController
from .desktop import desktop_tool, DesktopController
from .files import file_tool, FileController
from .automation_cli import ejecutar_comando

__all__ = [
    "browser_tool",
    "BrowserController",
    "desktop_tool",
    "DesktopController",
    "file_tool",
    "FileController",
    "ejecutar_comando",
]
