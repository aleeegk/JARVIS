# 📜 Historial de Cambios y Versiones (Changelog Público)

Registro de actualizaciones oficiales y mejoras del proyecto **JARVIS — Asistente Autónomo para Windows**.

---

## [5.3.1] — 2026-09-04

### 🚀 Corrección de Arranque en Windows y Limpieza de Mensajes Ficticios en GUI 2
- **Arranque Directo sin Errores:** Resuelto el fallo de codificación de consola en Windows (`UnicodeEncodeError: 'charmap' / cp1252`) al lanzar `Iniciar_JARVIS_GUI2_Nueva.bat`. Se configuró salida UTF-8 automática y arranque nativo con EdgeChromium en PyWebView.
- **Eliminación de Mensajes y Logs Mock:** Eliminada la conversación ficticia de análisis de logs de Nginx y volcados `.tar.gz` que aparecía por defecto en el chat terminal.
- **Adaptación 100% al Entorno Windows:** Limpieza total de rutas Linux (`/var/log`, `/tmp`, `/etc/shadow`, `/home/alex`), sustituidas por rutas reales de Windows (`C:\...`, `%TEMP%`) y elevación de permisos mediante UAC en vez de `sudo`.
- **Sugerencias Rápidas Reales:** El chat ahora incluye accesos directos funcionales para consultar telemetría, ver archivos seleccionados en Explorer, listar ventanas abiertas y capturar pantalla.

---

## [5.3.0] — 2026-09-04

### 🔗 Integración Real Bidireccional — GUI 2 (Neural AI Command Center) ↔ Windows
- **Puente Nativo Python ↔ React:** `JarvisGUI2Bridge` en `run_desktop.py` conecta el frontend React/TypeScript directamente al sistema operativo Windows en tiempo real mediante `pywebview.js_api`.
- **Telemetría de Hardware en Vivo:** CPU %, RAM %, Disco `C:\` y estado de batería real obtenidos con `psutil`, actualizados cada 2 segundos en el panel de control.
- **Chat y Comandos Reales:** Los comandos escritos en el terminal del HUD ejecutan acciones reales sobre Windows (capturas de pantalla, apertura de navegador, detección de archivos en Explorer, listar ventanas activas) sin necesidad de Ollama ni consumo de GPU.
- **Explorador de Archivos Nativo:** Se pueden navegar carpetas reales del proyecto, Descargas y Documentos de Windows directamente desde la GUI.
- **Detección pywinselect:** Botón en el explorador que captura en tiempo real los archivos seleccionados en el Explorador de Windows y permite procesarlos con JARVIS.
- **Ventanas y Aplicaciones Activas:** Panel de aplicaciones abiertas en Windows (vía `pywinauto` + fallback `psutil`) con acción "Traer al frente" para enfocar cualquier ventana desde la GUI.
- **Memoria Persistente Real:** La sección Memory Bank carga datos reales desde `jarvis_memoria.json` (perfil del usuario, recuerdos e historial de tareas).
- **Configuración de Telegram Real:** Lectura segura del token (parcialmente enmascarado) y chat ID desde los archivos de configuración locales.

---

## [5.2.0] — 2026-09-04

### 🎛️ Selector Dinámico de Interfaz Gráfica (GUI Switcher)
- **Alternancia Rápida de GUIs:** Creado `cambiar_gui.py` y `Cambiar_GUI.bat` para alternar entre la GUI 1 (Clásica Stark Mark VII 3D) y la GUI 2 (Neural AI Command Center) con un solo número o comando (`python cambiar_gui.py 1|2`).
- **Lanzador Unificado:** `Iniciar_JARVIS_GUI.bat` arranca automáticamente la interfaz actualmente activa persistida en `config/gui_config.json`.
- **Lanzadores Directos:** `Iniciar_JARVIS_GUI1_Clasica.bat` e `Iniciar_JARVIS_GUI2_Nueva.bat`.

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
- **Plantillas Públicas:** Creación de plantillas limpias y listas para usar:
  - `config/api_keys.example.json`
  - `config/credentials.example.json`

### 💻 Demos de Interfaz de Escritorio Offline
- **Demo UI Nueva (`Iniciar_Demo_JARVIS_UI_Nueva.bat`):** Interfaz *Neural AI Command Center* (Cyberpunk/Stark HUD) basada en React + TypeScript + Tailwind, empaquetada como app de escritorio nativa mediante `pywebview` 100% offline y desacoplada de Ollama.
- **Demo UI Clásica (`Iniciar_Demo_JARVIS_UI_Antigua.bat`):** Interfaz holográfica Stark Mark VII HUD 3D en Three.js con Three.js embebido localmente para uso offline, telemetría ligera de hardware y respuestas simuladas explicativas sin consumo de GPU ni LLM.

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
