#!/usr/bin/env python3
"""
JARVIS — Selector Dinámico de Interfaz Gráfica (GUI Switcher)
Permite alternar entre la GUI 1 (Clásica Stark Mark VII HUD) y la GUI 2 (Neural AI Command Center)
tanto por línea de comandos como mediante menú interactivo.
"""
import os
import sys
import json
import subprocess

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(ROOT_DIR, "config", "gui_config.json")


def load_config() -> dict:
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "gui_activa": "gui1",
        "disponibles": {
            "gui1": {
                "id": "gui1",
                "nombre": "Stark Mark VII HUD (Clásica 3D)",
                "descripcion": "Interfaz clásica con esfera 3D Three.js, partículas y telemetría de hardware.",
                "script": "apps/ollama_v5/jarvis_app.py",
                "cwd": "apps/ollama_v5"
            },
            "gui2": {
                "id": "gui2",
                "nombre": "Neural AI Command Center (Nueva)",
                "descripcion": "Interfaz moderna Cyberpunk/Stark con vistas de terminal, telemetría y red.",
                "script": "demos/ui_nueva/run_desktop.py",
                "cwd": "demos/ui_nueva"
            }
        }
    }


def save_config(config: dict):
    os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)


def set_gui(target: str):
    config = load_config()
    target_clean = str(target).strip().lower()

    if target_clean in ["1", "gui1", "clasica", "antigua", "v5"]:
        selected = "gui1"
    elif target_clean in ["2", "gui2", "nueva", "cyber", "cmd"]:
        selected = "gui2"
    else:
        print(f"❌ Opción no reconocida: '{target}'. Usa '1' (Clásica) o '2' (Nueva).")
        return False

    config["gui_activa"] = selected
    save_config(config)

    info = config["disponibles"][selected]
    print(f"\n✅ GUI Activa cambiada con éxito a: [{selected.upper()}] {info['nombre']}")
    print(f"   ℹ️ {info['descripcion']}\n")
    return True


def launch_active_gui():
    config = load_config()
    activa = config.get("gui_activa", "gui1")
    info = config["disponibles"].get(activa, config["disponibles"]["gui1"])

    script_path = os.path.join(ROOT_DIR, info["script"])
    cwd_path = os.path.join(ROOT_DIR, info.get("cwd", ""))

    print("=" * 60)
    print(f"🚀 Iniciando JARVIS con GUI Activa: {info['nombre']}")
    print(f"📁 Directorio: {cwd_path}")
    print("=" * 60)

    if not os.path.exists(script_path):
        print(f"❌ Error: No se encontró el script de la GUI en: {script_path}")
        sys.exit(1)

    try:
        subprocess.run([sys.executable, script_path], cwd=cwd_path)
    except KeyboardInterrupt:
        pass


def show_menu():
    config = load_config()
    activa = config.get("gui_activa", "gui1")

    print("\n" + "=" * 65)
    print("🤖 JARVIS — SELECTOR DINÁMICO DE INTERFAZ GRÁFICA (GUI)")
    print("=" * 65)

    for k, v in config["disponibles"].items():
        marcador = "👉 [ACTIVA]" if k == activa else "   "
        num = "1" if k == "gui1" else "2"
        print(f" {marcador} [{num}] {v['nombre']}")
        print(f"         {v['descripcion']}")
        print()

    print(" [0] Cancelar y salir")
    print(" [L] Lanzar la GUI activa actual")
    print("=" * 65)

    try:
        eleccion = input("Selecciona una opción [1/2/L/0]: ").strip().lower()
    except (KeyboardInterrupt, EOFError):
        print("\nOperación cancelada.")
        return

    if eleccion in ["1", "2"]:
        set_gui(eleccion)
        try:
            arrancar = input("¿Deseas iniciarla ahora mismo? (s/n): ").strip().lower()
            if arrancar in ["s", "si", "y", "yes"]:
                launch_active_gui()
        except (KeyboardInterrupt, EOFError):
            pass
    elif eleccion == "l":
        launch_active_gui()
    elif eleccion in ["0", "q", "exit"]:
        print("Saliendo...")
    else:
        print("Opción no válida.")


def main():
    if len(sys.argv) > 1:
        arg = sys.argv[1].strip().lower()
        if arg in ["--launch", "-l", "launch", "run", "iniciar"]:
            launch_active_gui()
            return
        elif arg in ["--status", "-s", "status"]:
            config = load_config()
            activa = config.get("gui_activa", "gui1")
            info = config["disponibles"][activa]
            print(f"GUI Activa: {activa} ({info['nombre']})")
            return
        elif arg in ["1", "2", "gui1", "gui2", "clasica", "nueva"]:
            set_gui(arg)
            return
        elif arg in ["--help", "-h", "help"]:
            print("Uso: python cambiar_gui.py [1 | 2 | --launch | --status]")
            return

    show_menu()


if __name__ == "__main__":
    main()
