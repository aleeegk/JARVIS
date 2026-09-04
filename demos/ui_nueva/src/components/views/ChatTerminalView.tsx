import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../../types';
import { playSound } from '../../utils/audio';

interface ChatTerminalViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onConfirmAuth: (messageId: string) => void;
  onRejectAuth: (messageId: string) => void;
  isProcessing: boolean;
  activeModel: string;
}

export const ChatTerminalView: React.FC<ChatTerminalViewProps> = ({
  messages,
  onSendMessage,
  onConfirmAuth,
  onRejectAuth,
  isProcessing,
  activeModel,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    playSound('confirm');
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const quickPrompts = [
    'Estado del sistema y telemetría de Windows',
    'Ver archivos seleccionados en Explorador',
    'Listar ventanas y aplicaciones abiertas',
    'Capturar pantalla del escritorio',
  ];

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col relative space-y-4">
      {/* Header Panel */}
      <div className="glass-panel rounded-xl p-4 flex flex-wrap justify-between items-center relative overflow-hidden flex-shrink-0">
        <div className="scan-line-anim" />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#00f2ff]/10 border border-[#00f2ff]/30 flex items-center justify-center text-[#00f2ff]">
            <span className="material-symbols-outlined text-[20px] fill-1">terminal</span>
          </div>
          <div>
            <h1 className="font-headline text-lg font-bold text-[#dce4e4] tracking-wide">
              SESSION_TTY_01
            </h1>
            <p className="font-tech text-[10px] text-[#849495]">
              AI CONSOLE TERMINAL // MODEL: {activeModel}
            </p>
          </div>
        </div>

        {/* Side Status Widget */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#192122] px-3 py-1.5 rounded-lg border border-[#3a494b]/40 font-tech text-xs">
            <span className="w-2 h-2 rounded-full bg-[#00f2ff] shadow-[0_0_8px_#00f2ff] animate-pulse" />
            <span className="text-[#b9cacb]">Ollama:</span>
            <span className="text-[#00f2ff] font-medium">Estable</span>
          </div>
        </div>
      </div>

      {/* Messages Scroll Container */}
      <div className="flex-1 glass-panel rounded-xl p-4 md:p-6 overflow-y-auto space-y-6 flex flex-col">
        {messages.map((msg) => {
          if (msg.sender === 'user') {
            return (
              <div
                key={msg.id}
                className="flex flex-col items-end w-full max-w-2xl md:max-w-3xl self-end animate-[fadeIn_0.2s_ease-out]"
              >
                <div className="flex items-center gap-2 mb-1.5 font-tech text-xs text-[#849495]">
                  <span>USER // CMD</span>
                  <span className="material-symbols-outlined text-sm">person</span>
                  <span className="text-[10px] opacity-70">{msg.timestamp}</span>
                </div>
                <div className="bg-[#00f2ff]/12 border border-[#00f2ff]/40 text-[#74f5ff] p-4 rounded-xl rounded-tr-none shadow-[0_0_15px_rgba(0,242,255,0.1)] relative">
                  <p className="font-body text-sm md:text-base leading-relaxed whitespace-pre-wrap text-[#dce4e4]">
                    {msg.text}
                  </p>
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className="flex flex-col items-start w-full max-w-3xl md:max-w-4xl self-start animate-[fadeIn_0.2s_ease-out]"
            >
              <div className="flex items-center gap-2 mb-1.5 font-tech text-xs text-[#00f2ff]">
                <span className="material-symbols-outlined text-sm fill-1">smart_toy</span>
                <span>JARVIS // SYS</span>
                <span className="text-[#849495] text-[10px] ml-1">{msg.timestamp}</span>
              </div>

              <div className="bg-[#151d1e]/90 border border-[#3a494b]/50 text-[#dce4e4] p-5 rounded-xl rounded-tl-none w-full backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-4">
                <p className="font-body text-sm md:text-base leading-relaxed text-[#dce4e4] whitespace-pre-wrap">
                  {msg.text}
                </p>

                {/* Table Simulation (if provided) */}
                {msg.tableData && (
                  <div className="font-tech text-xs bg-[#080f10] p-3 rounded-lg border border-[#3a494b]/40 overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[450px]">
                      <thead>
                        <tr className="border-b border-[#3a494b]/60 text-[#00f2ff]">
                          {msg.tableData.headers.map((h, i) => (
                            <th key={i} className="py-2 pr-4 font-normal uppercase tracking-wider">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {msg.tableData.rows.map((r, i) => (
                          <tr key={i} className="border-b border-[#3a494b]/20 last:border-0">
                            <td className="py-2.5 pr-4 text-[#849495]">{r.time}</td>
                            <td className="py-2.5 pr-4">
                              <span className="text-[#ffb4ab] bg-[#93000a]/20 border border-[#ffb4ab]/30 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                {r.level}
                              </span>
                            </td>
                            <td className="py-2.5 pr-4 text-[#dce4e4]">{r.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* File List */}
                {msg.fileList && msg.fileList.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <p className="font-body text-xs text-[#b9cacb]">
                      Archivos identificados para la operación:
                    </p>
                    <ul className="list-disc list-inside font-tech text-xs text-[#849495] space-y-1">
                      {msg.fileList.map((f, i) => (
                        <li key={i}>
                          <code className="text-[#ffb869] bg-[#192122] px-1.5 py-0.5 rounded">
                            {f.path}
                          </code>{' '}
                          <span className="text-[#849495]">({f.size})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Authorization Box */}
                {msg.requiresAuth && (
                  <div className="bg-[#fe9d00]/10 border border-[#fe9d00]/40 p-4 rounded-lg mt-3">
                    <p className="font-tech text-xs text-[#fe9d00] font-semibold mb-2 flex items-center gap-2 tracking-wide">
                      <span className="material-symbols-outlined text-sm">warning</span>
                      REQUIERE AUTORIZACIÓN PARA PROCEDER
                    </p>
                    <p className="font-body text-xs text-[#b9cacb] mb-4">
                      ¿Confirma la eliminación permanente de los archivos temporales listados?
                    </p>

                    {msg.authConfirmed ? (
                      <div className="bg-[#00f2ff]/10 border border-[#00f2ff] text-[#00f2ff] p-2.5 rounded font-tech text-xs flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span>EJECUCIÓN CONFIRMADA // TAREAS COMPLETADAS EXITOSAMENTE</span>
                      </div>
                    ) : msg.authRejected ? (
                      <div className="bg-[#ffb4ab]/10 border border-[#ffb4ab] text-[#ffb4ab] p-2.5 rounded font-tech text-xs flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">cancel</span>
                        <span>OPERACIÓN ABORTADA POR EL USUARIO</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => {
                            playSound('confirm');
                            onConfirmAuth(msg.id);
                          }}
                          className="bg-[#00f2ff]/15 hover:bg-[#00f2ff]/30 text-[#00f2ff] border border-[#00f2ff] font-tech text-xs font-semibold px-4 py-2 rounded flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_10px_rgba(0,242,255,0.2)]"
                        >
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          CONFIRMAR EJECUCIÓN
                        </button>
                        <button
                          onClick={() => {
                            playSound('warn');
                            onRejectAuth(msg.id);
                          }}
                          className="bg-[#ffb4ab]/10 hover:bg-[#ffb4ab]/20 text-[#ffb4ab] border border-[#ffb4ab]/50 font-tech text-xs font-semibold px-4 py-2 rounded flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">cancel</span>
                          ABORTAR
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex flex-col items-start w-full max-w-md self-start animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-center gap-2 mb-1 font-tech text-xs text-[#00f2ff]">
              <span className="material-symbols-outlined text-sm fill-1">smart_toy</span>
              <span>JARVIS // SYS</span>
            </div>
            <div className="glass-panel p-3.5 rounded-xl rounded-tl-none flex items-center gap-3">
              <div className="flex items-center gap-1 h-4">
                <span className="wave-bar" style={{ animationDelay: '0s' }} />
                <span className="wave-bar" style={{ animationDelay: '0.15s' }} />
                <span className="wave-bar" style={{ animationDelay: '0.3s' }} />
                <span className="wave-bar" style={{ animationDelay: '0.45s' }} />
                <span className="wave-bar" style={{ animationDelay: '0.6s' }} />
              </div>
              <span className="font-tech text-xs text-[#00f2ff] tracking-wider font-semibold animate-pulse">
                PROCESANDO_CONSULTA...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="font-tech text-[11px] text-[#849495] uppercase tracking-wider whitespace-nowrap">
          Sugerencias:
        </span>
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => {
              playSound('click');
              setInputText(prompt);
            }}
            className="whitespace-nowrap px-3 py-1 bg-[#151d1e] hover:bg-[#00f2ff]/15 text-[#b9cacb] hover:text-[#00f2ff] border border-[#3a494b]/60 hover:border-[#00f2ff]/50 rounded-full font-tech text-xs transition-colors cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="glass-panel rounded-xl p-3 md:p-4 flex-shrink-0 relative">
        <form onSubmit={handleSubmit} className="relative rounded-lg group">
          <div className="absolute left-3.5 top-3.5 text-[#00f2ff]/70 group-focus-within:text-[#00f2ff] transition-colors">
            <span className="material-symbols-outlined text-lg">terminal</span>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            rows={2}
            placeholder="INGRESAR COMANDO O CONSULTA // PREGUNTA CUALQUIER TAREA..."
            className="w-full bg-[#151d1e]/80 border border-[#3a494b]/60 focus:border-[#00f2ff] text-[#dce4e4] font-tech text-xs md:text-sm rounded-lg pl-11 pr-24 py-3 focus:outline-none focus:ring-1 focus:ring-[#00f2ff] resize-none placeholder:text-[#849495]/40"
          />

          <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                playSound('beep');
                setInputText('Analizar archivo seleccionado en Explorer');
              }}
              title="Adjuntar archivo"
              className="p-1.5 text-[#849495] hover:text-[#00f2ff] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">attach_file</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playSound('beep');
                setInputText('Estado del sistema');
              }}
              title="Dictado por voz"
              className="p-1.5 text-[#849495] hover:text-[#00f2ff] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">mic</span>
            </button>

            <button
              type="submit"
              disabled={!inputText.trim() || isProcessing}
              className="bg-[#00f2ff] hover:bg-[#74f5ff] disabled:opacity-40 disabled:hover:bg-[#00f2ff] text-[#002022] p-2 rounded-lg transition-all flex items-center justify-center shadow-[0_0_10px_rgba(0,242,255,0.3)] cursor-pointer"
            >
              <span className="material-symbols-outlined text-base font-bold fill-1">send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
