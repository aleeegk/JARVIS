import React, { useState } from 'react';
import { TelegramConfig } from '../../types';
import { playSound } from '../../utils/audio';

interface TelegramViewProps {
  config: TelegramConfig;
  onUpdateConfig: (updated: Partial<TelegramConfig>) => void;
  onTestConnection: () => void;
}

export const TelegramView: React.FC<TelegramViewProps> = ({
  config,
  onUpdateConfig,
  onTestConnection,
}) => {
  const [showToken, setShowToken] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [chatIdInput, setChatIdInput] = useState(config.authorizedChatId);
  const [tokenInput, setTokenInput] = useState(config.botToken);
  const [copied, setCopied] = useState(false);
  const [isPinging, setIsPinging] = useState(false);

  const handleCopy = () => {
    playSound('beep');
    navigator.clipboard.writeText(config.botToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    playSound('confirm');
    onUpdateConfig({
      authorizedChatId: chatIdInput,
      botToken: tokenInput,
    });
    setIsEditing(false);
  };

  const handlePingTest = () => {
    playSound('scan');
    setIsPinging(true);
    onTestConnection();
    setTimeout(() => {
      setIsPinging(false);
      playSound('confirm');
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="glass-panel p-6 rounded-xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="scan-line-anim" />
        <div>
          <h1 className="font-headline text-2xl md:text-3xl font-bold text-[#00f2ff] tracking-tight">
            INTEGRACIÓN TELEGRAM
          </h1>
          <p className="font-body text-sm text-[#b9cacb] mt-1">
            Control remoto y canal de notificaciones bidireccional seguro mediante bot.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#00f2ff]/15 text-[#00f2ff] border border-[#00f2ff]/40 px-3.5 py-1.5 rounded-lg font-tech text-xs tracking-wider shadow-[0_0_10px_rgba(0,242,255,0.2)]">
          <span className="w-2 h-2 rounded-full bg-[#00f2ff] animate-pulse" />
          <span>ESTADO: ACTIVO</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Security Parameters & Controls (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass-panel p-6 rounded-xl space-y-5">
            <div className="flex justify-between items-center border-b border-[#3a494b]/40 pb-3">
              <h3 className="font-tech text-xs text-[#00f2ff] tracking-wider uppercase flex items-center gap-2">
                <span className="material-symbols-outlined text-base">shield_lock</span>
                PARÁMETROS DE SEGURIDAD
              </h3>
              <button
                onClick={() => {
                  playSound('click');
                  setIsEditing(!isEditing);
                }}
                className="text-[#849495] hover:text-[#00f2ff] font-tech text-xs flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">
                  {isEditing ? 'close' : 'edit'}
                </span>
                <span>{isEditing ? 'Cancelar' : 'Modificar'}</span>
              </button>
            </div>

            {/* Chat ID */}
            <div>
              <label className="block font-tech text-xs text-[#b9cacb] mb-1.5">
                Chat ID Autorizado
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={chatIdInput}
                  onChange={(e) => setChatIdInput(e.target.value)}
                  className="w-full bg-[#151d1e] border border-[#3a494b] focus:border-[#00f2ff] text-[#dce4e4] font-tech text-xs rounded p-2.5 focus:outline-none"
                />
              ) : (
                <div className="bg-[#151d1e] border border-[#3a494b]/60 rounded p-3 font-tech text-xs text-[#dce4e4] flex items-center justify-between">
                  <span>{config.authorizedChatId} (Alejandro)</span>
                  <span className="px-2 py-0.5 rounded bg-[#00f2ff]/10 text-[#00f2ff] text-[10px] font-bold">
                    VERIFICADO
                  </span>
                </div>
              )}
            </div>

            {/* Webhook Status */}
            <div>
              <label className="block font-tech text-xs text-[#b9cacb] mb-1.5">
                Estado del Webhook
              </label>
              <div className="bg-[#151d1e] border border-[#3a494b]/60 rounded p-3 font-tech text-xs text-[#dce4e4] flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00f2ff] animate-ping" />
                  {config.webhookStatus}
                </span>
                <span className="text-[#849495] text-[11px]">Latencia: 42ms</span>
              </div>
            </div>

            {/* Bot Token */}
            <div>
              <label className="block font-tech text-xs text-[#b9cacb] mb-1.5">
                Telegram Bot Token (HTTP API)
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full bg-[#151d1e] border border-[#3a494b] focus:border-[#00f2ff] text-[#dce4e4] font-tech text-xs rounded p-2.5 focus:outline-none"
                />
              ) : (
                <div className="bg-[#151d1e] border border-[#3a494b]/60 rounded p-3 font-tech text-xs text-[#dce4e4] flex items-center justify-between gap-2">
                  <span className="truncate">
                    {showToken ? config.botToken : '••••••••••••••••••••••••••••••••••••••••'}
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => {
                        playSound('click');
                        setShowToken(!showToken);
                      }}
                      title={showToken ? 'Ocultar token' : 'Mostrar token'}
                      className="p-1 text-[#849495] hover:text-[#00f2ff] transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">
                        {showToken ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                    <button
                      onClick={handleCopy}
                      title="Copiar token"
                      className="p-1 text-[#849495] hover:text-[#00f2ff] transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">
                        {copied ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {isEditing && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSave}
                  className="px-5 py-2 bg-[#00f2ff] hover:bg-[#74f5ff] text-[#002022] font-tech text-xs font-bold rounded shadow-[0_0_12px_rgba(0,242,255,0.3)] cursor-pointer"
                >
                  Guardar Parámetros
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-3 border-t border-[#3a494b]/30">
              <button
                onClick={handlePingTest}
                disabled={isPinging}
                className="flex-1 bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 border border-[#00f2ff] text-[#00f2ff] px-4 py-2.5 rounded font-tech text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_10px_rgba(0,242,255,0.15)] active:scale-95"
              >
                <span
                  className={`material-symbols-outlined text-base ${
                    isPinging ? 'animate-spin' : ''
                  }`}
                >
                  {isPinging ? 'sync' : 'network_ping'}
                </span>
                <span>{isPinging ? 'PROBANDO...' : 'PROBAR CONEXIÓN'}</span>
              </button>

              <button
                onClick={() => {
                  playSound('warn');
                  onUpdateConfig({ webhookStatus: 'Conectado' });
                }}
                className="bg-[#151d1e] hover:bg-[#2e3637] border border-[#3a494b] text-[#b9cacb] px-4 py-2.5 rounded font-tech text-xs tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
                <span>REGENERAR WEBHOOK</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Traffic Monitor & Logs (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass-panel p-6 rounded-xl flex flex-col h-full space-y-4">
            <div className="flex justify-between items-center border-b border-[#3a494b]/40 pb-3">
              <h3 className="font-tech text-xs text-[#00f2ff] tracking-wider uppercase flex items-center gap-2">
                <span className="material-symbols-outlined text-base">terminal</span>
                MONITOR DE TRÁFICO Y ACTIVIDAD
              </h3>
              <span className="font-tech text-[10px] text-[#849495] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-ping" />
                STREAM EN VIVO
              </span>
            </div>

            {/* Quick Status Stats */}
            <div className="grid grid-cols-2 gap-3 font-tech text-xs">
              <div className="bg-[#151d1e] p-3 rounded border border-[#3a494b]/40">
                <span className="text-[#849495] text-[10px] block mb-1">ÚLTIMO MENSAJE</span>
                <span className="text-[#00f2ff] font-bold">{config.lastMessage}</span>
              </div>
              <div className="bg-[#151d1e] p-3 rounded border border-[#3a494b]/40">
                <span className="text-[#849495] text-[10px] block mb-1">ÚLTIMA ORDEN</span>
                <span className="text-[#dce4e4] font-medium truncate block">
                  {config.lastCommand}
                </span>
              </div>
            </div>

            {/* Terminal Traffic Stream */}
            <div className="bg-[#080f10] border border-[#3a494b]/60 rounded-lg p-4 font-tech text-xs text-[#b9cacb] flex-1 min-h-[220px] overflow-y-auto space-y-2">
              {config.trafficLogs.map((log, i) => (
                <div key={i} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-[#00f2ff]/70">{'>'}</span>
                  <span className="text-[#dce4e4]">{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
