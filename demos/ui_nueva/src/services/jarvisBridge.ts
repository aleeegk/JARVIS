/**
 * Servicio de conexión con el puente Python de JARVIS vía PyWebView.
 * Expone métodos asíncronos tipados para interactuar directamente con el sistema operativo.
 */

declare global {
  interface Window {
    pywebview?: {
      api: {
        get_telemetry: () => Promise<any>;
        send_message: (text: string) => Promise<{
          respuesta: string;
          accion: string;
          exito: boolean;
          timestamp: string;
          modo?: string;
        }>;
        get_memory: () => Promise<any[]>;
        get_real_files: (folderType?: string) => Promise<any[]>;
        get_explorer_selected: () => Promise<string[]>;
        get_open_windows: () => Promise<any[]>;
        focus_window: (title: string) => Promise<any>;
        get_telegram_config: () => Promise<any>;
        execute_command: (module: string, action: string, params?: any) => Promise<any>;
      };
    };
  }
}

export const isBridgeAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!window.pywebview?.api;
};

export const jarvisBridge = {
  /** Obtiene telemetría de hardware en tiempo real (CPU, RAM, Disco, etc.) */
  async getTelemetry() {
    if (window.pywebview?.api?.get_telemetry) {
      try {
        return await window.pywebview.api.get_telemetry();
      } catch (err) {
        console.error('[Bridge] Error en getTelemetry:', err);
      }
    }
    return null;
  },

  /** Envía un comando u orden de texto al núcleo de JARVIS / Ollama */
  async sendMessage(text: string) {
    if (window.pywebview?.api?.send_message) {
      try {
        return await window.pywebview.api.send_message(text);
      } catch (err) {
        console.error('[Bridge] Error en sendMessage:', err);
      }
    }
    return null;
  },

  /** Obtiene los recuerdos y tareas persistentes reales de jarvis_memoria.json */
  async getMemory() {
    if (window.pywebview?.api?.get_memory) {
      try {
        return await window.pywebview.api.get_memory();
      } catch (err) {
        console.error('[Bridge] Error en getMemory:', err);
      }
    }
    return null;
  },

  /** Lista archivos reales de la carpeta especificada */
  async getRealFiles(folderType: string = 'project') {
    if (window.pywebview?.api?.get_real_files) {
      try {
        return await window.pywebview.api.get_real_files(folderType);
      } catch (err) {
        console.error('[Bridge] Error en getRealFiles:', err);
      }
    }
    return null;
  },

  /** Obtiene en tiempo real los archivos seleccionados en Windows Explorer con pywinselect */
  async getExplorerSelected(): Promise<string[]> {
    if (window.pywebview?.api?.get_explorer_selected) {
      try {
        return await window.pywebview.api.get_explorer_selected();
      } catch (err) {
        console.error('[Bridge] Error en getExplorerSelected:', err);
      }
    }
    return [];
  },

  /** Lista las ventanas y aplicaciones reales abiertas en Windows */
  async getOpenWindows() {
    if (window.pywebview?.api?.get_open_windows) {
      try {
        return await window.pywebview.api.get_open_windows();
      } catch (err) {
        console.error('[Bridge] Error en getOpenWindows:', err);
      }
    }
    return null;
  },

  /** Trae una ventana al frente por su título */
  async focusWindow(title: string) {
    if (window.pywebview?.api?.focus_window) {
      try {
        return await window.pywebview.api.focus_window(title);
      } catch (err) {
        console.error('[Bridge] Error en focusWindow:', err);
      }
    }
    return null;
  },

  /** Obtiene la configuración real de Telegram desde .env y settings */
  async getTelegramConfig() {
    if (window.pywebview?.api?.get_telegram_config) {
      try {
        return await window.pywebview.api.get_telegram_config();
      } catch (err) {
        console.error('[Bridge] Error en getTelegramConfig:', err);
      }
    }
    return null;
  },

  /** Ejecuta una acción de los módulos de automatización (browser, desktop, files) */
  async executeCommand(module: string, action: string, params?: any) {
    if (window.pywebview?.api?.execute_command) {
      try {
        return await window.pywebview.api.execute_command(module, action, params);
      } catch (err) {
        console.error('[Bridge] Error en executeCommand:', err);
      }
    }
    return null;
  },
};
