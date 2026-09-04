import React, { useState } from 'react';
import { playSound } from '../../utils/audio';

interface LockScreenModalProps {
  isLocked: boolean;
  onUnlock: () => void;
}

export const LockScreenModal: React.FC<LockScreenModalProps> = ({ isLocked, onUnlock }) => {
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isLocked) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === '1234' || passcode.trim().toLowerCase() === 'jarvis' || passcode.trim() === '') {
      playSound('confirm');
      onUnlock();
      setPasscode('');
      setErrorMsg('');
    } else {
      playSound('error');
      setErrorMsg('PIN INCORRECTO // PRUEBA CON 1234 O JARVIS');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#05070a]/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-4">
      <div className="glass-panel glass-panel-active rounded-2xl p-8 max-w-sm w-full text-center space-y-6 relative overflow-hidden">
        <div className="scan-line-anim" />

        {/* User profile */}
        <div className="relative w-20 h-20 mx-auto rounded-full border-2 border-[#00f2ff] overflow-hidden shadow-[0_0_20px_#00f2ff]">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAY0vvKy5UsEnIGqpVrpJl8GZHTRzq2skP5UriF5ZgxQN8chI1IU4WWIYy7Tr7ZplO4_p5gq_M1TXiCVgv_mHLYembU0dRp2hU-x8GfxwCzah_a68HjRnsqVaigfw_6NCno-zWE6d7o5whsPrnncOCVMbhIXoAMX_xTTCEmzd33ykQyetaOjEXhvJIyhsi11yDIacKg4MlOYw_-DSDxSbNRD6je4y1Amyfs5G7kbUfCySA7qwX3kHNvIQ"
            alt="Alejandro"
            className="w-full h-full object-cover"
          />
        </div>

        <div>
          <h2 className="font-headline font-bold text-xl text-[#00f2ff]">TERMINAL BLOQUEADA</h2>
          <p className="font-tech text-xs text-[#849495] mt-1">ALEJANDRO // NIVEL 4 CLEARANCE</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              autoFocus
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setErrorMsg('');
              }}
              placeholder="Ingresa PIN (ej. 1234)..."
              className="w-full bg-[#151d1e] border border-[#3a494b] focus:border-[#00f2ff] text-center font-tech text-base tracking-widest text-[#00f2ff] rounded-lg py-2.5 px-4 focus:outline-none focus:ring-1 focus:ring-[#00f2ff]"
            />
          </div>

          {errorMsg && (
            <p className="font-tech text-xs text-[#ffb4ab] animate-pulse">{errorMsg}</p>
          )}

          <button
            type="submit"
            className="w-full bg-[#00f2ff] hover:bg-[#74f5ff] text-[#002022] font-tech text-xs font-bold tracking-widest py-3 rounded-lg shadow-[0_0_15px_rgba(0,242,255,0.4)] transition-all cursor-pointer"
          >
            DESBLOQUEAR SISTEMA
          </button>
        </form>
      </div>
    </div>
  );
};
