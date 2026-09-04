import React, { useState } from 'react';
import { AutomationRoutine, FlowNode } from '../../types';
import { playSound } from '../../utils/audio';

interface AutomationsViewProps {
  routines: AutomationRoutine[];
  onToggleRoutine: (id: string) => void;
  onRunRoutine: (id: string) => void;
  onCreateRoutine: (routine: Omit<AutomationRoutine, 'id' | 'num'>) => void;
  onDeleteRoutine: (id: string) => void;
}

export const AutomationsView: React.FC<AutomationsViewProps> = ({
  routines,
  onToggleRoutine,
  onRunRoutine,
  onCreateRoutine,
  onDeleteRoutine,
}) => {
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>(routines[0]?.id || '1');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Form states for execution config
  const [frequency, setFrequency] = useState('Diario');
  const [scheduledTime, setScheduledTime] = useState('08:00 AM');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Routine Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newFrequency, setNewFrequency] = useState('Diario');
  const [newTime, setNewTime] = useState('09:00 AM');
  const [newTriggerType, setNewTriggerType] = useState<'Schedule' | 'Event' | 'Webhook'>('Schedule');
  const [newTarget, setNewTarget] = useState('Telegram: @alejandro_main');

  const selectedRoutine = routines.find((r) => r.id === selectedRoutineId) || routines[0];

  const nodes: FlowNode[] = [
    {
      id: 'n1',
      type: 'TRIGGER',
      label: 'TIME TRIGGER',
      sublabel: `${scheduledTime} (UTC-3)`,
      x: 30,
      y: 70,
    },
    {
      id: 'n2',
      type: 'API_CALL',
      label: 'FETCH CALENDAR',
      sublabel: 'Google Calendar API',
      x: 190,
      y: 30,
    },
    {
      id: 'n3',
      type: 'DATA_FETCH',
      label: 'SYSTEM HEALTH',
      sublabel: 'Local Telemetry Daemon',
      x: 190,
      y: 110,
    },
    {
      id: 'n4',
      type: 'LLM_GENERATE',
      label: 'OLLAMA SUMMARY',
      sublabel: 'qwen2.5:14b Core',
      x: 370,
      y: 70,
    },
    {
      id: 'n5',
      type: 'OUTPUT',
      label: 'SEND TELEGRAM',
      sublabel: 'Chat ID: 94827104',
      x: 530,
      y: 70,
    },
  ];

  const handleSaveConfig = () => {
    playSound('confirm');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    playSound('confirm');
    onCreateRoutine({
      title: newTitle.trim(),
      description: newDesc.trim() || 'Automatización personalizada generada por el usuario.',
      frequency: newFrequency,
      time: `${newFrequency} (${newTime})`,
      triggerType: newTriggerType,
      targetOutput: newTarget,
      status: 'ACTIVA',
    });
    setNewTitle('');
    setNewDesc('');
    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="glass-panel p-6 rounded-xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="scan-line-anim" />
        <div>
          <h1 className="font-headline text-2xl md:text-3xl font-bold text-[#00f2ff] tracking-tight">
            GESTIÓN DE RUTINAS
          </h1>
          <p className="font-body text-sm text-[#b9cacb] mt-1">
            Orquestación de flujos de trabajo autónomos y disparadores de eventos.
          </p>
        </div>

        <button
          onClick={() => {
            playSound('click');
            setIsCreateModalOpen(true);
          }}
          className="bg-[#00f2ff] hover:bg-[#74f5ff] text-[#002022] font-tech text-xs font-bold tracking-wider px-4 py-2.5 rounded transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,242,255,0.3)] cursor-pointer active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>+ CREAR AUTOMATIZACIÓN</span>
        </button>
      </div>

      {/* Main Grid: Routines List & Flow Diagram Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Routines List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="font-tech text-xs text-[#00f2ff] tracking-wider uppercase flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">view_list</span>
              RUTINAS PROGRAMADAS ({routines.length})
            </span>
          </div>

          <div className="space-y-3">
            {routines.map((routine) => {
              const isSelected = routine.id === selectedRoutineId;
              let statusBadge = (
                <span className="bg-[#00f2ff]/15 text-[#00f2ff] border border-[#00f2ff]/40 px-2 py-0.5 rounded font-tech text-[10px] font-bold">
                  ACTIVA
                </span>
              );

              if (routine.status === 'PAUSADA') {
                statusBadge = (
                  <span className="bg-[#fe9d00]/15 text-[#fe9d00] border border-[#fe9d00]/40 px-2 py-0.5 rounded font-tech text-[10px] font-bold">
                    PAUSADA
                  </span>
                );
              } else if (routine.status === 'ERROR') {
                statusBadge = (
                  <span className="bg-[#ffb4ab]/15 text-[#ffb4ab] border border-[#ffb4ab]/40 px-2 py-0.5 rounded font-tech text-[10px] font-bold animate-pulse">
                    ERROR
                  </span>
                );
              }

              return (
                <div
                  key={routine.id}
                  onClick={() => {
                    playSound('click');
                    setSelectedRoutineId(routine.id);
                  }}
                  className={`glass-panel p-4 rounded-xl transition-all cursor-pointer relative group ${
                    isSelected ? 'glass-panel-active border-l-4 border-l-[#00f2ff]' : 'hover:border-[#00f2ff]/40'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-tech text-xs text-[#00f2ff]/70 font-bold">
                        {routine.num}
                      </span>
                      <h3 className="font-headline font-bold text-sm text-[#dce4e4] group-hover:text-[#00f2ff] transition-colors">
                        {routine.title}
                      </h3>
                    </div>
                    {statusBadge}
                  </div>

                  <p className="font-body text-xs text-[#b9cacb] mb-3 leading-relaxed">
                    {routine.description}
                  </p>

                  <div className="font-tech text-[11px] text-[#849495] flex flex-wrap items-center gap-2 pt-2 border-t border-[#3a494b]/30">
                    <span className="flex items-center gap-1 text-[#00f2ff]/80">
                      <span className="material-symbols-outlined text-[13px]">timer</span>
                      {routine.time}
                    </span>
                    <span>→</span>
                    <span className="flex items-center gap-1 text-[#dce4e4] truncate max-w-[180px]">
                      <span className="material-symbols-outlined text-[13px]">output</span>
                      {routine.targetOutput}
                    </span>
                  </div>

                  {/* Quick Action Controls */}
                  <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-[#3a494b]/20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playSound('scan');
                        onRunRoutine(routine.id);
                      }}
                      title="Ejecutar rutina ahora"
                      className="px-2.5 py-1 bg-[#00f2ff]/10 hover:bg-[#00f2ff]/25 text-[#00f2ff] rounded font-tech text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[13px]">play_arrow</span>
                      <span>Ejecutar</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playSound('click');
                        onToggleRoutine(routine.id);
                      }}
                      title={routine.status === 'ACTIVA' ? 'Pausar' : 'Activar'}
                      className="px-2.5 py-1 bg-[#151d1e] hover:bg-[#2e3637] text-[#b9cacb] hover:text-[#dce4e4] rounded font-tech text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {routine.status === 'ACTIVA' ? 'pause' : 'play_circle'}
                      </span>
                      <span>{routine.status === 'ACTIVA' ? 'Pausar' : 'Activar'}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playSound('warn');
                        onDeleteRoutine(routine.id);
                      }}
                      title="Eliminar rutina"
                      className="p-1 text-[#849495] hover:text-[#ffb4ab] hover:bg-[#93000a]/20 rounded transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Interactive Flow Diagram & Execution Config (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Logic Flow Diagram Header & Canvas */}
          <div className="glass-panel rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#3a494b]/40 flex justify-between items-center bg-[#080f10]/80">
              <div className="flex items-center gap-2 font-tech text-xs text-[#00f2ff] tracking-wider">
                <span className="material-symbols-outlined text-base">account_tree</span>
                <span>LOGIC_FLOW: {selectedRoutine?.title.toUpperCase().replace(/\s+/g, '_')}</span>
              </div>

              {/* Canvas controls */}
              <div className="flex items-center gap-1 bg-[#151d1e] p-1 rounded border border-[#3a494b]/40">
                <button
                  onClick={() => {
                    playSound('click');
                    setZoomLevel((z) => Math.min(1.4, z + 0.1));
                  }}
                  className="p-1 text-[#b9cacb] hover:text-[#00f2ff] transition-colors cursor-pointer"
                  title="Acercar"
                >
                  <span className="material-symbols-outlined text-sm">zoom_in</span>
                </button>
                <button
                  onClick={() => {
                    playSound('click');
                    setZoomLevel((z) => Math.max(0.7, z - 0.1));
                  }}
                  className="p-1 text-[#b9cacb] hover:text-[#00f2ff] transition-colors cursor-pointer"
                  title="Alejar"
                >
                  <span className="material-symbols-outlined text-sm">zoom_out</span>
                </button>
                <button
                  onClick={() => {
                    playSound('click');
                    setZoomLevel(1);
                  }}
                  className="p-1 text-[#b9cacb] hover:text-[#00f2ff] transition-colors cursor-pointer"
                  title="Restablecer"
                >
                  <span className="material-symbols-outlined text-sm">center_focus_strong</span>
                </button>
              </div>
            </div>

            {/* Interactive SVG Flow Canvas */}
            <div className="p-6 bg-[#060b0c] relative min-h-[320px] flex items-center justify-center overflow-x-auto">
              <div
                className="transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <div className="relative w-[670px] h-[190px]">
                  {/* Connecting lines SVG */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {/* Line 1 -> 2 */}
                    <path
                      d="M 125 70 C 150 70, 160 40, 190 40"
                      fill="none"
                      stroke="#00f2ff"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      className="opacity-70"
                    />
                    {/* Line 1 -> 3 */}
                    <path
                      d="M 125 70 C 150 70, 160 115, 190 115"
                      fill="none"
                      stroke="#00f2ff"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      className="opacity-70"
                    />
                    {/* Line 2 -> 4 */}
                    <path
                      d="M 310 40 C 335 40, 345 70, 370 70"
                      fill="none"
                      stroke="#00f2ff"
                      strokeWidth="2"
                      className="opacity-80"
                    />
                    {/* Line 3 -> 4 */}
                    <path
                      d="M 310 115 C 335 115, 345 70, 370 70"
                      fill="none"
                      stroke="#00f2ff"
                      strokeWidth="2"
                      className="opacity-80"
                    />
                    {/* Line 4 -> 5 */}
                    <path
                      d="M 480 70 L 530 70"
                      fill="none"
                      stroke="#00f2ff"
                      strokeWidth="2"
                      className="opacity-90"
                    />
                  </svg>

                  {/* Flow Nodes */}
                  {nodes.map((node) => {
                    const isNodeSelected = selectedNodeId === node.id;
                    let typeColor = 'text-[#00f2ff] border-[#00f2ff]/40 bg-[#00f2ff]/10';
                    if (node.type === 'LLM_GENERATE') {
                      typeColor = 'text-[#ffb869] border-[#ffb869]/40 bg-[#ffb869]/10';
                    } else if (node.type === 'TRIGGER') {
                      typeColor = 'text-[#74f5ff] border-[#74f5ff]/40 bg-[#74f5ff]/10';
                    }

                    return (
                      <div
                        key={node.id}
                        onClick={() => {
                          playSound('click');
                          setSelectedNodeId(node.id);
                        }}
                        style={{ left: `${node.x}px`, top: `${node.y}px` }}
                        className={`absolute -translate-y-1/2 w-[130px] p-2.5 rounded-lg border bg-[#151d1e]/90 backdrop-blur-sm cursor-pointer transition-all duration-200 ${
                          isNodeSelected
                            ? 'border-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.4)] scale-105'
                            : 'border-[#3a494b]/60 hover:border-[#00f2ff]/50'
                        }`}
                      >
                        <span
                          className={`text-[9px] font-tech font-bold px-1 py-0.5 rounded border uppercase tracking-wider ${typeColor}`}
                        >
                          {node.type}
                        </span>
                        <div className="font-tech text-xs font-bold text-[#dce4e4] mt-1.5 truncate">
                          {node.label}
                        </div>
                        <div className="font-body text-[10px] text-[#849495] truncate">
                          {node.sublabel}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Execution Configuration Form */}
          <div className="glass-panel p-6 rounded-xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#3a494b]/40 pb-3">
              <h3 className="font-tech text-xs text-[#00f2ff] tracking-wider uppercase flex items-center gap-2">
                <span className="material-symbols-outlined text-base">settings_suggest</span>
                PARÁMETROS DE EJECUCIÓN
              </h3>
              {saveSuccess && (
                <span className="font-tech text-xs text-[#00f2ff] flex items-center gap-1 animate-pulse">
                  <span className="material-symbols-outlined text-sm">check</span>
                  Configuración guardada
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-tech text-xs text-[#b9cacb] mb-1.5">
                  Frecuencia de Ejecución
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full bg-[#151d1e] border border-[#3a494b] focus:border-[#00f2ff] text-[#dce4e4] font-tech text-xs rounded p-2.5 focus:outline-none"
                >
                  <option value="Diario">Diario</option>
                  <option value="Cada 6 horas">Cada 6 horas</option>
                  <option value="Semanal">Semanal</option>
                  <option value="Cron Personalizado">Cron Personalizado</option>
                </select>
              </div>

              <div>
                <label className="block font-tech text-xs text-[#b9cacb] mb-1.5">
                  Hora de Disparo (Local / UTC-3)
                </label>
                <input
                  type="text"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-[#151d1e] border border-[#3a494b] focus:border-[#00f2ff] text-[#dce4e4] font-tech text-xs rounded p-2.5 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  playSound('beep');
                  setFrequency('Diario');
                  setScheduledTime('08:00 AM');
                }}
                className="px-4 py-2 border border-[#3a494b] hover:border-[#849495] text-[#b9cacb] rounded font-tech text-xs tracking-wider transition-colors cursor-pointer"
              >
                Descartar
              </button>

              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-6 py-2 bg-[#00f2ff] hover:bg-[#74f5ff] text-[#002022] font-tech text-xs font-bold tracking-wider rounded transition-all shadow-[0_0_12px_rgba(0,242,255,0.25)] cursor-pointer active:scale-95"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Create Automation */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel glass-panel-active rounded-xl p-6 w-full max-w-lg relative">
            <div className="flex justify-between items-center border-b border-[#3a494b]/40 pb-3 mb-4">
              <h2 className="font-headline font-bold text-lg text-[#00f2ff] flex items-center gap-2">
                <span className="material-symbols-outlined">add_circle</span>
                CREAR NUEVA AUTOMATIZACIÓN
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#849495] hover:text-[#ffb4ab] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block font-tech text-xs text-[#b9cacb] mb-1">
                  Nombre de la Rutina
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: AUDITORÍA DE RED LAN"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#151d1e] border border-[#3a494b] focus:border-[#00f2ff] text-[#dce4e4] font-tech text-xs rounded p-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-tech text-xs text-[#b9cacb] mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Escaneo nocturno de dispositivos conectados y análisis de puertos vulnerables."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-[#151d1e] border border-[#3a494b] focus:border-[#00f2ff] text-[#dce4e4] font-tech text-xs rounded p-2.5 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-tech text-xs text-[#b9cacb] mb-1">
                    Tipo de Disparador
                  </label>
                  <select
                    value={newTriggerType}
                    onChange={(e) =>
                      setNewTriggerType(e.target.value as 'Schedule' | 'Event' | 'Webhook')
                    }
                    className="w-full bg-[#151d1e] border border-[#3a494b] focus:border-[#00f2ff] text-[#dce4e4] font-tech text-xs rounded p-2.5 focus:outline-none"
                  >
                    <option value="Schedule">Schedule (Cron)</option>
                    <option value="Event">Event Listener</option>
                    <option value="Webhook">Incoming Webhook</option>
                  </select>
                </div>

                <div>
                  <label className="block font-tech text-xs text-[#b9cacb] mb-1">
                    Hora o Disparo
                  </label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-[#151d1e] border border-[#3a494b] focus:border-[#00f2ff] text-[#dce4e4] font-tech text-xs rounded p-2.5 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-tech text-xs text-[#b9cacb] mb-1">
                  Destino de Salida
                </label>
                <input
                  type="text"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  className="w-full bg-[#151d1e] border border-[#3a494b] focus:border-[#00f2ff] text-[#dce4e4] font-tech text-xs rounded p-2.5 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#3a494b]/30">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-[#3a494b] text-[#b9cacb] rounded font-tech text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00f2ff] hover:bg-[#74f5ff] text-[#002022] font-tech text-xs font-bold rounded shadow-[0_0_12px_rgba(0,242,255,0.3)] cursor-pointer"
                >
                  CREAR RUTINA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
