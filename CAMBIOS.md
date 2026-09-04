# 📜 Historial de Cambios y Versiones (Changelog Público)

Registro de actualizaciones oficiales y mejoras del proyecto **JARVIS — Asistente Autónomo para Windows**.

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
