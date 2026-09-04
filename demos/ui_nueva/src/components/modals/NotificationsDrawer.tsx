import React from 'react';
import { playSound } from '../../utils/audio';

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'warn' | 'crit';
  read: boolean;
}

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SystemNotification[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#080f10]/95 border-l border-[#3a494b]/50 backdrop-blur-xl p-6 flex flex-col justify-between shadow-2xl animate-[slideLeft_0.3s_ease-out]">
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#3a494b]/40 pb-3">
            <h2 className="font-headline font-bold text-lg text-[#00f2ff] flex items-center gap-2">
              <span className="material-symbols-outlined">notifications</span>
              NOTIFICACIONES ({notifications.filter((n) => !n.read).length})
            </h2>
            <button
              onClick={onClose}
              className="text-[#849495] hover:text-[#ffb4ab] cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex justify-between items-center font-tech text-xs">
            <button
              onClick={() => {
                playSound('click');
                onMarkAllRead();
              }}
              className="text-[#00f2ff] hover:underline cursor-pointer"
            >
              Marcar todas como leídas
            </button>
            <button
              onClick={() => {
                playSound('click');
                onClearAll();
              }}
              className="text-[#849495] hover:text-[#ffb4ab] cursor-pointer"
            >
              Limpiar historial
            </button>
          </div>

          {/* List */}
          <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="text-center text-[#849495] font-tech text-xs py-12">
                No hay notificaciones pendientes.
              </div>
            ) : (
              notifications.map((n) => {
                let badge = 'text-[#00f2ff] bg-[#00f2ff]/10 border-[#00f2ff]/30';
                if (n.type === 'warn') {
                  badge = 'text-[#fe9d00] bg-[#fe9d00]/10 border-[#fe9d00]/30';
                } else if (n.type === 'crit') {
                  badge = 'text-[#ffb4ab] bg-[#93000a]/20 border-[#ffb4ab]/30';
                }

                return (
                  <div
                    key={n.id}
                    className={`p-3.5 rounded-lg border bg-[#151d1e] space-y-1 transition-all ${
                      n.read ? 'border-[#3a494b]/30 opacity-70' : 'border-[#00f2ff]/40 shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className={`px-1.5 py-0.5 rounded border text-[9px] font-tech font-bold uppercase ${badge}`}>
                        {n.type}
                      </span>
                      <span className="font-tech text-[10px] text-[#849495]">{n.time}</span>
                    </div>
                    <div className="font-headline font-bold text-xs text-[#dce4e4]">{n.title}</div>
                    <p className="font-body text-xs text-[#b9cacb] leading-relaxed">{n.message}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-[#3a494b]/30">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#151d1e] hover:bg-[#2e3637] text-[#dce4e4] font-tech text-xs rounded border border-[#3a494b] cursor-pointer"
          >
            Cerrar Panel
          </button>
        </div>
      </div>
    </div>
  );
};
