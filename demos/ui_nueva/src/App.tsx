import React, { useState, useEffect } from 'react';
import {
  AppView,
  TopNavTab,
  SystemStatus,
  TelemetryData,
  SystemLogEntry,
  ChatMessage,
  AutomationRoutine,
  MemoryItem,
  TelegramConfig,
  SystemSettings,
  DeviceItem,
  VirtualFile,
} from './types';
import { playSound } from './utils/audio';
import { CyberCanvas } from './components/CyberCanvas';
import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { ControlCenterView } from './components/views/ControlCenterView';
import { ChatTerminalView } from './components/views/ChatTerminalView';
import { AutomationsView } from './components/views/AutomationsView';
import { MemoryBankView } from './components/views/MemoryBankView';
import { TelegramView } from './components/views/TelegramView';
import { SystemParamsView } from './components/views/SystemParamsView';
import { FilesView } from './components/views/FilesView';
import { DevicesView } from './components/views/DevicesView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { jarvisBridge, isBridgeAvailable } from './services/jarvisBridge';

// Modals
import { NeuralLinkModal } from './components/modals/NeuralLinkModal';
import { ErrorDiagnosticsModal } from './components/modals/ErrorDiagnosticsModal';
import { ScheduleTasksModal } from './components/modals/ScheduleTasksModal';
import {
  NotificationsDrawer,
  SystemNotification,
} from './components/modals/NotificationsDrawer';
import { LockScreenModal } from './components/modals/LockScreenModal';

