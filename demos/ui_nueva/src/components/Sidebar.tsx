import React from 'react';
import { AppView, SystemStatus } from '../types';
import { playSound } from '../utils/audio';

interface SidebarProps {
  currentView: AppView;
  onSelectView: (view: AppView) => void;
  systemStatus: SystemStatus;
  onDeployNeuralLink: () => void;
  onOpenSettings: () => void;
  onLockScreen: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  systemStatus,
  onDeployNeuralLink,
  onOpenSettings,
  onLockScreen,
  isMobileOpen,
  onCloseMobile,
}) => {
  const navItems: { id: AppView; label: string; icon: string }[] = [
    { id: 'control', label: 'Control Center', icon: 'dashboard' },
    { id: 'chat', label: 'Chat', icon: 'terminal' },
    { id: 'automations', label: 'Automations', icon: 'smart_toy' },
    { id: 'memory', label: 'Memory', icon: 'memory' },
    { id: 'files', label: 'Files', icon: 'folder_open' },
    { id: 'devices', label: 'Devices', icon: 'precision_manufacturing' },
    { id: 'telegram', label: 'Telegram', icon: 'send' },
    { id: 'system', label: 'System', icon: 'analytics' },
  ];

  const handleNavClick = (viewId: AppView) => {
    playSound('click');
    onSelectView(viewId);
    onCloseMobile();
  };

  const isCritical = systemStatus === 'CRITICAL FAULT';

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-[#080f10]/95 backdrop-blur-xl border-r border-[#3a494b]/30 flex flex-col py-6 gap-2 z-40 transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Core Header */}
        <div className="px-6 pb-4 border-b border-[#3a494b]/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg border border-[#00f2ff]/40 overflow-hidden relative flex-shrink-0 bg-[#151d1e] flex items-center justify-center shadow-[0_0_10px_rgba(0,242,255,0.15)]">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6LirOPhCgY0wcvsthejBllyz7ESXNaJ5HPz3D321yrOxnhvcN3Y6EbeRS2y5lPGIDgq8LawWUzgnWvpyC21JLZwps97YG6QDZCRl2DuF1WSPCboewIVg08JjvFSKpGJ9lwHud_vagR6k8k9ggwwrf_zHfzlN_awaTLYwM-BccKEs3rpbUJSEHDLCxUDYO2E9Zao9EOO9WlnhLHsj_PP5PbpO7Q8-IZzCnkezRYPfHavMTfhBMAFxCvQ"
              alt="System Core"
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span className="material-symbols-outlined text-[#00f2ff] text-xl absolute">
              blur_on
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-headline text-sm font-bold text-[#00f2ff] tracking-wide truncate">
              AI COMMAND
            </h2>
            <p
              className={`font-tech text-[10px] tracking-wider truncate flex items-center gap-1.5 ${
                isCritical ? 'text-[#ffb4ab] animate-pulse' : 'text-[#74f5ff]/80'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isCritical ? 'bg-[#ffb4ab]' : 'bg-[#00f2ff]'
                }`}
              />
              STATUS: {systemStatus}
            </p>
          </div>
        </div>

        {/* Deploy Neural Link Button */}
        <div className="px-4 my-2">
          <button
            onClick={() => {
              playSound('neural');
              onDeployNeuralLink();
            }}
            className="w-full py-2.5 px-3 bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 border border-[#00f2ff] text-[#00f2ff] font-tech text-xs tracking-wider rounded transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(0,242,255,0.15)] active:scale-95 cursor-pointer group"
          >
            <span className="material-symbols-outlined text-[16px] group-hover:rotate-45 transition-transform duration-300">
              rocket_launch
            </span>
            <span>DEPLOY NEURAL LINK</span>
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded font-tech text-xs tracking-wide transition-all duration-200 text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#00f2ff]/12 text-[#00f2ff] border-l-4 border-[#00f2ff] shadow-[0_0_12px_rgba(0,242,255,0.2)] font-medium translate-x-1'
                    : 'text-[#b9cacb] hover:bg-[#2e3637]/40 hover:text-[#74f5ff] hover:translate-x-0.5'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    isActive ? 'text-[#00f2ff] fill-1' : 'text-[#849495]'
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="px-3 pt-3 border-t border-[#3a494b]/20 flex flex-col gap-1">
          <button
            onClick={() => {
              playSound('click');
              onOpenSettings();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded text-[#b9cacb] hover:bg-[#2e3637]/40 hover:text-[#00f2ff] transition-all font-tech text-xs text-left cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
            <span>Settings</span>
          </button>
          <button
            onClick={() => {
              playSound('warn');
              onLockScreen();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded text-[#b9cacb] hover:bg-[#93000a]/20 hover:text-[#ffb4ab] transition-all font-tech text-xs text-left cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
