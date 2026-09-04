import React, { useState } from 'react';
import { DeviceItem } from '../../types';
import { playSound } from '../../utils/audio';

export interface OpenWindowItem {
  hwnd?: number;
  titulo: string;
  proceso?: string;
}

interface DevicesViewProps {
  devices: DeviceItem[];
  openWindows?: OpenWindowItem[];
  onToggleDevice: (deviceId: string) => void;
  onRefreshDevices: () => void;
  onFocusWindow?: (title: string) => void;
}

export const DevicesView: React.FC<DevicesViewProps> = ({
  devices,
  openWindows = [],
  onToggleDevice,
  onRefreshDevices,
  onFocusWindow,
}) => {
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    playSound('scan');
    setIsScanning(true);
    onRefreshDevices();
    setTimeout(() => {
      setIsScanning(false);
      playSound('confirm');
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="glass-panel p-6 rounded-xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="scan-line-anim" />
        <div>
          <h1 className="font-headline text-2xl md:text-3xl font-bold text-[#00f2ff] tracking-tight">
            DISPOSITIVOS CONECTADOS
          </h1>
          <p className="font-body text-sm text-[#b9cacb] mt-1">
            Topología de hardware, aceleradores de inferencia y sockets de red vinculados.
          </p>
        </div>

        <button
          onClick={handleScan}
          disabled={isScanning}
          className="bg-[#00f2ff] hover:bg-[#74f5ff] disabled:opacity-50 text-[#002022] font-tech text-xs font-bold tracking-wider px-4 py-2.5 rounded transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,242,255,0.3)] cursor-pointer active:scale-95"
        >
          <span
            className={`material-symbols-outlined text-[18px] ${
              isScanning ? 'animate-spin' : ''
            }`}
          >
            sync
          </span>
          <span>{isScanning ? 'ESCANEA DISPOSITIVOS...' : 'ESCANEAR RED'}</span>
        </button>
      </div>

      {/* Device Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {devices.map((device) => {
          let statusBadge = (
            <span className="px-2 py-0.5 rounded bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/30 text-[10px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-pulse" />
              ONLINE
            </span>
          );

          if (device.status === 'BUSY') {
            statusBadge = (
              <span className="px-2 py-0.5 rounded bg-[#fe9d00]/10 text-[#fe9d00] border border-[#fe9d00]/30 text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#fe9d00] animate-ping" />
                OCUPADO
              </span>
            );
          } else if (device.status === 'OFFLINE') {
            statusBadge = (
              <span className="px-2 py-0.5 rounded bg-[#93000a]/20 text-[#ffb4ab] border border-[#ffb4ab]/30 text-[10px] font-bold">
                OFFLINE
              </span>
            );
          }

          return (
            <div
              key={device.id}
              className="glass-panel p-5 rounded-xl flex flex-col justify-between gap-4 hover:glass-panel-active transition-all group"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00f2ff] text-xl">
                      {device.type === 'Neural Link'
                        ? 'psychology'
                        : device.type === 'Display'
                        ? 'monitor'
                        : device.type === 'Compute'
                        ? 'memory'
                        : device.type === 'Audio'
                        ? 'mic'
                        : 'storage'}
                    </span>
                    <span className="font-tech text-[10px] text-[#849495] uppercase">
                      {device.type}
                    </span>
                  </div>
                  {statusBadge}
                </div>

                <h3 className="font-headline font-bold text-base text-[#dce4e4] group-hover:text-[#00f2ff] transition-colors">
                  {device.name}
                </h3>
              </div>

              {/* Telemetry info */}
              <div className="space-y-2 font-tech text-xs bg-[#080f10]/80 p-3 rounded-lg border border-[#3a494b]/30">
                <div className="flex justify-between text-[#849495]">
                  <span>Dirección IP:</span>
                  <span className="text-[#dce4e4]">{device.ip}</span>
                </div>
                <div className="flex justify-between text-[#849495]">
                  <span>Último Ping:</span>
                  <span className="text-[#74f5ff]">{device.lastPing}</span>
                </div>
                <div className="pt-1">
                  <div className="flex justify-between text-[#849495] mb-1">
                    <span>Uso / Carga:</span>
                    <span className="text-[#00f2ff] font-bold">{device.usage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#2e3637] rounded overflow-hidden">
                    <div
                      className="h-full bg-[#00f2ff] transition-all duration-500"
                      style={{ width: `${device.usage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex justify-between items-center pt-2 border-t border-[#3a494b]/30">
                <span className="font-tech text-[11px] text-[#849495]">Control de Energía</span>
                <button
                  onClick={() => {
                    playSound('click');
                    onToggleDevice(device.id);
                  }}
                  className={`px-3 py-1 rounded font-tech text-xs cursor-pointer transition-colors ${
                    device.status === 'OFFLINE'
                      ? 'bg-[#00f2ff]/15 text-[#00f2ff] border border-[#00f2ff]'
                      : 'bg-[#151d1e] text-[#b9cacb] hover:text-[#ffb4ab] border border-[#3a494b]'
                  }`}
                >
                  {device.status === 'OFFLINE' ? 'Conectar' : 'Desconectar'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real Windows Applications Section (pywinauto) */}
      <div className="glass-panel p-6 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#3a494b]/40 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00f2ff] text-xl">desktop_windows</span>
            <h2 className="font-headline font-bold text-lg text-[#00f2ff] tracking-tight">
              VENTANAS Y APLICACIONES ACTIVAS EN WINDOWS
            </h2>
          </div>
          <span className="font-tech text-xs bg-[#151d1e] text-[#74f5ff] px-3 py-1 rounded border border-[#3a494b]/50">
            NATIVO // pywinauto ({openWindows.length} detectadas)
          </span>
        </div>

        {openWindows.length === 0 ? (
          <p className="font-tech text-xs text-[#849495] italic">
            No se han detectado ventanas activas en segundo plano o el sistema está en modo simulación.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
            {openWindows.slice(0, 12).map((win, idx) => (
              <div
                key={win.hwnd || idx}
                className="bg-[#080f10]/80 border border-[#3a494b]/40 p-3 rounded-lg flex items-center justify-between gap-3 hover:border-[#00f2ff]/60 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-tech text-xs font-semibold text-[#dce4e4] truncate">
                    {win.titulo || 'Ventana sin título'}
                  </p>
                  {win.proceso && (
                    <span className="font-mono text-[10px] text-[#849495]">
                      Proceso: {win.proceso} {win.hwnd ? `(HWND: ${win.hwnd})` : ''}
                    </span>
                  )}
                </div>
                {onFocusWindow && (
                  <button
                    onClick={() => {
                      playSound('click');
                      onFocusWindow(win.titulo);
                    }}
                    className="px-2.5 py-1 bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/40 rounded font-tech text-[11px] font-bold cursor-pointer whitespace-nowrap transition-colors"
                  >
                    TRAER AL FRENTE
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
