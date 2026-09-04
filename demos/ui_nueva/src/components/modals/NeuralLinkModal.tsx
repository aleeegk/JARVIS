import React, { useState, useEffect } from 'react';
import { playSound } from '../../utils/audio';

interface NeuralLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploySuccess: () => void;
}

export const NeuralLinkModal: React.FC<NeuralLinkModalProps> = ({
  isOpen,
  onClose,
  onDeploySuccess,
}) => {
  const [step, setStep] = useState<number>(1);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setStep(3);
          playSound('confirm');
          return 100;
        }
        if (p === 40) {
          setStep(2);
        }
        return p + 5;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel glass-panel-active rounded-xl p-6 md:p-8 w-full max-w-md relative overflow-hidden text-center space-y-6">
        <div className="scan-line-anim" />

        {/* Central Rotating Hologram */}
        <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 border-2 border-[#00f2ff] rounded-full animate-[spin_6s_linear_infinite] border-dashed" />
          <div className="absolute inset-2 border border-[#74f5ff]/60 rounded-full animate-[spin_4s_linear_infinite_reverse]" />
          <div className="w-16 h-16 rounded-full bg-[#00f2ff]/20 flex items-center justify-center text-[#00f2ff] shadow-[0_0_20px_#00f2ff]">
            <span className="material-symbols-outlined text-3xl">psychology</span>
          </div>
        </div>

        <div>
          <h2 className="font-headline font-bold text-xl text-[#00f2ff] tracking-wider uppercase">
            NEURAL LINK INTERFACE
          </h2>
          <p className="font-tech text-xs text-[#b9cacb] mt-1">
            {step === 1
              ? 'CALIBRANDO PROTOCOLOS SINÁPTICOS...'
              : step === 2
              ? 'SINCRONIZANDO CONTEXTO DE VECTOR STORE...'
              : 'ENLACE NEURAL ESTABLECIDO Y SEGURO'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 font-tech text-xs">
          <div className="flex justify-between text-[#849495]">
            <span>Progreso del Enlace:</span>
            <span className="text-[#00f2ff] font-bold">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-[#151d1e] rounded-full overflow-hidden border border-[#3a494b]/40">
            <div
              className="h-full bg-[#00f2ff] transition-all duration-150 shadow-[0_0_10px_#00f2ff]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Action button */}
        <div className="pt-2">
          {step === 3 ? (
            <button
              onClick={() => {
                playSound('confirm');
                onDeploySuccess();
                onClose();
              }}
              className="w-full bg-[#00f2ff] hover:bg-[#74f5ff] text-[#002022] font-tech text-xs font-bold tracking-widest py-3 rounded-lg shadow-[0_0_15px_rgba(0,242,255,0.4)] transition-all cursor-pointer"
            >
              ACCEDER A LA RED NEURAL
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2 border border-[#3a494b] hover:border-[#ffb4ab] text-[#b9cacb] hover:text-[#ffb4ab] rounded font-tech text-xs tracking-wider transition-colors cursor-pointer"
            >
              Cancelar Secuencia
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
