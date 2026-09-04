import React, { useState } from 'react';
import { TelemetryData, SystemLogEntry, AppView } from '../../types';
import { playSound } from '../../utils/audio';

interface ControlCenterViewProps {
  telemetry: TelemetryData;
  systemLogs: SystemLogEntry[];
  activeModel: string;
  onExecuteCommand: (command: string) => void;
  onTriggerAction: (actionName: string, icon: string) => void;
  onNavigate: (view: AppView) => void;
  onRebootCore: () => void;
  onAddLog: (level: 'INFO' | 'WARN' | 'CRIT' | 'SYS', message: string) => void;
}

export const ControlCenterView: React.FC<ControlCenterViewProps> = ({
  telemetry,
  systemLogs,
  activeModel,
  onExecuteCommand,
  onTriggerAction,
  onNavigate,
  onRebootCore,
  onAddLog,
}) => {
  const [commandInput, setCommandInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [logFilter, setLogFilter] = useState<'ALL' | 'CRIT' | 'WARN' | 'INFO'>('ALL');

  const actionCards = [
    {
      id: 'screen',
      title: 'Analizar pantalla',
      icon: 'visibility',
      desc: 'Escaneo visual OCR y elementos interactivos',
      action: 'Analizando pantalla actual en tiempo real...',
    },
    {
      id: 'browser',
      title: 'Abrir navegador',
      icon: 'language',
      desc: 'Instancia segura de navegación aislada',
      action: 'Iniciando navegador Chromium en sandbox...',
    },
    {
      id: 'search',
      title: 'Buscar en Internet',
      icon: 'search',
      desc: 'Consulta web con grounding en tiempo real',
      action: 'Ejecutando búsqueda inteligente indexada...',
    },
    {
      id: 'youtube',
      title: 'Música y YouTube',
      icon: 'play_circle',
      desc: 'Reproducción y streaming multimedia',
      action: 'Cargando lista de reproducción ambiental...',
    },
    {
      id: 'system_state',
      title: 'Estado del sistema',
      icon: 'memory',
      desc: 'Chequeo de rendimiento de núcleos y VRAM',
      action: 'Consultando telemetría de hardware local...',
    },
    {
      id: 'cleanup',
      title: 'Limpieza de temporales',
      icon: 'mop',
      desc: 'Eliminación de caches y volcados .tar.gz',
      action: 'Purgando archivos residuales en /tmp...',
    },
    {
      id: 'backup',
      title: 'Copia de seguridad',
      icon: 'cloud_sync',
      desc: 'Snapshot incremental a almacenamiento seguro',
      action: 'Generando snapshot de memoria y datos...',
    },
    {
      id: 'network',
      title: 'Escaneo de red',
      icon: 'wifi_tethering',
      desc: 'Inspección de puertos y tráfico LAN activo',
      action: 'Auditando conexiones y sockets abiertos...',
    },
    {
      id: 'tactical',
      title: 'Modo Táctico',
      icon: 'security',
      desc: 'Aislamiento de puertos y bloqueo estricto',
      action: 'Activando protocolos de contención Nivel 4...',
    },
    {
      id: 'neural_synth',
      title: 'Sintetizador Neural',
      icon: 'tune',
      desc: 'Generación de audio de modulación binaural',
      action: 'Calibrando frecuencias de resonancia neural...',
    },
    {
      id: 'telegram_sync',
      title: 'Sincronizar Telegram',
      icon: 'send',
      desc: 'Verificación de webhook y cola de mensajes',
      action: 'Verificando túnel de comunicación Telegram...',
    },
    {
      id: 'daily_report',
      title: 'Generar reporte',
      icon: 'assessment',
      desc: 'Resumen ejecutivo de actividades y errores',
      action: 'Compilando registro de eventos en Markdown...',
    },
  ];

  const handleExecute = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commandInput.trim()) return;
    playSound('confirm');
    onExecuteCommand(commandInput.trim());
    setCommandInput('');
  };

  const handleVoiceToggle = () => {
    playSound('beep');
    if (!isListening) {
      setIsListening(true);
      onAddLog('SYS', 'Comando de voz reconocido: "Estado del sistema".');
      setCommandInput('Analizar los logs del servidor y verificar puertos abiertos');
      setTimeout(() => {
        setIsListening(false);
      }, 2500);
    } else {
      setIsListening(false);
    }
  };

  const filteredLogs = systemLogs.filter((log) => {
    if (logFilter === 'ALL') return true;
    return log.level === logFilter;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Greeting */}
      <section className="glass-panel p-6 rounded-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="scan-line-anim" />
        <div>
          <h1 className="font-headline text-2xl md:text-3xl font-bold text-[#00f2ff] tracking-tight">
            Buenos días, Alejandro.
          </h1>
          <p className="font-body text-sm text-[#b9cacb] mt-1">
            JARVIS está listo para recibir una orden en modo operacional.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#00f2ff]/15 text-[#00f2ff] border border-[#00f2ff]/40 px-3 py-1 rounded font-tech text-xs tracking-wider flex items-center gap-2 shadow-[0_0_10px_rgba(0,242,255,0.2)]">
            <span className="w-2 h-2 rounded-full bg-[#00f2ff] animate-pulse" />
            <span>OPERACIONAL // CONECTADO</span>
          </div>
        </div>
      </section>

      {/* Main Grid: Status, Command Console, & Action Tiles */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left / Center Section (8 cols) */}
        <div className="xl:col-span-8 space-y-6">
          {/* JARVIS Online Status Card */}
          <div className="glass-panel rounded-xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Rotating Cyber Ring */}
              <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                <div className="absolute inset-0 border-2 border-[#00f2ff] rounded-full animate-[spin_4s_linear_infinite] border-t-transparent border-r-transparent" />
                <div className="absolute inset-2 border border-[#00f2ff]/60 rounded-full animate-[spin_3s_linear_infinite_reverse] border-b-transparent" />
                <div className="w-4 h-4 bg-[#00f2ff] rounded-full shadow-[0_0_12px_#00f2ff] animate-pulse" />
              </div>

              <div>
                <h2 className="font-headline text-xl font-bold text-[#00f2ff] tracking-wider uppercase">
                  JARVIS ONLINE
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 font-tech text-xs text-[#b9cacb]">
                  <span className="flex items-center gap-1.5 text-[#dce4e4]">
                    <span className="material-symbols-outlined text-[15px] text-[#00f2ff]">
                      psychology
                    </span>
                    Modelo: <span className="text-[#00f2ff] font-medium">{activeModel}</span>
                  </span>
                  <span className="text-[#3a494b]">|</span>
                  <span className="flex items-center gap-1.5 text-[#00f2ff]">
                    <span className="material-symbols-outlined text-[15px]">hub</span>
                    Ollama: <span className="font-medium text-[#74f5ff]">CONECTADO</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={() => {
                  playSound('warn');
                  onRebootCore();
                }}
                className="flex-1 md:flex-none bg-[#151d1e] border border-[#3a494b] hover:border-[#00f2ff] text-[#dce4e4] hover:text-[#00f2ff] px-4 py-2 rounded font-tech text-xs tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                <span>REBOOT CORE</span>
              </button>

              <button
                onClick={() => {
                  playSound('click');
                  onNavigate('telegram');
                }}
                className="flex-1 md:flex-none bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 border border-[#00f2ff] text-[#00f2ff] px-4 py-2 rounded font-tech text-xs tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(0,242,255,0.15)] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                <span>TELEGRAM LINK</span>
              </button>
            </div>
          </div>

          {/* Command Input Console */}
          <div className="glass-panel glass-panel-active rounded-xl p-1 relative overflow-hidden">
            <div className="bg-[#080f10]/90 p-5 rounded-lg flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[#00f2ff]/30 pb-2.5">
                <span className="font-tech text-xs text-[#00f2ff] flex items-center gap-2 tracking-wider">
                  <span className="material-symbols-outlined text-sm">terminal</span>
                  INPUT TERMINAL
                </span>
                <span className="font-tech text-[11px] text-[#b9cacb] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00f2ff] animate-ping" />
                  AWAITING COMMAND...
                </span>
              </div>

              <form onSubmit={handleExecute} className="relative">
                <textarea
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleExecute();
                    }
                  }}
                  placeholder="Abre YouTube y busca música relajante, o ingresa cualquier comando..."
                  rows={2}
                  className="w-full bg-transparent border-none focus:ring-0 font-headline text-lg md:text-xl text-[#dce4e4] placeholder:text-[#849495]/40 resize-none p-0 focus:outline-none"
                />
              </form>

              <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleVoiceToggle}
                    title="Dictado por voz"
                    className={`p-2.5 rounded border transition-all cursor-pointer ${
                      isListening
                        ? 'bg-[#00f2ff] text-[#002022] border-[#00f2ff] shadow-[0_0_15px_#00f2ff]'
                        : 'bg-[#151d1e] hover:bg-[#00f2ff]/15 text-[#b9cacb] hover:text-[#00f2ff] border-[#3a494b]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">mic</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSound('scan');
                      onTriggerAction('Analizando pantalla...', 'visibility');
                    }}
                    className="px-3.5 py-2 rounded bg-[#151d1e] hover:bg-[#00f2ff]/15 text-[#b9cacb] hover:text-[#00f2ff] border border-[#3a494b] hover:border-[#00f2ff]/50 font-tech text-xs tracking-wider transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">screenshot_monitor</span>
                    <span>ANALIZAR PANTALLA</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleExecute()}
                  className="bg-[#00f2ff] hover:bg-[#74f5ff] text-[#002022] font-tech text-xs font-bold tracking-widest px-6 py-2.5 rounded transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,242,255,0.4)] cursor-pointer active:scale-95"
                >
                  <span>EJECUTAR</span>
                  <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          {/* 12 Quick Action Cards Grid */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="font-tech text-xs text-[#00f2ff] tracking-widest uppercase flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">grid_view</span>
                RUTINAS & ACCIONES RÁPIDAS
              </span>
              <span className="font-tech text-[11px] text-[#849495]">12 MÓDULOS ACTIVOS</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {actionCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => {
                    playSound('click');
                    onTriggerAction(card.action, card.icon);
                  }}
                  className="glass-panel p-4 rounded-xl flex flex-col items-center justify-center text-center gap-2.5 hover:glass-panel-active hover:scale-[1.02] transition-all duration-200 group cursor-pointer active:scale-95"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#151d1e] border border-[#3a494b]/40 flex items-center justify-center text-[#b9cacb] group-hover:text-[#00f2ff] group-hover:border-[#00f2ff]/60 group-hover:shadow-[0_0_10px_rgba(0,242,255,0.2)] transition-all">
                    <span className="material-symbols-outlined text-2xl">{card.icon}</span>
                  </div>
                  <div>
                    <span className="font-tech text-xs font-medium text-[#dce4e4] group-hover:text-[#00f2ff] transition-colors block">
                      {card.title}
                    </span>
                    <span className="font-body text-[10px] text-[#849495] line-clamp-1 mt-0.5">
                      {card.desc}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section: Telemetry, Logs, Profile & Neural Net (4 cols) */}
        <div className="xl:col-span-4 space-y-6">
          {/* Telemetry Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* CPU */}
            <div className="glass-panel rounded-lg p-3.5 flex flex-col gap-1.5">
              <div className="flex justify-between items-center font-tech text-xs text-[#b9cacb]">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#00f2ff]">memory</span>
                  CPU
                </span>
                <span className="text-[#00f2ff] font-bold">{Math.round(telemetry.cpu)}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#2e3637] rounded overflow-hidden mt-1">
                <div
                  className="h-full bg-[#00f2ff] transition-all duration-500 shadow-[0_0_6px_#00f2ff]"
                  style={{ width: `${telemetry.cpu}%` }}
                />
              </div>
            </div>

            {/* RAM */}
            <div className="glass-panel rounded-lg p-3.5 flex flex-col gap-1.5">
              <div className="flex justify-between items-center font-tech text-xs text-[#b9cacb]">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#fe9d00]">dns</span>
                  RAM
                </span>
                <span className="text-[#fe9d00] font-bold">{Math.round(telemetry.ram)}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#2e3637] rounded overflow-hidden mt-1">
                <div
                  className="h-full bg-[#fe9d00] transition-all duration-500 shadow-[0_0_6px_#fe9d00]"
                  style={{ width: `${telemetry.ram}%` }}
                />
              </div>
            </div>

            {/* GPU */}
            <div className="glass-panel rounded-lg p-3.5 flex flex-col gap-1.5">
              <div className="flex justify-between items-center font-tech text-xs text-[#b9cacb]">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#00f2ff]">video_settings</span>
                  GPU
                </span>
                <span className="text-[#00f2ff] font-bold">{Math.round(telemetry.gpu)}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#2e3637] rounded overflow-hidden mt-1">
                <div
                  className="h-full bg-[#00f2ff] transition-all duration-500 shadow-[0_0_6px_#00f2ff]"
                  style={{ width: `${telemetry.gpu}%` }}
                />
              </div>
            </div>

            {/* VRAM */}
            <div className="glass-panel rounded-lg p-3.5 flex flex-col gap-1.5">
              <div className="flex justify-between items-center font-tech text-xs text-[#b9cacb]">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#00f2ff]">developer_board</span>
                  VRAM
                </span>
                <span className="text-[#00f2ff] font-bold">{Math.round(telemetry.vram)}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#2e3637] rounded overflow-hidden mt-1">
                <div
                  className="h-full bg-[#00f2ff] transition-all duration-500 shadow-[0_0_6px_#00f2ff]"
                  style={{ width: `${telemetry.vram}%` }}
                />
              </div>
            </div>

            {/* Battery */}
            <div className="glass-panel rounded-lg p-3.5 flex flex-col gap-1.5">
              <div className="flex justify-between items-center font-tech text-xs text-[#b9cacb]">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#00f2ff]">battery_charging_full</span>
                  BATTERY
                </span>
                <span className="text-[#00f2ff] font-bold">{telemetry.battery}</span>
              </div>
              <div className="w-full h-1.5 bg-[#2e3637] rounded overflow-hidden mt-1">
                <div className="h-full bg-[#00f2ff] w-full" />
              </div>
            </div>

            {/* Disk Storage */}
            <div className="glass-panel rounded-lg p-3.5 flex flex-col gap-1.5">
              <div className="flex justify-between items-center font-tech text-xs text-[#b9cacb]">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#ffb4ab]">hard_drive</span>
                  DISK C:
                </span>
                <span className="text-[#ffb4ab] font-bold">{Math.round(telemetry.disk)}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#2e3637] rounded overflow-hidden mt-1">
                <div
                  className="h-full bg-[#93000a] transition-all duration-500"
                  style={{ width: `${telemetry.disk}%` }}
                />
              </div>
            </div>
          </div>

          {/* Profile Card & Active Neural Net */}
          <div className="glass-panel rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-[#3a494b]/30 pb-3">
              <span className="font-tech text-xs text-[#00f2ff] tracking-wider">
                PROFILE IDENTIFICATION
              </span>
              <span className="font-tech text-[10px] text-[#849495]">SEC_CLEARANCE_L4</span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-lg border border-[#00f2ff]/40 overflow-hidden bg-[#151d1e] flex-shrink-0 shadow-[0_0_10px_rgba(0,242,255,0.2)]">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAY0vvKy5UsEnIGqpVrpJl8GZHTRzq2skP5UriF5ZgxQN8chI1IU4WWIYy7Tr7ZplO4_p5gq_M1TXiCVgv_mHLYembU0dRp2hU-x8GfxwCzah_a68HjRnsqVaigfw_6NCno-zWE6d7o5whsPrnncOCVMbhIXoAMX_xTTCEmzd33ykQyetaOjEXhvJIyhsi11yDIacKg4MlOYw_-DSDxSbNRD6je4y1Amyfs5G7kbUfCySA7qwX3kHNvIQ"
                  alt="Administrator Profile"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="font-headline font-bold text-base text-[#dce4e4]">ALEJANDRO</div>
                <div className="font-tech text-xs text-[#b9cacb]">Access: LOCAL HOST</div>
              </div>
            </div>

            <div className="bg-[#00f2ff]/10 border border-[#00f2ff]/30 rounded p-2.5 flex items-center justify-between font-tech text-xs">
              <span className="text-[#b9cacb]">SECURITY CLEARANCE</span>
              <span className="text-[#00f2ff] font-bold tracking-wider">HIGH / RESTRICTED</span>
            </div>

            {/* Neural Net telemetry */}
            <div className="pt-2 border-t border-[#3a494b]/30 font-tech text-xs space-y-2">
              <div className="flex justify-between text-[#b9cacb]">
                <span>Active Engine:</span>
                <span className="text-[#dce4e4] font-medium">{activeModel}</span>
              </div>
              <div className="flex justify-between text-[#b9cacb]">
                <span>Response Latency:</span>
                <span className="text-[#00f2ff] font-bold">{telemetry.latencyMs}ms</span>
              </div>
              <div className="w-full h-1 bg-[#2e3637] rounded overflow-hidden">
                <div className="h-full bg-[#00f2ff] w-3/4 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Real-time System Log */}
          <div className="glass-panel rounded-xl flex flex-col h-[340px] overflow-hidden">
            <div className="p-4 border-b border-[#3a494b]/40 flex items-center justify-between bg-[#080f10]/60">
              <h3 className="font-tech text-xs text-[#00f2ff] flex items-center gap-2 tracking-wider">
                <span className="material-symbols-outlined text-sm">list_alt</span>
                SYSTEM LOG STREAM
              </h3>
              <div className="flex items-center gap-1.5 font-tech text-[10px]">
                {(['ALL', 'CRIT', 'WARN', 'INFO'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      playSound('click');
                      setLogFilter(filter);
                    }}
                    className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                      logFilter === filter
                        ? 'bg-[#00f2ff] text-[#002022] font-bold'
                        : 'text-[#849495] hover:text-[#00f2ff]'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-2.5 font-tech text-xs">
              {filteredLogs.length === 0 ? (
                <div className="text-center text-[#849495] py-8">
                  No hay eventos con el filtro seleccionado
                </div>
              ) : (
                filteredLogs.map((log) => {
                  let badgeColor = 'text-[#00f2ff]';
                  let textColor = 'text-[#dce4e4]';
                  if (log.level === 'CRIT') {
                    badgeColor = 'text-[#ffb4ab] bg-[#93000a]/20 px-1 rounded';
                    textColor = 'text-[#ffb4ab]';
                  } else if (log.level === 'WARN') {
                    badgeColor = 'text-[#fe9d00]';
                    textColor = 'text-[#ffdcbb]';
                  } else if (log.level === 'SYS') {
                    badgeColor = 'text-[#ddb7ff]';
                  }

                  return (
                    <div key={log.id} className="flex gap-2.5 items-start leading-relaxed">
                      <span className="text-[#849495] whitespace-nowrap text-[11px] opacity-80">
                        {log.timestamp}
                      </span>
                      <span className={`text-[10px] font-bold ${badgeColor}`}>
                        [{log.level}]
                      </span>
                      <span className={`flex-1 break-words ${textColor}`}>{log.message}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
