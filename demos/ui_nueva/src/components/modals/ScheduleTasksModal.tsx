import React, { useState } from 'react';
import { playSound } from '../../utils/audio';

interface ScheduleTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScheduleTasksModal: React.FC<ScheduleTasksModalProps> = ({ isOpen, onClose }) => {
  const [tasks, setTasks] = useState([
    {
      id: '1',
      cron: '0 8 * * *',
      name: 'Resumen Matutino Ejecutivo',
      lastRun: 'Hoy 08:00 AM (Éxito)',
      nextRun: 'Mañana 08:00 AM',
      active: true,
    },
    {
      id: '2',
      cron: '0 2 * * *',
      name: 'Snapshot Base de Datos & Cifrado',
      lastRun: 'Ayer 02:00 AM (Éxito)',
      nextRun: 'Hoy 02:00 AM',
      active: true,
    },
    {
      id: '3',
      cron: '*/30 * * * *',
      name: 'Ping de Salud a Ollama Daemon',
      lastRun: 'Hace 4 min (Éxito)',
      nextRun: 'En 26 min',
      active: true,
    },
    {
      id: '4',
      cron: '0 3 * * 0',
      name: 'Auditoría Profunda de Vulnerabilidades',
      lastRun: 'Domingo 03:00 AM',
      nextRun: 'Próximo Domingo 03:00 AM',
      active: false,
    },
  ]);

  if (!isOpen) return null;

  const toggleTask = (id: string) => {
    playSound('click');
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, active: !t.active } : t))
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel glass-panel-active rounded-xl p-6 w-full max-w-xl relative space-y-4">
        <div className="flex justify-between items-center border-b border-[#3a494b]/40 pb-3">
          <h2 className="font-headline font-bold text-lg text-[#00f2ff] flex items-center gap-2">
            <span className="material-symbols-outlined">schedule</span>
            CRON & TAREAS PROGRAMADAS
          </h2>
          <button onClick={onClose} className="text-[#849495] hover:text-[#ffb4ab] cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto font-tech text-xs">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-[#151d1e] p-3.5 rounded-lg border border-[#3a494b]/50 flex items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/30 px-1.5 py-0.5 rounded text-[10px]">
                    {task.cron}
                  </span>
                  <span className="font-bold text-[#dce4e4]">{task.name}</span>
                </div>
                <div className="text-[#849495] text-[10px]">
                  Última ejecución: {task.lastRun} • Siguiente: {task.nextRun}
                </div>
              </div>

              <button
                onClick={() => toggleTask(task.id)}
                className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                  task.active
                    ? 'bg-[#00f2ff]/15 text-[#00f2ff] border border-[#00f2ff]/40'
                    : 'bg-[#2e3637] text-[#849495] border border-[#3a494b]'
                }`}
              >
                {task.active ? 'Activo' : 'Inactivo'}
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-[#3a494b]/30">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#00f2ff] text-[#002022] font-tech text-xs font-bold rounded cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
