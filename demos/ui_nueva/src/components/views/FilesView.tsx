import React, { useState } from 'react';
import { VirtualFile } from '../../types';
import { playSound } from '../../utils/audio';

interface FilesViewProps {
  files: VirtualFile[];
  onOpenFile: (file: VirtualFile) => void;
  onDeleteFile: (fileId: string) => void;
  currentFolder?: string;
  onChangeFolder?: (folder: string) => void;
  onDetectExplorerSelection?: () => Promise<string[]>;
  onAskAboutFiles?: (paths: string[]) => void;
}

export const FilesView: React.FC<FilesViewProps> = ({
  files,
  onOpenFile,
  onDeleteFile,
  currentFolder = 'project',
  onChangeFolder,
  onDetectExplorerSelection,
  onAskAboutFiles,
}) => {
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<VirtualFile | null>(null);
  const [detectedPaths, setDetectedPaths] = useState<string[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);

  const handleDetectSelection = async () => {
    playSound('scan');
    setIsDetecting(true);
    if (onDetectExplorerSelection) {
      const paths = await onDetectExplorerSelection();
      setDetectedPaths(paths || []);
      playSound('confirm');
    }
    setIsDetecting(false);
  };

  const filtered = files.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.path.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="glass-panel p-6 rounded-xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="scan-line-anim" />
        <div>
          <h1 className="font-headline text-2xl md:text-3xl font-bold text-[#00f2ff] tracking-tight">
            EXPLORADOR DE ARCHIVOS
          </h1>
          <p className="font-body text-sm text-[#b9cacb] mt-1">
            Archivos reales del sistema de archivos Windows y captura en vivo del Explorador vía pywinselect.
          </p>
        </div>

        <div className="flex items-center gap-2 font-tech text-xs bg-[#151d1e] px-3 py-1.5 rounded border border-[#3a494b]/60">
          <span className="text-[#849495]">ESTADO:</span>
          <span className="text-[#00f2ff] font-bold">CONECTADO // NATIVO WINDOWS</span>
        </div>
      </div>

      {/* Real Folder Selector & PyWinSelect Detection Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0c1214] p-3 rounded-lg border border-[#3a494b]/50">
        <div className="flex items-center gap-2">
          <span className="font-tech text-xs text-[#849495]">DIRECTORIO:</span>
          <button
            onClick={() => onChangeFolder && onChangeFolder('project')}
            className={`px-3 py-1.5 rounded font-tech text-xs cursor-pointer transition-all ${
              currentFolder === 'project'
                ? 'bg-[#00f2ff] text-[#002022] font-bold shadow-[0_0_10px_rgba(0,242,255,0.4)]'
                : 'bg-[#151d1e] text-[#b9cacb] hover:text-[#00f2ff] border border-[#3a494b]/40'
            }`}
          >
            PROYECTO JARVIS
          </button>
          <button
            onClick={() => onChangeFolder && onChangeFolder('downloads')}
            className={`px-3 py-1.5 rounded font-tech text-xs cursor-pointer transition-all ${
              currentFolder === 'downloads'
                ? 'bg-[#00f2ff] text-[#002022] font-bold shadow-[0_0_10px_rgba(0,242,255,0.4)]'
                : 'bg-[#151d1e] text-[#b9cacb] hover:text-[#00f2ff] border border-[#3a494b]/40'
            }`}
          >
            DESCARGAS
          </button>
          <button
            onClick={() => onChangeFolder && onChangeFolder('documents')}
            className={`px-3 py-1.5 rounded font-tech text-xs cursor-pointer transition-all ${
              currentFolder === 'documents'
                ? 'bg-[#00f2ff] text-[#002022] font-bold shadow-[0_0_10px_rgba(0,242,255,0.4)]'
                : 'bg-[#151d1e] text-[#b9cacb] hover:text-[#00f2ff] border border-[#3a494b]/40'
            }`}
          >
            DOCUMENTOS
          </button>
        </div>

        <button
          onClick={handleDetectSelection}
          disabled={isDetecting}
          className="bg-[#00f2ff]/15 hover:bg-[#00f2ff]/25 border border-[#00f2ff]/60 text-[#00f2ff] px-3.5 py-1.5 rounded font-tech text-xs font-bold flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50 shadow-[0_0_12px_rgba(0,242,255,0.2)]"
        >
          <span className={`material-symbols-outlined text-[16px] ${isDetecting ? 'animate-spin' : ''}`}>
            touch_app
          </span>
          <span>{isDetecting ? 'DETECTANDO...' : 'DETECTAR SELECCIÓN EN EXPLORER (pywinselect)'}</span>
        </button>
      </div>

      {/* Banner de archivos seleccionados con pywinselect */}
      {detectedPaths.length > 0 && (
        <div className="bg-[#00f2ff]/10 border border-[#00f2ff]/50 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 animate-fade-in">
          <div className="space-y-1">
            <div className="font-tech text-xs text-[#00f2ff] font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>{detectedPaths.length} ARCHIVO(S) SELECCIONADO(S) EN WINDOWS EXPLORER:</span>
            </div>
            <ul className="text-xs font-mono text-[#dce4e4] space-y-0.5 max-h-24 overflow-y-auto">
              {detectedPaths.map((p, idx) => (
                <li key={idx} className="truncate">• {p}</li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => onAskAboutFiles && onAskAboutFiles(detectedPaths)}
            className="bg-[#00f2ff] hover:bg-[#74f5ff] text-[#002022] font-tech text-xs font-bold px-3.5 py-2 rounded cursor-pointer whitespace-nowrap shadow-[0_0_12px_rgba(0,242,255,0.4)]"
          >
            PROCESAR CON JARVIS ⚡
          </button>
        </div>
      )}

      {/* Search and stats */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#849495] text-sm">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por ruta o nombre de archivo..."
            className="w-full bg-[#151d1e]/80 border border-[#3a494b]/60 focus:border-[#00f2ff] text-[#dce4e4] font-tech text-xs pl-9 pr-4 py-2.5 rounded-lg focus:outline-none placeholder:text-[#849495]/50"
          />
        </div>

        <div className="font-tech text-xs text-[#849495] flex items-center gap-3">
          <span>Archivos en vista: {filtered.length}</span>
          <span>•</span>
          <span className="text-[#00f2ff]">Explorador Conectado</span>
        </div>
      </div>

      {/* Files Table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-tech text-xs min-w-[650px]">
            <thead>
              <tr className="border-b border-[#3a494b]/60 bg-[#080f10]/80 text-[#00f2ff] uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Nombre / Ruta</th>
                <th className="py-3 px-4">Tamaño</th>
                <th className="py-3 px-4">Clearance</th>
                <th className="py-3 px-4">Cifrado</th>
                <th className="py-3 px-4">Modificado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((file) => (
                <tr
                  key={file.id}
                  onClick={() => {
                    playSound('click');
                    setSelectedFile(file);
                  }}
                  className="border-b border-[#3a494b]/20 hover:bg-[#00f2ff]/5 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-lg text-[#00f2ff]">
                        {file.type === 'folder'
                          ? 'folder'
                          : file.type === 'archive'
                          ? 'folder_zip'
                          : file.type === 'log'
                          ? 'description'
                          : 'article'}
                      </span>
                      <div>
                        <span className="font-medium text-[#dce4e4] block">{file.name}</span>
                        <span className="text-[#849495] text-[10px]">{file.path}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#b9cacb]">{file.size}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        file.clearance.includes('RESTRICTED')
                          ? 'bg-[#93000a]/20 text-[#ffb4ab] border border-[#ffb4ab]/30'
                          : 'bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/30'
                      }`}
                    >
                      {file.clearance}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {file.encrypted ? (
                      <span className="text-[#74f5ff] flex items-center gap-1 text-[11px]">
                        <span className="material-symbols-outlined text-xs">lock</span> AES-256
                      </span>
                    ) : (
                      <span className="text-[#849495] text-[11px]">Plano</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[#849495] text-[11px]">{file.modified}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playSound('click');
                          onOpenFile(file);
                        }}
                        title="Ver contenido"
                        className="p-1 text-[#849495] hover:text-[#00f2ff] transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playSound('warn');
                          onDeleteFile(file.id);
                        }}
                        title="Eliminar archivo"
                        className="p-1 text-[#849495] hover:text-[#ffb4ab] transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* File Detail Modal */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel glass-panel-active rounded-xl p-6 w-full max-w-lg relative space-y-4">
            <div className="flex justify-between items-center border-b border-[#3a494b]/40 pb-3">
              <h3 className="font-headline font-bold text-lg text-[#00f2ff] flex items-center gap-2">
                <span className="material-symbols-outlined">description</span>
                {selectedFile.name}
              </h3>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-[#849495] hover:text-[#ffb4ab] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="bg-[#080f10] p-4 rounded-lg border border-[#3a494b]/40 font-tech text-xs space-y-2">
              <div>
                <span className="text-[#849495]">Ruta absoluta:</span>{' '}
                <span className="text-[#00f2ff]">{selectedFile.path}</span>
              </div>
              <div>
                <span className="text-[#849495]">Tamaño:</span>{' '}
                <span className="text-[#dce4e4]">{selectedFile.size}</span>
              </div>
              <div>
                <span className="text-[#849495]">Nivel de Acceso:</span>{' '}
                <span className="text-[#ffb4ab]">{selectedFile.clearance}</span>
              </div>
              <div>
                <span className="text-[#849495]">Última modificación:</span>{' '}
                <span className="text-[#dce4e4]">{selectedFile.modified}</span>
              </div>
            </div>

            <div className="bg-[#151d1e] p-3 rounded font-mono text-[11px] text-[#74f5ff] max-h-40 overflow-y-auto leading-relaxed border border-[#3a494b]/30">
              # DUMP LOG FILE PREVIEW [RESTRICTED]
              <br />
              2026-08-31 08:34:12 [INFO] Connection initialized from local daemon.
              <br />
              2026-08-31 08:34:13 [SYS] Memory buffers synchronized. 0 errors reported.
              <br />
              2026-08-31 08:34:14 [SUCCESS] Hash SHA-256 verified successfully.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedFile(null)}
                className="px-4 py-2 bg-[#00f2ff] hover:bg-[#74f5ff] text-[#002022] font-tech text-xs font-bold rounded cursor-pointer"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
