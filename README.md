# 🤖 JARVIS — Suite de Asistentes Inteligentes para Windows

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://www.microsoft.com/windows)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20AI-white?style=for-the-badge&logo=ollama&logoColor=black)](https://ollama.ai/)
[![Gemini](https://img.shields.io/badge/Google-Gemini%20Live-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**JARVIS** es un sistema modular de asistencia y automatización para Windows que combina inteligencia artificial local y en la nube. Integra visión computacional, síntesis de voz multicanal, control total del sistema operativo y una interfaz holográfica 3D inspirada en Stark Industries.

---

## ⚡ Arquitecturas Disponibles

El proyecto cuenta con dos motores independientes según las necesidades de privacidad, potencia y conectividad:

### 1. 🌐 JARVIS v5 — Motor Autónomo Local & Holográfico (Ollama)
Diseñado para funcionar **100% offline**, garantizando máxima privacidad y control directo sobre el equipo:
- **Modelo de IA:** `qwen2.5vl:7b` (Visión por computadora, razonamiento espacial, lectura de pantalla y ejecución de código).
- **Interfaz Gráfica:** **Stark Mark VII HUD** (`jarvis_ui.html` + `jarvis_app.py` con PyWebView) con esfera holográfica 3D interactiva en Three.js, partículas reactivas y telemetría de hardware (CPU, RAM, disco).
- **Control Remoto vía Telegram:** Daemon autónomo (`jarvis_telegram_daemon.py` / `telegram_control.py`) para interactuar con tu PC de forma remota (envío y recepción de archivos, capturas de pantalla, análisis visual con Qwen2.5-VL y ejecución de tareas).
- **Síntesis de Voz Multicanal (TTS):**
  - **Offline:** Kokoro TTS (82M parámetros, alta fidelidad natural) y Piper TTS (milisegundos de latencia).
  - **Online:** Edge-TTS neural de alta definición.
  - **Sistema:** Voces nativas de Windows (SAPI5).
- **Módulos de Automatización:** Visión de pantalla en tiempo real, control de navegadores, reproducción musical, correo, mensajería y productividad.

### 2. ⚡ JARVIS Gemini Live — Motor en Tiempo Real (Google Cloud)
Asistente multimodal interactivo diseñado para conversaciones bidireccionales fluidas por voz y control extendido:
- **Modelo de IA:** Google Gemini Live API (`gemini-2.5-flash-native-audio-preview` vía WebSockets).
- **Interfaz:** HUD dinámico con PyQt y panel de control web dashboard con métricas en tiempo real.
- **Acciones y Herramientas (+20 controladores):**
  - Control del ordenador, ventanas y configuración del sistema.
  - Búsqueda web en vivo, resumen de videos de YouTube y reportes climáticos.
  - Asistente de programación y agente desarrollador autónomo (`dev_agent.py`).
  - Monitorización proactiva de tareas y recordatorios.

---

## 📁 Estructura del Repositorio

```plaintext
JARVIS/
├── 📂 apps/                       # Motores ejecutables del asistente
│   ├── 📂 gemini_live/           # Asistente en tiempo real con Google Gemini
│   │   ├── main.py               # Entrada principal (Voz + Live API)
│   │   ├── ui.py                 # HUD en PyQt
│   │   ├── actions/              # Controladores de automatización y SO
│   │   ├── core/                 # Clientes LLM, STT, TTS y prompts
│   │   ├── dashboard/            # Servidor web local y dashboard de control
│   │   └── memory/               # Gestión de memoria y configuración dinámica
│   │
│   └── 📂 ollama_v5/             # Asistente autónomo local con Ollama
│       ├── jarvis_app.py         # Aplicación de escritorio con holograma 3D
│       ├── jarvis_v5.py          # Motor de comandos y herramientas locales
│       ├── jarvis_ui.html        # Stark Mark VII HUD (Three.js 3D)
│       ├── jarvis_telegram_daemon.py # Daemon de control remoto por Telegram
│       ├── tts_manager.py        # Gestor multihilo de síntesis de voz
│       └── modules/              # Módulos de visión, música, navegación, email...
│
├── 📂 config/                    # Plantillas de configuración y recursos compartidos
│   ├── api_keys.example.json     # Plantilla para claves de API
│   ├── credentials.example.json  # Plantilla para credenciales OAuth de Google
│   └── jarvis.ico                # Ícono oficial del sistema
│
├── 📂 tests_and_demos/           # Scripts de prueba y prototipos
│   ├── ejemplo_youtube_vision.py # Demo de visión multimodal en YouTube
│   └── holograma-esfera-ia.html  # Prototipo independiente de la esfera 3D
│
├── 🚀 Iniciar_JARVIS_Ollama_GUI.bat     # Inicia la interfaz 3D Holográfica (Ollama)
├── 🚀 Iniciar_JARVIS_Ollama_Consola.bat # Inicia JARVIS v5 en terminal puro
├── 🚀 Iniciar_JARVIS_Gemini.bat         # Inicia JARVIS Gemini Live en tiempo real
├── 🚀 Iniciar_JARVIS_Telegram.bat       # Inicia el daemon de control por Telegram
├── .env.example                         # Plantilla de variables de entorno
├── .gitignore                           # Blindaje de seguridad y exclusiones
├── requirements.txt                     # Dependencias oficiales del entorno Python
└── setup.py                             # Instalador automatizado del entorno
```

---

## 🚀 Instalación y Puesta en Marcha

### 1. Prerrequisitos
- **Sistema Operativo:** Windows 10 u 11 (64-bit).
- **Python:** Versión 3.11 o superior.
- **Ollama (para JARVIS v5 Local):** Descarga e instala [Ollama](https://ollama.ai/) y descarga el modelo multimodal:
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
playwright install
```

### 3. Configurar Claves y Entorno
Copia las plantillas de ejemplo y añade tus credenciales correspondientes:
- **Variables de entorno:**
  Copia `.env.example` a `config/.env` o a la raíz `.env` y rellena las claves que desees usar (Telegram, Spotify, Google, etc.).
- **Claves API de Gemini (si usas Gemini Live):**
  Copia `config/api_keys.example.json` a `config/api_keys.json` y coloca tu `gemini_api_key`.
- **Google OAuth (si usas Gmail/Calendar):**
  Coloca tu `credentials.json` en `config/credentials.json` (descargado desde Google Cloud Console).

---

## 🎮 Modos de Ejecución

Puedes iniciar cualquier modo de JARVIS haciendo doble clic en sus lanzadores directos:

| Acceso Directo | Modo de Operación | Descripción |
| :--- | :--- | :--- |
| **`Iniciar_JARVIS_Ollama_GUI.bat`** | **GUI Holográfica 3D** | Interfaz Stark Mark VII HUD con Three.js, voz offline y visión Qwen2.5-VL. |
| **`Iniciar_JARVIS_Ollama_Consola.bat`** | **Consola Local** | Ejecución ligera por terminal para comandos directos con Ollama. |
| **`Iniciar_JARVIS_Telegram.bat`** | **Daemon Telegram** | Control remoto 100% en segundo plano vía bot de Telegram. |
| **`Iniciar_JARVIS_Gemini.bat`** | **Gemini Live** | Asistente conversacional por voz en tiempo real con la nube de Google. |

---

## 🔒 Seguridad y Privacidad

- **Zero-Leak Policy:** El proyecto implementa un `.gitignore` estricto que previene el rastreo accidental de secretos (`.env`, tokens de Telegram, credenciales OAuth, claves privadas SSL y bases de datos locales).
- **Modelos Locales:** Los modelos TTS pesados y checkpoints de IA se descargan y conservan en tu máquina local sin ser subidos a repositorios públicos.
- **Autorización de Dispositivos:** El bot de Telegram restringe los comandos únicamente al identificador de chat del propietario autorizado (`TELEGRAM_ALLOWED_CHAT_ID`).

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.
