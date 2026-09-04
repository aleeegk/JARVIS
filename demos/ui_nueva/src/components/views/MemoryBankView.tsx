import React, { useState } from 'react';
import { MemoryItem } from '../../types';
import { playSound } from '../../utils/audio';

interface MemoryBankViewProps {
  memoryItems: MemoryItem[];
  onAddMemory: (item: Omit<MemoryItem, 'id' | 'hexId' | 'updatedAt'>) => void;
  onUpdateMemory: (id: string, updated: Partial<MemoryItem>) => void;
  onDeleteMemory: (id: string) => void;
}

export const MemoryBankView: React.FC<MemoryBankViewProps> = ({
  memoryItems,
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MemoryItem | null>(null);
  const [purgeConfirmItem, setPurgeConfirmItem] = useState<MemoryItem | null>(null);

  // Form states for Add / Edit
  const [formCategory, setFormCategory] = useState<MemoryItem['category']>('USER_PREF');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTags, setFormTags] = useState('');

  const categories = [
    { id: 'ALL', label: 'ALL' },
    { id: 'USER_PREF', label: 'USER_PREF' },
    { id: 'PROJECT', label: 'PROJECT' },
    { id: 'CONTEXT', label: 'CONTEXT' },
    { id: 'SYSTEM_RULE', label: 'SYSTEM_RULE' },
  ];

  const filteredItems = memoryItems.filter((item) => {
    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleOpenAdd = () => {
    playSound('click');
    setFormCategory('USER_PREF');
    setFormTitle('');
    setFormDescription('');
    setFormTags('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: MemoryItem) => {
    playSound('click');
    setEditingItem(item);
    setFormCategory(item.category);
    setFormTitle(item.title);
    setFormDescription(item.description);
    setFormTags(item.tags.join(', '));
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    playSound('confirm');

    const parsedTags = formTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    if (editingItem) {
      onUpdateMemory(editingItem.id, {
        category: formCategory,
        title: formTitle.trim(),
        description: formDescription.trim(),
        tags: parsedTags,
      });
      setEditingItem(null);
    } else {
      onAddMemory({
        category: formCategory,
        title: formTitle.trim(),
        description: formDescription.trim(),
        tags: parsedTags.length > 0 ? parsedTags : ['#general'],
      });
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="glass-panel p-6 rounded-xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="scan-line-anim" />
        <div>
          <h1 className="font-headline text-2xl md:text-3xl font-bold text-[#00f2ff] tracking-tight">
            BANCO DE MEMORIA
          </h1>
          <p className="font-body text-sm text-[#b9cacb] mt-1">
            Registros persistentes del contexto de usuario, preferencias y directivas del sistema.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-[#00f2ff] hover:bg-[#74f5ff] text-[#002022] font-tech text-xs font-bold tracking-wider px-4 py-2.5 rounded transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,242,255,0.3)] cursor-pointer active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>+ AGREGAR ENTRADA</span>
        </button>
      </div>

      {/* Memory Allocation Status Card */}
      <div className="glass-panel rounded-xl p-5">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3 font-tech text-xs">
          <div className="flex items-center gap-2 text-[#dce4e4]">
            <span className="material-symbols-outlined text-[#00f2ff]">sd_card</span>
            <span>ASIGNACIÓN DE MEMORIA LOCAL (VECTOR STORE)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#849495]">
              Usado: <strong className="text-[#00f2ff]">124 MB</strong> / 1.0 GB
            </span>
            <span className="px-2 py-0.5 rounded bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/30 text-[10px] font-bold">
              ESTADO: ÓPTIMO
            </span>
          </div>
        </div>

        <div className="w-full h-2 bg-[#151d1e] rounded-full overflow-hidden border border-[#3a494b]/40">
          <div
            className="h-full bg-gradient-to-r from-[#00f2ff] to-[#74f5ff] shadow-[0_0_8px_#00f2ff]"
            style={{ width: '12.4%' }}
          />
        </div>
      </div>

      {/* Controls: Search & Category Tabs */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#849495] text-sm">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar en memoria por título, clave o #tag..."
            className="w-full bg-[#151d1e]/80 border border-[#3a494b]/60 focus:border-[#00f2ff] text-[#dce4e4] font-tech text-xs pl-9 pr-4 py-2.5 rounded-lg focus:outline-none placeholder:text-[#849495]/50"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => {
            const count =
              cat.id === 'ALL'
                ? memoryItems.length
                : memoryItems.filter((m) => m.category === cat.id).length;
            const isActive = categoryFilter === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  playSound('click');
                  setCategoryFilter(cat.id);
                }}
                className={`px-3 py-1.5 rounded-lg font-tech text-xs whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff] shadow-[0_0_10px_rgba(0,242,255,0.2)] font-semibold'
                    : 'bg-[#151d1e] text-[#b9cacb] border border-[#3a494b]/40 hover:border-[#00f2ff]/40 hover:text-[#dce4e4]'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Memory Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-2 glass-panel p-12 text-center rounded-xl text-[#849495] font-tech text-xs">
            No se encontraron registros de memoria con el filtro seleccionado.
          </div>
        ) : (
          filteredItems.map((item) => {
            let catBadgeStyle = 'text-[#00f2ff] bg-[#00f2ff]/10 border-[#00f2ff]/30';
            if (item.category === 'PROJECT') {
              catBadgeStyle = 'text-[#ffb869] bg-[#ffb869]/10 border-[#ffb869]/30';
            } else if (item.category === 'SYSTEM_RULE') {
              catBadgeStyle = 'text-[#ddb7ff] bg-[#ddb7ff]/10 border-[#ddb7ff]/30';
            } else if (item.category === 'CONTEXT') {
              catBadgeStyle = 'text-[#74f5ff] bg-[#74f5ff]/10 border-[#74f5ff]/30';
            }

            return (
              <div
                key={item.id}
                className="glass-panel p-5 rounded-xl flex flex-col justify-between gap-3 hover:glass-panel-active transition-all group"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex items-center gap-2 font-tech text-xs">
                      <span className="text-[#849495] bg-[#080f10] px-1.5 py-0.5 rounded border border-[#3a494b]/40">
                        {item.hexId}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded border font-bold text-[10px] ${catBadgeStyle}`}
                      >
                        {item.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        title="Editar entrada"
                        className="p-1 text-[#849495] hover:text-[#00f2ff] transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button
                        onClick={() => {
                          playSound('warn');
                          setPurgeConfirmItem(item);
                        }}
                        title="Confirm Purge"
                        className="p-1 text-[#849495] hover:text-[#ffb4ab] transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>

                  <h3 className="font-headline font-bold text-sm md:text-base text-[#dce4e4] group-hover:text-[#00f2ff] transition-colors mb-1.5">
                    {item.title}
                  </h3>

                  <p className="font-body text-xs text-[#b9cacb] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#3a494b]/30 flex justify-between items-center font-tech text-[11px]">
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[#00f2ff]/80 bg-[#00f2ff]/5 px-1.5 py-0.5 rounded text-[10px]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <span className="text-[#849495] text-[10px] whitespace-nowrap ml-2">
                    {item.updatedAt}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add or Edit Memory */}
      {(isAddModalOpen || editingItem) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel glass-panel-active rounded-xl p-6 w-full max-w-lg relative">
            <div className="flex justify-between items-center border-b border-[#3a494b]/40 pb-3 mb-4">
              <h2 className="font-headline font-bold text-lg text-[#00f2ff] flex items-center gap-2">
                <span className="material-symbols-outlined">memory</span>
                {editingItem ? 'EDITAR REGISTRO DE MEMORIA' : 'NUEVO REGISTRO DE MEMORIA'}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingItem(null);
                }}
                className="text-[#849495] hover:text-[#ffb4ab] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-4">
              <div>
                <label className="block font-tech text-xs text-[#b9cacb] mb-1">Categoría</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as MemoryItem['category'])}
                  className="w-full bg-[#151d1e] border border-[#3a494b] focus:border-[#00f2ff] text-[#dce4e4] font-tech text-xs rounded p-2.5 focus:outline-none"
                >
                  <option value="USER_PREF">USER_PREF (Preferencia de Usuario)</option>
                  <option value="PROJECT">PROJECT (Directorio / Entorno de Proyecto)</option>
                  <option value="CONTEXT">CONTEXT (Contexto de Conversación Persistente)</option>
                  <option value="SYSTEM_RULE">SYSTEM_RULE (Regla de Comportamiento)</option>
                </select>
              </div>

              <div>
                <label className="block font-tech text-xs text-[#b9cacb] mb-1">Título</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ej: Preferencias de compilación para Rust"
                  className="w-full bg-[#151d1e] border border-[#3a494b] focus:border-[#00f2ff] text-[#dce4e4] font-tech text-xs rounded p-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-tech text-xs text-[#b9cacb] mb-1">
                  Descripción / Contenido
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ej: Usar siempre --release para los builds de producción en targets linux-x86_64."
                  className="w-full bg-[#151d1e] border border-[#3a494b] focus:border-[#00f2ff] text-[#dce4e4] font-tech text-xs rounded p-2.5 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block font-tech text-xs text-[#b9cacb] mb-1">
                  Etiquetas (separadas por coma)
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="rust, cargo, binaries"
                  className="w-full bg-[#151d1e] border border-[#3a494b] focus:border-[#00f2ff] text-[#dce4e4] font-tech text-xs rounded p-2.5 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#3a494b]/30">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 border border-[#3a494b] text-[#b9cacb] rounded font-tech text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00f2ff] hover:bg-[#74f5ff] text-[#002022] font-tech text-xs font-bold rounded shadow-[0_0_12px_rgba(0,242,255,0.3)] cursor-pointer"
                >
                  GUARDAR ENTRADA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Purge Delete */}
      {purgeConfirmItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel glass-panel-danger rounded-xl p-6 w-full max-w-md relative">
            <div className="flex items-center gap-3 text-[#ffb4ab] mb-3">
              <span className="material-symbols-outlined text-2xl">warning</span>
              <h3 className="font-headline font-bold text-base">CONFIRM PURGE MEMORY</h3>
            </div>

            <p className="font-body text-xs text-[#b9cacb] mb-4 leading-relaxed">
              ¿Está seguro de eliminar permanentemente la entrada{' '}
              <strong className="text-[#dce4e4]">[{purgeConfirmItem.hexId}] {purgeConfirmItem.title}</strong>{' '}
              del vector store del sistema? Esta acción no se puede deshacer.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPurgeConfirmItem(null)}
                className="px-4 py-2 border border-[#3a494b] text-[#b9cacb] rounded font-tech text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  playSound('warn');
                  onDeleteMemory(purgeConfirmItem.id);
                  setPurgeConfirmItem(null);
                }}
                className="px-4 py-2 bg-[#93000a] hover:bg-[#ff5449] text-white rounded font-tech text-xs font-bold shadow-[0_0_12px_rgba(147,0,10,0.4)] cursor-pointer"
              >
                PURGAR ENTRADA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
