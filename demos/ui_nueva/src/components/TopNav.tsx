import React, { useState, useEffect } from 'react';
import { AppView, TopNavTab } from '../types';
import { playSound, getSoundEnabled, setSoundEnabled } from '../utils/audio';

interface TopNavProps {
  currentView: AppView;
  onSelectView: (view: AppView) => void;
  activeTopTab: TopNavTab;
  onSelectTopTab: (tab: TopNavTab) => void;
  activeModel: string;
  onOpenNotifications: () => void;
  onOpenSchedule: () => void;
  onOpenDiagnostics: () => void;
  unreadNotificationsCount: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  onSelectView,
  activeTopTab,
  onSelectTopTab,
  activeModel,
  onOpenNotifications,
  onOpenSchedule,
  onOpenDiagnostics,
  unreadNotificationsCount,
}) => {
  const [timeString, setTimeString] = useState('');
  const [soundOn, setSoundOn] = useState(getSoundEnabled());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString('es-ES', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const nextState = !soundOn;
    setSoundOn(nextState);
    setSoundEnabled(nextState);
    if (nextState) {
      playSound('beep');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      playSound('beep');
      onSelectView('chat');
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-[#0d1515]/85 backdrop-blur-md border-b border-[#3a494b]/40 shadow-[0_0_15px_rgba(0,242,255,0.08)] flex justify-between items-center h-16 px-4 md:px-8">
      {/* Brand Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            playSound('click');
            onSelectView('control');
          }}
          className="text-left group cursor-pointer focus:outline-none"
        >
          <span className="font-headline text-xl md:text-2xl font-bold text-[#00f2ff] tracking-tighter drop-shadow-[0_0_8px_rgba(0,242,255,0.4)] group-hover:brightness-125 transition-all">
            JARVIS // CMD
          </span>
        </button>
      </div>

      {/* Center Search / Query system (Desktop) */}
      <div className="hidden lg:flex flex-1 max-w-md mx-6">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#849495] text-sm pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="QUERY SYSTEM // COMANDO..."
            className="w-full bg-[#151d1e]/70 border-b border-[#3a494b]/60 focus:border-[#00f2ff] focus:bg-[#192122] text-[#dce4e4] font-tech text-xs pl-9 pr-4 py-1.5 rounded-t transition-all placeholder:text-[#849495]/50 focus:outline-none focus:ring-0"
          />
        </form>
      </div>

      {/* Top Nav Mode Tabs */}
      <nav className="hidden md:flex gap-6 items-center">
        {(['MONITOR', 'ANALYTICS', 'LIVE'] as TopNavTab[]).map((tab) => {
          const isActive = activeTopTab === tab;
          return (
            <button
              key={tab}
              onClick={() => {
                playSound('click');
                onSelectTopTab(tab);
                if (tab === 'MONITOR') onSelectView('control');
                if (tab === 'ANALYTICS') onSelectView('analytics');
                if (tab === 'LIVE') onSelectView('live');
              }}
              className={`font-tech text-xs px-3 py-1 rounded transition-all cursor-pointer ${
                isActive
                  ? 'text-[#00f2ff] bg-[#00f2ff]/10 border-b-2 border-[#00f2ff] shadow-[0_0_10px_rgba(0,242,255,0.2)]'
                  : 'text-[#b9cacb] hover:text-[#00f2ff] hover:bg-[#00f2ff]/5'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* Right Trailing Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Model Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#192122]/90 border border-[#00f2ff]/30 rounded font-tech text-[11px] text-[#00f2ff] shadow-[0_0_8px_rgba(0,242,255,0.1)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-pulse" />
          <span>MODEL: {activeModel}</span>
        </div>

        {/* Digital Clock */}
        <div className="hidden sm:block font-tech text-xs text-[#b9cacb] tracking-wider px-2 py-1 bg-[#080f10]/80 rounded border border-[#3a494b]/30">
          {timeString || '00:00:00'}
        </div>

        {/* Audio FX Toggle */}
        <button
          onClick={toggleSound}
          title={soundOn ? 'Desactivar efectos de sonido' : 'Activar efectos de sonido'}
          className={`p-2 rounded-full transition-all cursor-pointer active:scale-95 ${
            soundOn
              ? 'text-[#00f2ff] hover:bg-[#00f2ff]/10'
              : 'text-[#849495] hover:bg-[#2e3637]/50 opacity-60'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {soundOn ? 'volume_up' : 'volume_off'}
          </span>
        </button>

        {/* System Diagnostics / Alert Simulator */}
        <button
          onClick={() => {
            playSound('warn');
            onOpenDiagnostics();
          }}
          title="Diagnóstico y Estado de Fallos"
          className="p-2 text-[#b9cacb] hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 rounded-full transition-all active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">
            settings_input_component
          </span>
        </button>

        {/* Notifications */}
        <button
          onClick={() => {
            playSound('click');
            onOpenNotifications();
          }}
          title="Notificaciones de Sistema"
          className="relative p-2 text-[#b9cacb] hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 rounded-full transition-all active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">
            notifications
          </span>
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#00f2ff] shadow-[0_0_6px_#00f2ff] animate-ping" />
          )}
        </button>

        {/* Scheduled Tasks */}
        <button
          onClick={() => {
            playSound('click');
            onOpenSchedule();
          }}
          title="Cron & Tareas Programadas"
          className="p-2 text-[#b9cacb] hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 rounded-full transition-all active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">
            schedule
          </span>
        </button>

        {/* Administrator Profile Picture */}
        <div
          onClick={() => {
            playSound('click');
            onSelectView('system');
          }}
          title="Perfil de Administrador: ALEJANDRO"
          className="w-8 h-8 rounded-full border border-[#00f2ff]/50 overflow-hidden shadow-[0_0_8px_rgba(0,242,255,0.3)] ml-1 cursor-pointer hover:border-[#00f2ff] hover:scale-105 transition-all"
        >
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAY0vvKy5UsEnIGqpVrpJl8GZHTRzq2skP5UriF5ZgxQN8chI1IU4WWIYy7Tr7ZplO4_p5gq_M1TXiCVgv_mHLYembU0dRp2hU-x8GfxwCzah_a68HjRnsqVaigfw_6NCno-zWE6d7o5whsPrnncOCVMbhIXoAMX_xTTCEmzd33ykQyetaOjEXhvJIyhsi11yDIacKg4MlOYw_-DSDxSbNRD6je4y1Amyfs5G7kbUfCySA7qwX3kHNvIQ"
            alt="Administrator Avatar"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback avatar icon
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      </div>
    </header>
  );
};
