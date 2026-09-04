# 📜 Historial de Cambios y Versiones (Changelog Público)

Registro de actualizaciones oficiales y mejoras del proyecto **JARVIS — Asistente Autónomo para Windows**.

---

## [5.3.0] — 2026-09-04

### 💬 Corrección de Reconocimiento de Saludos y Diálogos en JARVIS v5
- **Mapeo Automático de Saludos:** Se añadieron remapeos inteligentes en el motor de IA para las acciones generadas espontáneamente por Ollama (`saludar`, `saludo`, `hola`, `charlar`, `hablar`, etc.) hacia la acción permitida `conversar`.
- **Eliminación del Bloqueo "Acción no permitida":** Evita que saludos cordiales como *"hola jarvis"* sean bloqueados por el filtro estricto de seguridad de acciones del sistema operativo.
- **Fallback Conversacional Inteligente:** Si el modelo genera un mensaje de cortesía junto con una acción no reconocida o nula, JARVIS responde de forma natural y fluida en lugar de emitir un aviso de fallo de acción.

---

## [5.2.0] — 2026-09-04

### ⚙️ Nuevos Módulos de Automatización Local para Windows
- **`modules/browser.py`:** Navegación web y scraping local mediante `browser-use` y `playwright` (abrir URL, búsqueda, extracción de texto y capturas de pantalla completa).
- **`modules/desktop.py`:** Control total de ratón, teclado, atajos físicos y ventanas nativas de Windows con `pyautogui-next` y `pywinauto` (listar ventanas, enfocar por título, minimizar, cerrar y resolución).
- **`modules/files.py`:** Detección en tiempo real de archivos seleccionados en el Explorador de Windows mediante `pywinselect`, búsqueda recursiva por patrón glob, apertura nativa y gestión segura con papelera de reciclaje (`send2trash`).
- **`modules/automation_cli.py`:** CLI unificado para despachar comandos de browser, desktop y files desde el terminal.

---

## [5.1.0] — 2026-09-04

### 🛡️ Seguridad y Blindaje del Repositorio
- **Blindaje en `.gitignore`:** Configurado el filtrado estricto para evitar la subida de secretos (`.env`, tokens de Telegram, claves de API, certificados SSL y credenciales OAuth).
- **Gestión de Modelos Locales Pesados:** Exclusión de modelos de IA locales (`*.onnx`, `*.bin`, `*.gguf`) para cumplir con los estándares de tamaño de GitHub y mantener la privacidad del usuario.
- **Privacidad de Instrucciones Internas:** Exclusión de guías de trabajo y notas internas de agentes en `docs/`.
- **Exclusión de Demos Experimentales:** Desindexación de carpetas de demos locales y prototipos experimentales para mantener el repositorio enfocado exclusivamente en la versión de producción de JARVIS.
- **Plantillas Públicas:** Creación de plantillas limpias y listas para usar:
  - `config/api_keys.example.json`
  - `config/credentials.example.json`

### 🧹 Refactorización de Arquitectura
- **Limpieza del Sistema:** Eliminación definitiva de módulos y dependencias de Gemini Live para enfocar el proyecto 100% en la suite autónoma local de **JARVIS v5**.
- **Documentación:** Renovación completa del `README.md` con enfoque en el asistente local, HUD 3D holográfico, demos de escritorio y control autónomo vía Telegram.

---

## [5.0.0] — 2026-08-31

### 🚀 JARVIS v5 — Motor Autónomo Local & Stark Mark VII HUD
- **HUD 3D Holográfico:** Interfaz de escritorio interactiva con esfera 3D construida en Three.js con partículas y telemetría de sistema (CPU, RAM, Disco) en tiempo real mediante `pywebview`.
- **IA Local Multimodal:** Integración con Ollama y el modelo `qwen2.5vl:7b` para visión por computadora, análisis de capturas de pantalla, código y razonamiento local.
- **Control Remoto vía Telegram:** Daemon de control remoto en segundo plano para recepción/envío de archivos, inspección de pantalla, análisis visual con IA y control del PC desde cualquier lugar.
- **Síntesis de Voz Multicanal (TTS):** Soporte de voces 100% offline (Kokoro AI y Piper TTS), voces online (Edge-TTS) y voces nativas de Windows (SAPI5).
- **Módulos de Automatización:** Módulos especializados para navegación web dinámica, reproducción de música en YouTube, gestión de correo, notas y alarmas.

---

## [4.0.0] — Versiones Anteriores

- Creación de los primeros prototipos de control de escritorio para Windows y automatización por voz.
- Integración de scripts de arranque directo (`.bat`) para ejecución con un solo clic.
