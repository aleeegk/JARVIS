import React from 'react';
import { playSound } from '../../utils/audio';

interface ErrorDiagnosticsModalProps {
  isAccessDeniedOpen: boolean;
  onCloseAccessDenied: () => void;
  onRequestSudo: () => void;
  isOllamaOffline: boolean;
  onReconnectOllama: () => void;
}

export const ErrorDiagnosticsModal: React.FC<ErrorDiagnosticsModalProps> = ({
  isAccessDeniedOpen,
  onCloseAccessDenied,
  onRequestSudo,
  isOllamaOffline,
  onReconnectOllama,
}) => {
  return (
    <>
      {/* Access Denied Modal (Image 10) */}
      {isAccessDeniedOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel glass-panel-danger rounded-xl p-6 md:p-8 w-full max-w-lg relative overflow-hidden space-y-5 animate-[fadeIn_0.2s_ease-out]">
            {/* Top red header */}
            <div className="flex items-center gap-3 border-b border-[#ffb4ab]/30 pb-4">
              <div className="w-10 h-10 rounded-lg bg-[#93000a]/30 border border-[#ffb4ab]/50 flex items-center justify-center text-[#ffb4ab]">
                <span className="material-symbols-outlined text-2xl">gpp_bad</span>
              </div>
              <div>
                <h2 className="font-headline font-bold text-lg text-[#ffb4ab] tracking-wide">
                  ACCESO DENEGADO // ERROR 0x80070005
                </h2>
                <p className="font-tech text-xs text-[#ffb4ab]/80">
                  SECURITY POLICY ENFORCEMENT // NIVEL 4 RESTRICTED
                </p>
              </div>
            </div>

            <p className="font-body text-xs md:text-sm text-[#dce4e4] leading-relaxed">
              No tienes permisos suficientes para ejecutar la acción solicitada sobre el recurso
              restringido del sistema operativo:
            </p>

            <div className="bg-[#080f10] border border-[#ffb4ab]/30 rounded-lg p-3 font-tech text-xs text-[#ffb4ab] space-y-1">
              <div>
                <span className="text-[#849495]">Recurso:</span>{' '}
                <code className="text-[#ffb4ab]">/etc/shadow/root_credentials.key</code>
              </div>
              <div>
                <span className="text-[#849495]">Excepción:</span>{' '}
                <span>PermissionDenied (EACCES: permission denied, open)</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  playSound('click');
                  onCloseAccessDenied();
                }}
                className="px-4 py-2 border border-[#3a494b] text-[#b9cacb] hover:text-[#dce4e4] rounded font-tech text-xs cursor-pointer"
              >
                Cerrar Notificación
              </button>

              <button
                onClick={() => {
                  playSound('confirm');
                  onRequestSudo();
                }}
                className="px-5 py-2 bg-[#93000a] hover:bg-[#ff5449] text-white rounded font-tech text-xs font-bold tracking-wider shadow-[0_0_15px_rgba(147,0,10,0.5)] transition-all cursor-pointer active:scale-95"
              >
                Solicitar Elevación (sudo)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ollama Offline Floating Banner (Image 13) */}
      {isOllamaOffline && (
        <div className="fixed top-20 right-4 md:right-8 z-50 max-w-md w-full animate-[slideIn_0.3s_ease-out]">
          <div className="glass-panel border border-[#fe9d00]/60 bg-[#151d1e]/95 p-4 rounded-xl shadow-[0_0_20px_rgba(254,157,0,0.25)] flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded bg-[#fe9d00]/20 border border-[#fe9d00]/40 flex items-center justify-center text-[#fe9d00] flex-shrink-0">
                <span className="material-symbols-outlined text-lg animate-pulse">cloud_off</span>
              </div>
              <div>
                <h4 className="font-headline font-bold text-xs text-[#fe9d00] tracking-wide uppercase">
                  OLLAMA DESCONECTADO
                </h4>
                <p className="font-body text-xs text-[#b9cacb] mt-0.5 leading-relaxed">
                  No se puede establecer conexión con el socket{' '}
                  <code className="text-[#fe9d00]">http://localhost:11434</code>. Reintentando
                  enlace...
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                playSound('confirm');
                onReconnectOllama();
              }}
              className="text-[#fe9d00] hover:underline font-tech text-xs flex-shrink-0 cursor-pointer"
            >
              Reconectar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
