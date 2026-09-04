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
│   ├── api_keys.example.json     # Plantilla para configuración de claves
│   ├── credentials.example.json  # Plantilla para credenciales OAuth de Google
│   └── jarvis.ico                # Ícono oficial del sistema
│
├── 🚀 Iniciar_JARVIS_Ollama_GUI.bat     # Inicia la interfaz gráfica oficial (Stark Mark VII HUD)
├── 🚀 Iniciar_JARVIS_Ollama_Consola.bat # Inicia JARVIS v5 en consola de texto
├── 🚀 Iniciar_JARVIS_Telegram.bat       # Inicia el daemon de control por Telegram
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

## 🎮 Modos de Ejecución

JARVIS ofrece acceso directo a sus modos operativos mediante scripts de inicio rápido:

| Acceso Directo | Modo | Descripción |
| :--- | :--- | :--- |
| **`Iniciar_JARVIS_Ollama_GUI.bat`** | **App de Escritorio Oficial** | Inicia el HUD holográfico 3D (Stark Mark VII) conectado a Ollama y telemetría. |
| **`Iniciar_JARVIS_Ollama_Consola.bat`** | **Consola Interactiva** | Interacción multimodal por terminal con voz y automatización local. |
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
