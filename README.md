# 🤖 JARVIS — Asistente Autónomo para Windows

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://www.microsoft.com/windows)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20AI-white?style=for-the-badge&logo=ollama&logoColor=black)](https://ollama.ai/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**JARVIS** es un sistema autónomo de asistencia y automatización para Windows que opera de forma local e independiente. Integra visión computacional en tiempo real, síntesis de voz multicanal offline, control total del sistema operativo y una interfaz holográfica 3D inspirada en Stark Industries.

---

## ⚡ Características Principales

### 🌐 Motor Autónomo Local & Holográfico (Ollama)
Diseñado para funcionar **100% en tu equipo**, garantizando máxima privacidad, baja latencia y control directo sobre el ordenador:
- **Modelo de IA:** `qwen2.5vl:7b` vía Ollama (Visión por computadora, lectura de pantalla, ejecución de comandos y razonamiento espacial).
- **Interfaz Gráfica:** **Stark Mark VII HUD** (`jarvis_ui.html` + `jarvis_app.py` mediante PyWebView) con esfera holográfica 3D interactiva en Three.js, partículas reactivas y telemetría de hardware (CPU, RAM, disco) en tiempo real.
- **Control Remoto vía Telegram:** Daemon en segundo plano (`jarvis_telegram_daemon.py`) que permite ordenar tareas al PC desde el móvil: recepción y guardado de archivos, capturas de pantalla instantáneas, análisis visual con Qwen2.5-VL y ejecución de acciones.
- **Síntesis de Voz Multicanal (TTS):**
  - **Offline:** Kokoro TTS (82M parámetros, tono natural Paul Bettany) y Piper TTS (milisegundos de respuesta).
  - **Online:** Edge-TTS neural de alta definición.
  - **Sistema:** Voces nativas de Windows (SAPI5).
- **Módulos de Automatización:** Visión de pantalla en tiempo real, navegación web, música en YouTube, gestión de correo y utilidades de productividad.

---

## 📁 Estructura del Repositorio

```plaintext
JARVIS/
├── 📂 apps/                       # Aplicación principal de JARVIS
│   └── 📂 ollama_v5/             # Asistente autónomo local con Ollama
│       ├── jarvis_app.py         # Aplicación de escritorio con holograma 3D
│       ├── jarvis_v5.py          # Motor de comandos y herramientas locales
│       ├── jarvis_ui.html        # Stark Mark VII HUD (Three.js 3D)
│       ├── jarvis_telegram_daemon.py # Daemon de control remoto por Telegram
│       ├── tts_manager.py        # Gestor multihilo de síntesis de voz
│       └── 📂 modules/           # Módulos de automatización local
│           ├── browser.py        # Automatización web con browser-use y Playwright
│           ├── desktop.py        # Control de ratón, teclado y ventanas (pywinauto)
│           ├── files.py          # Archivos y selección Explorer (pywinselect)
│           ├── automation_cli.py # CLI despachador de automatización
│           ├── vision.py         # Análisis de pantalla y visión con IA
│           └── musica.py         # Automatización de reproducción multimedia
│
├── 📂 config/                    # Plantillas de configuración y recursos
│   ├── gui_config.json           # Configuración de GUI activa (gui1 / gui2)
│   ├── api_keys.example.json     # Plantilla para configuración de claves
│   ├── credentials.example.json  # Plantilla para credenciales OAuth de Google
│   └── jarvis.ico                # Ícono oficial del sistema
│
├── 📂 demos/                     # Demos de interfaz de escritorio 100% offline
│   ├── 📂 ui_nueva/              # Neural AI Command Center (Cyberpunk/Stark HUD)
│   └── 📂 ui_antigua/            # Stark Mark VII HUD clásico con Three.js
│
├── 🚀 Cambiar_GUI.bat                   # Selector interactivo de interfaz gráfica
├── 🚀 Iniciar_JARVIS_GUI.bat            # Lanza la GUI actualmente activa
├── 🚀 Iniciar_JARVIS_GUI1_Clasica.bat   # Lanza directamente la GUI 1 (Clásica 3D)
├── 🚀 Iniciar_JARVIS_GUI2_Nueva.bat     # Lanza directamente la GUI 2 (Nueva Command Center)
├── 🚀 Iniciar_Demo_JARVIS_UI_Nueva.bat   # Lanza la demo de la nueva UI (Offline)
├── 🚀 Iniciar_Demo_JARVIS_UI_Antigua.bat # Lanza la demo de la UI clásica (Offline)
├── 🚀 Iniciar_JARVIS_Ollama_Consola.bat # Inicia JARVIS v5 en consola de texto
├── 🚀 Iniciar_JARVIS_Telegram.bat       # Inicia el daemon de control por Telegram
├── cambiar_gui.py                       # Script CLI para alternar entre GUIs
├── .env.example                         # Plantilla de variables de entorno
├── .gitignore                           # Blindaje de seguridad y exclusiones
├── CAMBIOS.md                           # Historial público de cambios
├── requirements.txt                     # Dependencias del entorno Python
└── setup.py                             # Instalador automatizado del entorno
```