export const App: React.FC = () => {
  // Navigation & View state
  const [currentView, setCurrentView] = useState<AppView>('control');
  const [activeTopTab, setActiveTopTab] = useState<TopNavTab>('MONITOR');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>('OPERATIONAL');

  // Modals state
  const [isNeuralLinkOpen, setIsNeuralLinkOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isAccessDeniedOpen, setIsAccessDeniedOpen] = useState(false);
  const [isOllamaOffline, setIsOllamaOffline] = useState(false);

  // Real Windows Environment State
  const [openWindows, setOpenWindows] = useState<Array<{ hwnd?: number; titulo: string; proceso?: string }>>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('project');

  // Live Telemetry
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    cpu: 18,
    ram: 42,
    gpu: 33,
    vram: 25,
    battery: 'AC IN',
    disk: 64,
    temp: 48,
    latencyMs: 12,
    tokensPerSec: 68,
  });

  // Telemetry loop: real hardware metrics via psutil / PyWebView bridge
  useEffect(() => {
    let isMounted = true;

    const fetchTelemetry = async () => {
      try {
        const real = await jarvisBridge.getTelemetry();
        if (real && isMounted) {
          setTelemetry((prev) => ({
            ...prev,
            cpu: real.cpu ?? prev.cpu,
            ram: real.ram ?? prev.ram,
            gpu: real.gpu ?? prev.gpu,
            vram: real.vram ?? prev.vram,
            battery: real.battery ?? prev.battery,
            disk: real.disk ?? prev.disk,
            temp: real.temp ?? prev.temp,
            latencyMs: real.latencyMs ?? prev.latencyMs,
            tokensPerSec: real.tokensPerSec ?? prev.tokensPerSec,
          }));

          if (typeof real.ollamaOnline === 'boolean') {
            setIsOllamaOffline(!real.ollamaOnline);
          }
          return;
        }
      } catch (err) {
        // bridge not available or fallback
      }

      if (isMounted) {
        setTelemetry((prev) => ({
          ...prev,
          cpu: Math.min(95, Math.max(12, prev.cpu + (Math.random() * 8 - 4))),
          ram: Math.min(85, Math.max(38, prev.ram + (Math.random() * 2 - 1))),
          gpu: Math.min(90, Math.max(20, prev.gpu + (Math.random() * 6 - 3))),
          vram: Math.min(80, Math.max(22, prev.vram + (Math.random() * 2 - 1))),
          temp: Math.min(75, Math.max(42, prev.temp + (Math.random() * 2 - 1))),
          latencyMs: Math.max(8, Math.round(12 + Math.random() * 6)),
          tokensPerSec: Math.max(40, Math.round(65 + Math.random() * 15)),
        }));
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // System Logs
  const [systemLogs, setSystemLogs] = useState<SystemLogEntry[]>([
    {
      id: 'l1',
      timestamp: new Date().toLocaleTimeString('es-ES', { hour12: false }),
      level: 'SYS',
      message: 'Inicialización de JARVIS Core completada.',
    },
    {
      id: 'l2',
      timestamp: new Date().toLocaleTimeString('es-ES', { hour12: false }),
      level: 'INFO',
      message: 'Módulos de automatización local activos en Windows (Desktop, Files, Browser).',
    },
  ]);

  const addLog = (level: 'INFO' | 'WARN' | 'CRIT' | 'SYS', message: string) => {
    const newEntry: SystemLogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString('es-ES', { hour12: false }),
      level,
      message,
    };
    setSystemLogs((prev) => [newEntry, ...prev.slice(0, 49)]);
  };

  // Chat Messages
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-init',
      sender: 'jarvis',
      timestamp: new Date().toLocaleTimeString('es-ES', { hour12: false }),
      text: 'JARVIS // CMD en línea. Sistema de automatización local conectado al entorno Windows. Escribe un comando o selecciona una acción rápida.',
    },
  ]);

  const [isChatProcessing, setIsChatProcessing] = useState(false);

  // Automations
  const [routines, setRoutines] = useState<AutomationRoutine[]>([
    {
      id: '1',
      num: '01',
      title: 'RESUMEN DEL SISTEMA',
      status: 'ACTIVA',
      frequency: 'Diario',
      time: 'Schedule (08:00 AM)',
      triggerType: 'Schedule',
      targetOutput: 'Telegram Bot / Panel Local',
      description:
        'Compilación diaria de estado del sistema, telemetría de hardware y tareas completadas.',
    },
    {
      id: '2',
      num: '02',
      title: 'COPIA DE SEGURIDAD',
      status: 'ACTIVA',
      frequency: 'Diario',
      time: 'Schedule (Daily 02:00 AM)',
      triggerType: 'Schedule',
      targetOutput: 'Almacenamiento Local',
      description:
        'Respaldo de memoria persistente jarvis_memoria.json y configuración local del agente.',
    },
    {
      id: '3',
      num: '03',
      title: 'LIMPIEZA DE TEMPORALES',
      status: 'ACTIVA',
      frequency: 'Event',
      time: 'Event (Disco > 85%)',
      triggerType: 'Event',
      targetOutput: 'Windows Temp Cleaner',
      description:
        'Purga automática de archivos temporales residuales en la carpeta %TEMP% de Windows.',
    },
    {
      id: '4',
      num: '04',
      title: 'AUDITORÍA DE PROCESOS',
      status: 'ACTIVA',
      frequency: 'Diario',
      time: 'Schedule (03:30 AM)',
      triggerType: 'Schedule',
      targetOutput: 'Monitor de Seguridad',
      description:
        'Supervisión y registro de procesos y ventanas activas en el entorno Windows.',
    },
  ]);

  // Memory Items
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([
    {
      id: '1',
      hexId: '0x00A1',
      category: 'USER_PREF',
      title: 'Perfil de Usuario: Alejandro',
      description:
        'Navegador predeterminado para automatizaciones y tema visual activo en el sistema.',
      updatedAt: 'Activo',
      tags: ['#usuario', '#preferencias', '#windows'],
    },
    {
      id: '2',
      hexId: '0x00B1',
      category: 'SYSTEM_RULE',
      title: 'Protocolo de Ejecución Local',
      description:
        'Automatización 100% offline sin dependencias en la nube mediante módulos nativos de Python.',
      updatedAt: 'Activo',
      tags: ['#protocolo', '#offline', '#automatizacion'],
    },
  ]);

  // Telegram Config
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>({
    authorizedChatId: 'No configurado',
    webhookStatus: 'Inactivo',
    botToken: 'No configurado',
    lastMessage: 'Sin mensajes recientes',
    lastCommand: 'En espera de enlace',
    trafficLogs: [
      'Daemon de Telegram en espera de configuración en .env',
    ],
  });

  // System Settings
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    aiModel: 'qwen2.5:14b',
    ollamaUrl: 'http://localhost:11434',
    voice: 'Jarvis-Esp (Masculina)',
    theme: 'Holográfico Profundo',
    language: 'Español (ES-ES)',
    allowedDirectories: [
      'C:\\Users\\aleja\\Documents\\JARVIS',
      'C:\\Users\\aleja\\Downloads',
      'C:\\Users\\aleja\\Documents',
    ],
    authorizedApps: [
      { id: '1', name: 'Explorador de Windows', icon: 'folder' },
      { id: '2', name: 'Navegador Web', icon: 'language' },
      { id: '3', name: 'PowerShell / CMD', icon: 'terminal' },
      { id: '4', name: 'Visual Studio Code', icon: 'code' },
    ],
    requireCriticalConfirmation: true,
  });

  // Connected Devices
  const [devices, setDevices] = useState<DeviceItem[]>([
    {
      id: 'd1',
      name: 'Host Windows (CPU & Memoria)',
      type: 'Compute',
      status: 'ONLINE',
      usage: 25,
      ip: '127.0.0.1',
      lastPing: 'En vivo',
    },
    {
      id: 'd2',
      name: 'Explorador de Archivos (pywinselect)',
      type: 'Storage',
      status: 'ONLINE',
      usage: 10,
      ip: 'WINDOWS_SHELL',
      lastPing: 'En vivo',
    },
    {
      id: 'd3',
      name: 'Automatización GUI (pywinauto / pyautogui)',
      type: 'Display',
      status: 'ONLINE',
      usage: 12,
      ip: 'DESKTOP_HOOK',
      lastPing: 'En vivo',
    },
    {
      id: 'd4',
      name: 'Motor de Navegación (browser-use)',
      type: 'Browser',
      status: 'ONLINE',
      usage: 5,
      ip: 'CHROMIUM_PORT',
      lastPing: 'En vivo',
    },
  ]);

  // Virtual Files (Fallback si no hay bridge disponible)
  const [files, setFiles] = useState<VirtualFile[]>([
    {
      id: 'f1',
      name: 'Iniciar_JARVIS_GUI2_Nueva.bat',
      path: 'c:\\Users\\aleja\\Documents\\JARVIS\\Iniciar_JARVIS_GUI2_Nueva.bat',
      size: '1.2 KB',
      type: 'file',
      clearance: 'NIVEL 1',
      encrypted: false,
      modified: 'Hoy',
    },
    {
      id: 'f2',
      name: 'jarvis.py',
      path: 'c:\\Users\\aleja\\Documents\\JARVIS\\jarvis.py',
      size: '15.4 KB',
      type: 'file',
      clearance: 'NIVEL 1',
      encrypted: false,
      modified: 'Hoy',
    },
    {
      id: 'f3',
      name: 'Cambiar_GUI.bat',
      path: 'c:\\Users\\aleja\\Documents\\JARVIS\\Cambiar_GUI.bat',
      size: '2.5 KB',
      type: 'file',
      clearance: 'NIVEL 1',
      encrypted: false,
      modified: 'Hoy',
    },
  ]);

  // Notifications
  const [notifications, setNotifications] = useState<SystemNotification[]>([
    {
      id: 'n1',
      title: 'Sistema JARVIS Iniciado',
      message: 'GUI 2 Neural Command Center lista y conectada a Windows.',
      time: 'Ahora',
      type: 'info',
      read: false,
    },
  ]);

  // Carga inicial de datos reales desde el núcleo de JARVIS
  useEffect(() => {
    const initRealData = async () => {
      try {
        // 1. Cargar memoria persistente real (jarvis_memoria.json)
        const realMem = await jarvisBridge.getMemory();
        if (realMem && realMem.length > 0) {
          setMemoryItems(realMem);
        }

        // 2. Cargar archivos reales del directorio de proyecto
        const realFiles = await jarvisBridge.getRealFiles('project');
        if (realFiles && realFiles.length > 0) {
          setFiles(realFiles);
        }

        // 3. Cargar configuración real de Telegram
        const realTg = await jarvisBridge.getTelegramConfig();
        if (realTg) {
          setTelegramConfig((prev) => ({ ...prev, ...realTg }));
        }

        // 4. Cargar ventanas reales abiertas en Windows (pywinauto)
        const realWins = await jarvisBridge.getOpenWindows();
        if (realWins && realWins.length > 0) {
          setOpenWindows(realWins);
        }

        addLog('SYS', 'Conexión bidireccional PyWebView <-> JARVIS Core activa.');
      } catch (err) {
        console.warn('Ejecutando en entorno desacoplado:', err);
      }
    };

    initRealData();
  }, []);

  // Handlers para archivos y explorador
  const handleChangeFolder = async (folder: string) => {
    setCurrentFolder(folder);
    addLog('SYS', `Explorando directorio: ${folder.toUpperCase()}`);
    try {
      const realFiles = await jarvisBridge.getRealFiles(folder);
      if (realFiles && realFiles.length > 0) {
        setFiles(realFiles);
      }
    } catch (err) {
      console.error('Error cambiando carpeta:', err);
    }
  };

  const handleDetectExplorerSelection = async (): Promise<string[]> => {
    try {
      const selected = await jarvisBridge.getExplorerSelected();
      if (selected && selected.length > 0) {
        addLog('SYS', `pywinselect detectó ${selected.length} archivo(s) en Explorer.`);
        return selected;
      } else {
        addLog('INFO', 'pywinselect: No hay archivos seleccionados en Windows Explorer.');
      }
    } catch (err) {
      console.error('Error detectando archivos en Explorer:', err);
    }
    return [];
  };

  const handleAskAboutFiles = (paths: string[]) => {
    const query = `Analiza los siguientes archivos seleccionados en Windows Explorer:\n${paths.join('\n')}`;
    handleExecuteCommand(query);
  };

  const handleFocusWindow = async (title: string) => {
    addLog('SYS', `Enfocando ventana: ${title}`);
    try {
      await jarvisBridge.focusWindow(title);
    } catch (err) {
      console.error('Error enfocando ventana:', err);
    }
  };

  const handleRefreshDevices = async () => {
    addLog('SYS', 'Escaneando ventanas y procesos de Windows (pywinauto)...');
    try {
      const realWins = await jarvisBridge.getOpenWindows();
      if (realWins && realWins.length > 0) {
        setOpenWindows(realWins);
      }
    } catch (err) {
      console.error('Error refrescando ventanas:', err);
    }
  };

  // Command Execution Handler conectado con JARVIS Bridge
  const handleExecuteCommand = async (cmdText: string) => {
    addLog('INFO', `Comando: "${cmdText}"`);

    // Mensaje de usuario al chat
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('es-ES', { hour12: false }),
      text: cmdText,
    };
    setMessages((prev) => [...prev, userMsg]);
    setCurrentView('chat');
    setIsChatProcessing(true);

    try {
      const res = await jarvisBridge.sendMessage(cmdText);
      if (res && res.respuesta) {
        setIsChatProcessing(false);
        playSound('confirm');

        const jarvisMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'jarvis',
          timestamp: res.timestamp || new Date().toLocaleTimeString('es-ES', { hour12: false }),
          text: res.respuesta,
        };

        setMessages((prev) => [...prev, jarvisMsg]);
        addLog('SYS', `Acción ejecutada: [${res.accion}] (${res.modo || 'local'})`);
        return;
      }
    } catch (err) {
      console.error('Error procesando comando vía bridge:', err);
    }

    // Fallback si PyWebView no está conectado (modo preview en navegador estándar)
    setTimeout(() => {
      setIsChatProcessing(false);
      playSound('confirm');

      let responseText = `Comando "${cmdText}" procesado correctamente por el núcleo de inferencia (${systemSettings.aiModel}).`;

      if (cmdText.toLowerCase().includes('pantalla') || cmdText.toLowerCase().includes('analizar')) {
        responseText =
          'Captura y escaneo visual OCR completados. Se han detectado 8 elementos interactivos en el viewport activo sin inconsistencias de seguridad.';
      } else if (cmdText.toLowerCase().includes('youtube') || cmdText.toLowerCase().includes('música')) {
        responseText =
          'Iniciando streaming multimedia en segundo plano: "Synthwave / Cyberpunk Ambient Focus 24/7" (Salida de audio: DAC 32-bit).';
      } else if (cmdText.toLowerCase().includes('red') || cmdText.toLowerCase().includes('puertos')) {
        responseText =
          'Escaneo de red completado. Puertos 22 (SSH), 80 (HTTP), 443 (HTTPS) y 11434 (Ollama) verificados. No se detectan anomalías.';
      }

      const jarvisMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'jarvis',
        timestamp: new Date().toLocaleTimeString('es-ES', { hour12: false }),
        text: responseText,
      };

      setMessages((prev) => [...prev, jarvisMsg]);
      addLog('SYS', `Respuesta generada para: "${cmdText}"`);
    }, 1000);
  };

  // Trigger quick action from dashboard cards
  const handleTriggerAction = (actionDesc: string) => {
    playSound('confirm');
    addLog('SYS', actionDesc);
    handleExecuteCommand(actionDesc);
  };

  // Auth Confirm in Chat
  const handleConfirmAuth = (messageId: string) => {
    playSound('confirm');
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, authConfirmed: true, authRejected: false } : m
      )
    );
    addLog('SYS', 'Autorización otorgada: Acción confirmada y ejecutada.');
  };

  const handleRejectAuth = (messageId: string) => {
    playSound('warn');
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, authRejected: true, authConfirmed: false } : m
      )
    );
    addLog('WARN', 'Autorización rechazada por el operador.');
  };

  // Routine management
  const handleToggleRoutine = (id: string) => {
    setRoutines((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: r.status === 'ACTIVA' ? 'PAUSADA' : 'ACTIVA' } : r
      )
    );
    addLog('SYS', `Estado de rutina [${id}] actualizado.`);
  };

  const handleRunRoutine = (id: string) => {
    const routine = routines.find((r) => r.id === id);
    if (routine) {
      addLog('SYS', `Ejecutando rutina manual: ${routine.title}`);
      handleExecuteCommand(`Ejecutar inmediatamente rutina de automatización: ${routine.title}`);
    }
  };

  const handleCreateRoutine = (newRoutine: Omit<AutomationRoutine, 'id' | 'num'>) => {
    const count = routines.length + 1;
    const item: AutomationRoutine = {
      ...newRoutine,
      id: Date.now().toString(),
      num: count < 10 ? `0${count}` : `${count}`,
    };
    setRoutines((prev) => [...prev, item]);
    addLog('SYS', `Nueva rutina creada: ${newRoutine.title}`);
  };

  const handleDeleteRoutine = (id: string) => {
    setRoutines((prev) => prev.filter((r) => r.id !== id));
    addLog('WARN', `Rutina [${id}] eliminada del planificador.`);
  };

  // Memory management
  const handleAddMemory = (newItem: Omit<MemoryItem, 'id' | 'hexId' | 'updatedAt'>) => {
    const hex = '0x' + Math.floor(Math.random() * 0xffff).toString(16).toUpperCase();
    const item: MemoryItem = {
      ...newItem,
      id: Date.now().toString(),
      hexId: hex,
      updatedAt: 'Ahora',
    };
    setMemoryItems((prev) => [item, ...prev]);
    addLog('SYS', `Entrada guardada en Memory Bank [${hex}].`);
  };

  const handleUpdateMemory = (id: string, updated: Partial<MemoryItem>) => {
    setMemoryItems((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updated, updatedAt: 'Ahora' } : m))
    );
    addLog('SYS', `Entrada de memoria [${id}] modificada.`);
  };

  const handleDeleteMemory = (id: string) => {
    setMemoryItems((prev) => prev.filter((m) => m.id !== id));
    addLog('WARN', `Entrada de memoria [${id}] purgada del vector store.`);
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-[#dce4e4] font-body relative overflow-x-hidden">
      {/* WebGL Animated Background */}
      <CyberCanvas />

      {/* Top Header Navigation */}
      <TopNav
        currentView={currentView}
        onSelectView={(v) => setCurrentView(v)}
        activeTopTab={activeTopTab}
        onSelectTopTab={(t) => setActiveTopTab(t)}
        activeModel={systemSettings.aiModel}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenSchedule={() => setIsScheduleOpen(true)}
        onOpenDiagnostics={() => setIsAccessDeniedOpen(true)}
        unreadNotificationsCount={notifications.filter((n) => !n.read).length}
      />

      {/* Mobile Toggle Button */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => {
            playSound('click');
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
          }}
          className="w-14 h-14 rounded-full bg-[#00f2ff] text-[#002022] flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.6)] cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl font-bold">
            {isMobileSidebarOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Left Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={(v) => setCurrentView(v)}
        systemStatus={systemStatus}
        onDeployNeuralLink={() => setIsNeuralLinkOpen(true)}
        onOpenSettings={() => setCurrentView('system')}
        onLockScreen={() => setIsLocked(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <main className="md:pl-64 pt-20 px-4 md:px-8 max-w-7xl mx-auto min-h-[calc(100vh-80px)] transition-all">
        {currentView === 'control' && (
          <ControlCenterView
            telemetry={telemetry}
            systemLogs={systemLogs}
            activeModel={systemSettings.aiModel}
            onExecuteCommand={handleExecuteCommand}
            onTriggerAction={handleTriggerAction}
            onNavigate={(v) => setCurrentView(v)}
            onRebootCore={() => {
              addLog('SYS', 'Reinicio de JARVIS Core ejecutado.');
              setSystemStatus('CALIBRATING');
              setTimeout(() => setSystemStatus('OPERATIONAL'), 2000);
            }}
            onAddLog={addLog}
          />
        )}

        {currentView === 'chat' && (
          <ChatTerminalView
            messages={messages}
            onSendMessage={handleExecuteCommand}
            onConfirmAuth={handleConfirmAuth}
            onRejectAuth={handleRejectAuth}
            isProcessing={isChatProcessing}
            activeModel={systemSettings.aiModel}
          />
        )}

        {currentView === 'automations' && (
          <AutomationsView
            routines={routines}
            onToggleRoutine={handleToggleRoutine}
            onRunRoutine={handleRunRoutine}
            onCreateRoutine={handleCreateRoutine}
            onDeleteRoutine={handleDeleteRoutine}
          />
        )}

        {currentView === 'memory' && (
          <MemoryBankView
            memoryItems={memoryItems}
            onAddMemory={handleAddMemory}
            onUpdateMemory={handleUpdateMemory}
            onDeleteMemory={handleDeleteMemory}
          />
        )}

        {currentView === 'telegram' && (
          <TelegramView
            config={telegramConfig}
            onUpdateConfig={(upd) => setTelegramConfig((prev) => ({ ...prev, ...upd }))}
            onTestConnection={() => {
              addLog('INFO', 'Test de conectividad con Telegram ejecutado (Ping 42ms).');
            }}
          />
        )}

        {currentView === 'system' && (
          <SystemParamsView
            settings={systemSettings}
            onUpdateSettings={(upd) => {
              setSystemSettings((prev) => ({ ...prev, ...upd }));
              addLog('SYS', 'Configuración del sistema guardada.');
            }}
            onSimulateAccessDenied={() => setIsAccessDeniedOpen(true)}
            onSimulateOllamaOffline={() => setIsOllamaOffline(true)}
          />
        )}

        {currentView === 'files' && (
          <FilesView
            files={files}
            currentFolder={currentFolder}
            onChangeFolder={handleChangeFolder}
            onDetectExplorerSelection={handleDetectExplorerSelection}
            onAskAboutFiles={handleAskAboutFiles}
            onOpenFile={(file) => {
              addLog('INFO', `Visualizando archivo: ${file.path}`);
            }}
            onDeleteFile={(fileId) => {
              setFiles((prev) => prev.filter((f) => f.id !== fileId));
              addLog('WARN', `Archivo eliminado de la vista.`);
            }}
          />
        )}

        {currentView === 'devices' && (
          <DevicesView
            devices={devices}
            openWindows={openWindows}
            onToggleDevice={(deviceId) => {
              setDevices((prev) =>
                prev.map((d) =>
                  d.id === deviceId
                    ? { ...d, status: d.status === 'OFFLINE' ? 'ONLINE' : 'OFFLINE' }
                    : d
                )
              );
              addLog('SYS', `Estado de dispositivo [${deviceId}] modificado.`);
            }}
            onRefreshDevices={handleRefreshDevices}
            onFocusWindow={handleFocusWindow}
          />
        )}

        {(currentView === 'analytics' || currentView === 'live') && (
          <AnalyticsView telemetry={telemetry} />
        )}
      </main>

      {/* Global Interactive Modals & Drawers */}
      <NeuralLinkModal
        isOpen={isNeuralLinkOpen}
        onClose={() => setIsNeuralLinkOpen(false)}
        onDeploySuccess={() => {
          addLog('SYS', 'Neural Link v2.4 calibrado con éxito.');
          setCurrentView('chat');
        }}
      />

      <ErrorDiagnosticsModal
        isAccessDeniedOpen={isAccessDeniedOpen}
        onCloseAccessDenied={() => setIsAccessDeniedOpen(false)}
        onRequestSudo={() => {
          setIsAccessDeniedOpen(false);
          addLog('SYS', 'Elevación de privilegios UAC solicitada para el operador.');
          handleExecuteCommand('powershell Start-Process powershell -Verb runAs');
        }}
        isOllamaOffline={isOllamaOffline}
        onReconnectOllama={() => {
          setIsOllamaOffline(false);
          addLog('SYS', 'Ollama daemon reconectado con éxito.');
        }}
      />

      <ScheduleTasksModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
      />

      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        }}
        onClearAll={() => setNotifications([])}
      />

      <LockScreenModal
        isLocked={isLocked}
        onUnlock={() => {
          setIsLocked(false);
          addLog('SYS', 'Terminal desbloqueada por autenticación PIN.');
        }}
      />
    </div>
  );
};

export default App;

