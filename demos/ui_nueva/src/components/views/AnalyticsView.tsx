import React from 'react';
import { TelemetryData } from '../../types';
import { playSound } from '../../utils/audio';

interface AnalyticsViewProps {
  telemetry: TelemetryData;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ telemetry }) => {
  const chartData = [
    { time: '08:00', cpu: 18, gpu: 24, ram: 42, tokens: 45 },
    { time: '08:05', cpu: 22, gpu: 30, ram: 43, tokens: 62 },
    { time: '08:10', cpu: 35, gpu: 45, ram: 45, tokens: 88 },
    { time: '08:15', cpu: 28, gpu: 32, ram: 44, tokens: 54 },
    { time: '08:20', cpu: 19, gpu: 25, ram: 42, tokens: 71 },
    { time: '08:25', cpu: 25, gpu: 33, ram: 43, tokens: 65 },
    { time: '08:30', cpu: telemetry.cpu, gpu: telemetry.gpu, ram: telemetry.ram, tokens: telemetry.tokensPerSec },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="glass-panel p-6 rounded-xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="scan-line-anim" />
        <div>
          <h1 className="font-headline text-2xl md:text-3xl font-bold text-[#00f2ff] tracking-tight">
            TELEMETRÍA & RENDIMIENTO
          </h1>
          <p className="font-body text-sm text-[#b9cacb] mt-1">
            Métricas de aceleración de hardware, rendimiento de inferencia y consumo de recursos.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#00f2ff]/10 border border-[#00f2ff]/30 px-3 py-1.5 rounded font-tech text-xs text-[#00f2ff]">
          <span className="w-2 h-2 rounded-full bg-[#00f2ff] animate-ping" />
          <span>VELOCIDAD: {telemetry.tokensPerSec} TOKENS/SEC</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl">
          <div className="text-[#849495] font-tech text-xs uppercase mb-1">Inference Latency</div>
          <div className="font-headline font-bold text-2xl text-[#00f2ff]">
            {telemetry.latencyMs} <span className="text-sm font-normal text-[#b9cacb]">ms</span>
          </div>
          <div className="text-[11px] font-tech text-[#74f5ff] mt-1">Óptimo (P99 &lt; 25ms)</div>
        </div>

        <div className="glass-panel p-4 rounded-xl">
          <div className="text-[#849495] font-tech text-xs uppercase mb-1">Core Temp</div>
          <div className="font-headline font-bold text-2xl text-[#fe9d00]">
            {telemetry.temp}° <span className="text-sm font-normal text-[#b9cacb]">Celsius</span>
          </div>
          <div className="text-[11px] font-tech text-[#849495] mt-1">Fan RPM: 1,420</div>
        </div>

        <div className="glass-panel p-4 rounded-xl">
          <div className="text-[#849495] font-tech text-xs uppercase mb-1">VRAM Allocation</div>
          <div className="font-headline font-bold text-2xl text-[#dce4e4]">
            4.8 <span className="text-sm font-normal text-[#b9cacb]">/ 16 GB</span>
          </div>
          <div className="text-[11px] font-tech text-[#00f2ff] mt-1">{Math.round(telemetry.vram)}% Ocupada</div>
        </div>

        <div className="glass-panel p-4 rounded-xl">
          <div className="text-[#849495] font-tech text-xs uppercase mb-1">Security Health</div>
          <div className="font-headline font-bold text-2xl text-[#00f2ff]">100%</div>
          <div className="text-[11px] font-tech text-[#74f5ff] mt-1">0 Amenazas detectadas</div>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource Trend Chart */}
        <div className="glass-panel p-6 rounded-xl space-y-4">
          <div className="flex justify-between items-center border-b border-[#3a494b]/40 pb-3">
            <h3 className="font-tech text-xs text-[#00f2ff] tracking-wider uppercase font-bold">
              HISTORIAL DE CARGA DE PROCESAMIENTO (CPU vs GPU)
            </h3>
            <span className="font-tech text-[10px] text-[#849495]">ÚLTIMOS 30 MIN</span>
          </div>

          <div className="h-60 flex items-end justify-between gap-3 pt-6 px-2">
            {chartData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1 h-44">
                  {/* CPU bar */}
                  <div
                    style={{ height: `${d.cpu * 2.2}px` }}
                    className="w-1/2 max-w-[18px] bg-[#00f2ff] rounded-t transition-all duration-300 shadow-[0_0_6px_#00f2ff]"
                    title={`CPU: ${d.cpu}%`}
                  />
                  {/* GPU bar */}
                  <div
                    style={{ height: `${d.gpu * 2.2}px` }}
                    className="w-1/2 max-w-[18px] bg-[#fe9d00] rounded-t transition-all duration-300 shadow-[0_0_6px_#fe9d00]"
                    title={`GPU: ${d.gpu}%`}
                  />
                </div>
                <span className="font-tech text-[10px] text-[#849495]">{d.time}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-6 font-tech text-xs pt-2 border-t border-[#3a494b]/20">
            <span className="flex items-center gap-1.5 text-[#00f2ff]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#00f2ff]" /> CPU (%)
            </span>
            <span className="flex items-center gap-1.5 text-[#fe9d00]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#fe9d00]" /> GPU (%)
            </span>
          </div>
        </div>

        {/* Token Velocity Chart */}
        <div className="glass-panel p-6 rounded-xl space-y-4">
          <div className="flex justify-between items-center border-b border-[#3a494b]/40 pb-3">
            <h3 className="font-tech text-xs text-[#00f2ff] tracking-wider uppercase font-bold">
              RENDIMIENTO DE TOKENS POR SEGUNDO
            </h3>
            <span className="font-tech text-[10px] text-[#849495]">INFERENCIA LOCAL</span>
          </div>

          <div className="h-60 flex items-end justify-between gap-3 pt-6 px-2">
            {chartData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full flex items-end justify-center h-44">
                  <div
                    style={{ height: `${d.tokens * 1.8}px` }}
                    className="w-full max-w-[28px] bg-gradient-to-t from-[#00f2ff]/40 to-[#00f2ff] rounded-t transition-all duration-300 shadow-[0_0_8px_#00f2ff]"
                    title={`${d.tokens} t/s`}
                  />
                </div>
                <span className="font-tech text-[10px] text-[#849495]">{d.time}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-6 font-tech text-xs pt-2 border-t border-[#3a494b]/20">
            <span className="flex items-center gap-1.5 text-[#00f2ff]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#00f2ff]" /> Velocidad Promedio (~65 t/s)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