---

## 🚀 Instalación y Puesta en Marcha

### 1. Prerrequisitos
- **Sistema Operativo:** Windows 10 u 11 (64-bit).
- **Python:** Versión 3.11 o superior.
- **Ollama:** Descarga e instala [Ollama](https://ollama.ai/) y descarga el modelo multimodal:
  ```bash
  ollama pull qwen2.5vl:7b
  ```

### 2. Clonar el Repositorio e Instalar Dependencias
```bash
git clone https://github.com/aleeegk/JARVIS.git
cd JARVIS
python setup.py
```
*O manualmente mediante pip:*
```bash
pip install -r requirements.txt
```

### 3. Configuración de Credenciales
- **Variables de entorno:**
  Copia `.env.example` a `config/.env` o a la raíz `.env` y añade tu token de Telegram si deseas usar el control remoto.
- **Google OAuth (para Gmail):**
  Coloca tu `credentials.json` en `config/credentials.json` (descargado desde Google Cloud Console).

---

## 🎮 Alternancia de GUIs y Modos de Ejecución

JARVIS incluye un **Selector Dinámico de GUI** para alternar con un solo clic o comando entre la interfaz clásica y la nueva:

### Selector Rápido de GUI:
- **Doble clic en `Cambiar_GUI.bat`** o ejecuta:
  ```bash
  python cambiar_gui.py 1   # Activa la GUI 1 (Clásica Stark Mark VII 3D)
  python cambiar_gui.py 2   # Activa la GUI 2 (Neural AI Command Center)
  ```

### Tabla de Accesos Directos:

| Acceso Directo | Modo | Descripción |
| :--- | :--- | :--- |
| **`Cambiar_GUI.bat`** | **Selector de GUI** | Menú interactivo en consola para elegir y activar GUI 1 o GUI 2. |
| **`Iniciar_JARVIS_GUI.bat`** | **GUI Activa** | Inicia automáticamente la interfaz configurada actualmente. |
| **`Iniciar_JARVIS_GUI1_Clasica.bat`** | **GUI 1 Directa** | Abre directamente el HUD holográfico Stark Mark VII 3D. |
| **`Iniciar_JARVIS_GUI2_Nueva.bat`** | **GUI 2 Directa** | Abre directamente el Neural AI Command Center. |
| **`Iniciar_Demo_JARVIS_UI_Nueva.bat`** | **Demo UI Nueva** | Modo demostración de escritorio 100% offline sin Ollama. |
| **`Iniciar_Demo_JARVIS_UI_Antigua.bat`** | **Demo UI Clásica** | Modo demostración clásico 100% offline sin Ollama. |
| **`Iniciar_JARVIS_Telegram.bat`** | **Daemon Telegram** | Control remoto 100% en segundo plano vía bot de Telegram. |

---

## ⚙️ Módulos de Automatización Local para Windows

La suite incluye tres controladores nativos para ejecutar tareas sin APIs externas:

```bash
# 1. Navegador Web (browser-use / Playwright)
python apps/ollama_v5/modules/automation_cli.py browser open "https://github.com"
python apps/ollama_v5/modules/automation_cli.py browser search "automatización windows"

# 2. Control de Escritorio (pyautogui-next / pywinauto)
python apps/ollama_v5/modules/automation_cli.py desktop windows           # Listar ventanas abiertas
python apps/ollama_v5/modules/automation_cli.py desktop focus "Notepad"   # Traer app al frente
python apps/ollama_v5/modules/automation_cli.py desktop hotkey ctrl alt delete

# 3. Gestión de Archivos y Explorador de Windows (pywinselect)
python apps/ollama_v5/modules/automation_cli.py files selected           # Archivos seleccionados en Explorer
python apps/ollama_v5/modules/automation_cli.py files find . --pattern "*.bat"
```

---

## 🔒 Seguridad y Privacidad

- **Zero-Leak Policy:** `.gitignore` estricto que previene el rastreo accidental de secretos (`.env`, tokens de Telegram, credenciales OAuth, certificados SSL y bases de datos locales).
- **Modelos Locales:** Los modelos TTS pesados y checkpoints de IA se conservan en tu máquina local sin ser subidos a repositorios públicos.
- **Autorización Segura:** El bot de Telegram restringe los comandos únicamente al identificador de chat del propietario autorizado (`TELEGRAM_ALLOWED_CHAT_ID`).

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.
