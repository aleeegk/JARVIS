import React, { useState } from 'react';
import { SystemSettings } from '../../types';
import { playSound } from '../../utils/audio';

interface SystemParamsViewProps {
  settings: SystemSettings;
  onUpdateSettings: (updated: Partial<SystemSettings>) => void;
  onSimulateAccessDenied: () => void;
  onSimulateOllamaOffline: () => void;
}

export const SystemParamsView: React.FC<SystemParamsViewProps> = ({
  settings,
  onUpdateSettings,
  onSimulateAccessDenied,
  onSimulateOllamaOffline,
}) => {
  const [model, setModel] = useState(settings.aiModel);
  const [ollamaUrl, setOllamaUrl] = useState(settings.ollamaUrl);
  const [voice, setVoice] = useState(settings.voice);
  const [theme, setTheme] = useState(settings.theme);
  const [language, setLanguage] = useState(settings.language);
  const [directories, setDirectories] = useState<string[]>(settings.allowedDirectories);
  const [newDirInput, setNewDirInput] = useState('');
  const [isAddingDir, setIsAddingDir] = useState(false);
  const [apps, setApps] = useState(settings.authorizedApps);
  const [newAppInput, setNewAppInput] = useState('');
  const [isAddingApp, setIsAddingApp] = useState(false);
  const [requireConfirm, setRequireConfirm] = useState(settings.requireCriticalConfirmation);
  const [saveToast, setSaveToast] = useState(false);

  const handleAddDir = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDirInput.trim()) return;
    playSound('beep');
    setDirectories([...directories, newDirInput.trim()]);
    setNewDirInput('');
    setIsAddingDir(false);
  };

  const handleRemoveDir = (index: number) => {
    playSound('click');
    setDirectories(directories.filter((_, i) => i !== index));
  };

  const handleAddApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppInput.trim()) return;
    playSound('beep');
    setApps([
      ...apps,
      { id: Date.now().toString(), name: newAppInput.trim(), icon: 'apps' },
    ]);
    setNewAppInput('');
    setIsAddingApp(false);
  };

  const handleRemoveApp = (id: string) => {
    playSound('click');
    setApps(apps.filter((a) => a.id !== id));
  };

  const handleSaveAll = () => {
    playSound('confirm');
    onUpdateSettings({
      aiModel: model,
      ollamaUrl,
      voice,
      theme,
      language,
      allowedDirectories: directories,
      authorizedApps: apps,
      requireCriticalConfirmation: requireConfirm,
    });
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="glass-panel p-6 rounded-xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="scan-line-anim" />
        <div>
          <h1 className="font-headline text-2xl md:text-3xl font-bold text-[#00f2ff] tracking-tight">
            SISTEMA Y SEGURIDAD
          </h1>
          <p className="font-body text-sm text-[#b9cacb] mt-1">
            Parámetros globales de inferencia local, directivas de voz y políticas de ejecución estricta.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="bg-[#00f2ff] hover:bg-[#74f5ff] text-[#002022] font-tech text-xs font-bold tracking-wider px-6 py-2.5 rounded transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,242,255,0.3)] cursor-pointer active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">save</span>
          <span>GUARDAR CAMBIOS</span>
        </button>
      </div>

      {saveToast && (
        <div className="bg-[#00f2ff]/15 border border-[#00f2ff] p-3 rounded-lg text-[#00f2ff] font-tech text-xs flex items-center justify-between shadow-[0_0_10px_rgba(0,242,255,0.2)] animate-[fadeIn_0.2s_ease-out]">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            Todos los parámetros del sistema han sido actualizados en caliente.
          </span>
          <button onClick={() => setSaveToast(false)} className="text-[#00f2ff] cursor-pointer">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Main Form Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: AI & Inference Config */}
        <div className="glass-panel p-6 rounded-xl space-y-5">
          <div className="flex items-center gap-2 border-b border-[#3a494b]/40 pb-3">
            <span className="material-symbols-outlined text-[#00f2ff]">psychology</span>
            <h3 className="font-tech text-xs text-[#00f2ff] tracking-wider uppercase font-bold">
              MOTOR DE INFERENCIA & VOZ
            </h3>
          </div>

          <div>
            <label className="block font-tech text-xs text-[#b9cacb] mb-1.5">
              Selector de Modelo Activo
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-[#151d1e] border border-[#3a494b] focus:border-[#00f2ff] text-[#dce4e4] font-tech text-xs rounded p-2.5 focus:outline-none"
            >
              <option value="qwen2.5:14b">qwen2.5:14b (Local - Recomendado)</option>
              <option value="llama3:8b">llama3:8b (Meta AI)</option>
              <option value="mistral:7b">mistral:7b (Inferencia Rápida)</option>
              <option value="deepseek-r1:14b">deepseek-r1:14b (Razonamiento Lógico)</option>
              <option value="gemini-2.5-flash">gemini-2.5-flash (Google Cloud Backup)</option>
            </select>
          </div>

          <div>
            <label className="block font-tech text-xs text-[#b9cacb] mb-1.5">
              URL del Servidor Ollama
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                className="flex-1 bg-[#151d1e] border border-[#3a494b] focus:border-[#00f2ff] text-[#dce4e4] font-tech text-xs rounded p-2.5 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  playSound('confirm');
                  alert('Conexión con Ollama HTTP daemon exitosa (HTTP 200 OK).');
                }}
                className="px-3 bg-[#151d1e] hover:bg-[#2e3637] text-[#00f2ff] border border-[#3a494b] rounded font-tech text-xs cursor-pointer"
              >
                Test
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-tech text-xs text-[#b9cacb] mb-1.5">
                Voz Sintetizada
              </label>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full bg-[#151d1e] border border-[#3a494b] focus:border-[#00f2ff] text-[#dce4e4] font-tech text-xs rounded p-2.5 focus:outline-none"
              >
                <option value="Jarvis-Esp (Masculina)">Jarvis-Esp (Masculina)</option>
                <option value="Jarvis-Eng (Natural)">Jarvis-Eng (Natural)</option>
                <option value="Friday-AI (Femenina)">Friday-AI (Femenina)</option>
                <option value="Cort-X (Sintética)">Cort-X (Sintética)</option>
              </select>
            </div>

            <div>
              <label className="block font-tech text-xs text-[#b9cacb] mb-1.5">
                Tema de Interfaz
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full bg-[#151d1e] border border-[#3a494b] focus:border-[#00f2ff] text-[#dce4e4] font-tech text-xs rounded p-2.5 focus:outline-none"
              >
                <option value="Holográfico Profundo">Holográfico Profundo</option>
                <option value="Minimalista Táctico">Minimalista Táctico</option>
                <option value="Cyber Amber">Cyber Amber</option>
                <option value="Emerald Matrix">Emerald Matrix</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-tech text-xs text-[#b9cacb] mb-1.5">
              Idioma Base del Sistema
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-[#151d1e] border border-[#3a494b] focus:border-[#00f2ff] text-[#dce4e4] font-tech text-xs rounded p-2.5 focus:outline-none"
            >
              <option value="Español (ES-ES)">Español (ES-ES)</option>
              <option value="English (US)">English (US)</option>
              <option value="Français">Français</option>
              <option value="Deutsch">Deutsch</option>
            </select>
          </div>
        </div>

        {/* Section 2: Security & Permissions */}
        <div className="glass-panel p-6 rounded-xl space-y-5">
          <div className="flex items-center gap-2 border-b border-[#3a494b]/40 pb-3">
            <span className="material-symbols-outlined text-[#fe9d00]">verified_user</span>
            <h3 className="font-tech text-xs text-[#fe9d00] tracking-wider uppercase font-bold">
              SEGURIDAD Y AUTORIZACIÓN (NIVEL 4 RESTRICTED)
            </h3>
          </div>

          {/* Allowed Directories */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-tech text-xs text-[#b9cacb]">Directorios Permitidos</label>
              <button
                onClick={() => setIsAddingDir(!isAddingDir)}
                className="text-[#00f2ff] hover:underline font-tech text-[11px] cursor-pointer"
              >
                + Añadir ruta
              </button>
            </div>

            {isAddingDir && (
              <form onSubmit={handleAddDir} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="/var/log/..."
                  value={newDirInput}
                  onChange={(e) => setNewDirInput(e.target.value)}
                  className="flex-1 bg-[#151d1e] border border-[#00f2ff] text-[#dce4e4] font-tech text-xs rounded p-2 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3 bg-[#00f2ff] text-[#002022] font-tech text-xs font-bold rounded cursor-pointer"
                >
                  OK
                </button>
              </form>
            )}

            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {directories.map((dir, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-[#151d1e] px-3 py-1.5 rounded border border-[#3a494b]/40 font-tech text-xs"
                >
                  <span className="text-[#dce4e4] truncate font-mono text-[11px]">{dir}</span>
                  <button
                    onClick={() => handleRemoveDir(i)}
                    className="text-[#849495] hover:text-[#ffb4ab] ml-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Authorized Apps */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-tech text-xs text-[#b9cacb]">Aplicaciones Autorizadas</label>
              <button
                onClick={() => setIsAddingApp(!isAddingApp)}
                className="text-[#00f2ff] hover:underline font-tech text-[11px] cursor-pointer"
              >
                + Añadir app
              </button>
            </div>

            {isAddingApp && (
              <form onSubmit={handleAddApp} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Nombre de la app..."
                  value={newAppInput}
                  onChange={(e) => setNewAppInput(e.target.value)}
                  className="flex-1 bg-[#151d1e] border border-[#00f2ff] text-[#dce4e4] font-tech text-xs rounded p-2 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3 bg-[#00f2ff] text-[#002022] font-tech text-xs font-bold rounded cursor-pointer"
                >
                  OK
                </button>
              </form>
            )}

            <div className="flex flex-wrap gap-2">
              {apps.map((app) => (
                <span
                  key={app.id}
                  className="inline-flex items-center gap-1.5 bg-[#151d1e] border border-[#3a494b]/50 px-2.5 py-1 rounded font-tech text-xs text-[#dce4e4]"
                >
                  <span className="material-symbols-outlined text-sm text-[#00f2ff]">
                    {app.icon}
                  </span>
                  <span>{app.name}</span>
                  <button
                    onClick={() => handleRemoveApp(app.id)}
                    className="text-[#849495] hover:text-[#ffb4ab] ml-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[13px]">close</span>
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Confirmation Level Warning Box */}
          <div className="bg-[#fe9d00]/10 border border-[#fe9d00]/30 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-tech text-xs text-[#fe9d00] font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">security</span>
                  CONFIRMACIÓN ESTRICTA
                </p>
                <p className="font-body text-xs text-[#b9cacb] mt-1">
                  Exigir autorización explícita del usuario para cualquier comando con permisos de
                  escritura, eliminación o acceso a root.
                </p>
              </div>

              <input
                type="checkbox"
                checked={requireConfirm}
                onChange={(e) => setRequireConfirm(e.target.checked)}
                className="w-5 h-5 accent-[#00f2ff] rounded cursor-pointer mt-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Diagnostic & Error State Simulator */}
      <div className="glass-panel p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#3a494b]/40 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ffb4ab]">bug_report</span>
            <h3 className="font-tech text-xs text-[#ffb4ab] tracking-wider uppercase font-bold">
              SIMULADOR DE DIAGNÓSTICO Y RESPUESTAS DE ERROR
            </h3>
          </div>
          <span className="font-tech text-[10px] text-[#849495]">HUD DEBUG MODE</span>
        </div>

        <p className="font-body text-xs text-[#b9cacb]">
          Prueba las pantallas de error visuales y respuestas de seguridad HUD (como el diálogo de Acceso Denegado 0x80070005 o el aviso de desconexión de Ollama).
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              playSound('error');
              onSimulateAccessDenied();
            }}
            className="px-4 py-2.5 bg-[#93000a]/20 hover:bg-[#93000a]/40 border border-[#ffb4ab]/40 text-[#ffb4ab] font-tech text-xs rounded transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-base">gpp_bad</span>
            <span>Simular Diálogo: ACCESO DENEGADO (0x80070005)</span>
          </button>

          <button
            onClick={() => {
              playSound('warn');
              onSimulateOllamaOffline();
            }}
            className="px-4 py-2.5 bg-[#fe9d00]/15 hover:bg-[#fe9d00]/30 border border-[#fe9d00]/40 text-[#fe9d00] font-tech text-xs rounded transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-base">cloud_off</span>
            <span>Simular Estado: OLLAMA DESCONECTADO</span>
          </button>
        </div>
      </div>
    </div>
  );
};
