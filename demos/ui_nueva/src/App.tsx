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
      timestamp: '08:34:10',
      level: 'INFO',
      message: 'Comando de voz reconocido: "Estado del sistema".',
    },
    {
      id: 'l2',
      timestamp: '08:32:05',
      level: 'WARN',
      message: 'Uso de memoria superior al 80% en Ollama daemon.',
    },
    {
      id: 'l3',
      timestamp: '08:30:00',
      level: 'SYS',
      message: 'Resumen matutino ejecutado y enviado a Telegram.',
    },
    {
      id: 'l4',
      timestamp: '08:15:22',
      level: 'CRIT',
      message: 'Error 0x80070005 en acceso a /etc/shadow.',
    },
    {
      id: 'l5',
      timestamp: '08:00:00',
      level: 'SYS',
      message: 'Inicialización de JARVIS Core completada.',
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

  // Chat Messages (pre-populated with screenshot data)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'user',
      timestamp: '08:34:10',
      text: 'Analiza el log del servidor web de las últimas 24 horas y muéstrame los errores críticos. Luego, elimina los archivos temporales generados por el proceso de volcado.',
    },
    {
      id: 'm2',
      sender: 'jarvis',
      timestamp: '08:34:12',
      text: 'Análisis completado. Se han detectado 3 eventos críticos en `var/log/nginx/error.log` durante la ventana de tiempo especificada.',
      tableData: {
        headers: ['TIMESTAMP', 'NIVEL', 'MENSAJE'],
        rows: [
          {
            time: '2023-10-27 03:14:02',
            level: 'CRIT',
            message: 'Worker process 4102 exited on signal 11 (SIGSEGV)',
          },
          {
            time: '2023-10-27 07:45:19',
            level: 'CRIT',
            message: 'upstream timed out (110: Connection timed out) while connecting to upstream',
          },
          {
            time: '2023-10-27 11:22:50',
            level: 'CRIT',
            message: 'SSL_do_handshake() failed (SSL: error:14094410:SSL routines:ssl3_read_bytes:sslv3 alert handshake failure)',
          },
        ],
      },
      fileList: [
        { path: '/tmp/dump_20231027_01.tar.gz', size: '1.2 GB' },
        { path: '/tmp/dump_20231027_02.tar.gz', size: '850 MB' },
      ],
      requiresAuth: true,
      authConfirmed: false,
    },
  ]);

  const [isChatProcessing, setIsChatProcessing] = useState(false);

  // Automations
  const [routines, setRoutines] = useState<AutomationRoutine[]>([
    {
      id: '1',
      num: '01',
      title: 'RESUMEN MATUTINO',
      status: 'ACTIVA',
      frequency: 'Diario',
      time: 'Schedule (08:00 AM)',
      triggerType: 'Schedule',
      targetOutput: 'Telegram: @alejandro_main',
      description:
        'Compilación diaria de clima, agenda, commits recientes en repositorios y estado de servidores.',
    },
    {
      id: '2',
      num: '02',
      title: 'COPIA DE SEGURIDAD',
      status: 'PAUSADA',
      frequency: 'Diario',
      time: 'Schedule (Daily 02:00 AM)',
      triggerType: 'Schedule',
      targetOutput: 'S3 Bucket / Encrypted',
      description:
        'Backup incremental de bases de datos locales y configuraciones de seguridad del sistema.',
    },
    {
      id: '3',
      num: '03',
      title: 'LIMPIEZA TEMPORALES',
      status: 'ERROR',
      frequency: 'Event',
      time: 'Event (Disk > 85%)',
      triggerType: 'Event',
      targetOutput: 'System Cleaner',
      description:
        'Fallo en ejecución previa: Permiso denegado en directorio /var/cache/sys.',
    },
    {
      id: '4',
      num: '04',
      title: 'ESCANEO NOCTURNO',
      status: 'ACTIVA',
      frequency: 'Diario',
      time: 'Schedule (03:30 AM)',
      triggerType: 'Schedule',
      targetOutput: 'Security Suite',
      description:
        'Auditoría de integridad de archivos del sistema y análisis de puertos vulnerables en LAN.',
    },
  ]);

  // Memory Items
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([
    {
      id: '1',
      hexId: '0xFA12',
      category: 'USER_PREF',
      title: 'Preferencias de compilación para Rust',
      description:
        'Usar siempre target linux-x86_64 con optimizaciones --release y salida de artefactos a /opt/bin.',
      updatedAt: 'Hace 2h',
      tags: ['#rust', '#cargo', '#binaries'],
    },
    {
      id: '2',
      hexId: '0x3B88',
      category: 'PROJECT',
      title: 'Ruta de workspace principal',
      description:
        'Directorio base de trabajo ubicado en /home/alex/projects/jarvis con permisos extendidos.',
      updatedAt: 'Ayer',
      tags: ['#workspace', '#directories'],
    },
    {
      id: '3',
      hexId: '0x81C2',
      category: 'SYSTEM_RULE',
      title: 'Instrucciones de formato Markdown',
      description:
        'Formatear siempre tablas de logs con timestamp exacto, código de error en mayúsculas y badges coloreados.',
      updatedAt: 'Hace 3 días',
      tags: ['#markdown', '#format', '#rules'],
    },
    {
      id: '4',
      hexId: '0x99D1',
      category: 'CONTEXT',
      title: 'Historial de sesiones Nginx',
      description:
        'Último fallo registrado por desbordamiento de búfer en worker process 4102.',
      updatedAt: 'Hoy 08:34',
      tags: ['#nginx', '#crash', '#dump'],
    },
  ]);

  // Telegram Config
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>({
    authorizedChatId: '94827104',
    webhookStatus: 'Conectado',
    botToken: '7482910482:AAH9Xk2Lp08bNmQ41Zrt5vW719aKdLe-v10',
    lastMessage: '/status',
    lastCommand: 'Captura de pantalla enviada',
    trafficLogs: [
      '2026-08-31 08:34:10 [TG_IN] Mensaje recibido de ID 94827104: /status',
      '2026-08-31 08:34:11 [TG_PROC] Generando informe de telemetría...',
      '2026-08-31 08:34:12 [TG_OUT] Mensaje enviado a 94827104 (200 OK)',
      '2026-08-31 08:34:15 [TG_IN] Comando recibido: Captura de pantalla',
      '2026-08-31 08:34:16 [TG_OUT] Imagen PNG enviada exitosamente (4.2 MB)',
    ],
  });

  // System Settings
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    aiModel: 'qwen2.5:14b',
    ollamaUrl: 'http://localhost:11434',
    voice: 'Jarvis-Esp (Masculina)',
    theme: 'Holográfico Profundo',
    language: 'Español (ES-ES)',
    allowedDirectories: ['/home/alex/projects/jarvis', '/var/log/nginx', '/tmp/dumps'],
    authorizedApps: [
      { id: '1', name: 'Visual Studio Code', icon: 'code' },
      { id: '2', name: 'Brave Browser', icon: 'language' },
      { id: '3', name: 'Docker Engine', icon: 'developer_board' },
      { id: '4', name: 'Terminal TTY', icon: 'terminal' },
    ],
    requireCriticalConfirmation: true,
  });

  // Connected Devices
  const [devices, setDevices] = useState<DeviceItem[]>([
    {
      id: 'd1',
      name: 'Neural Link Interface v2.4',
      type: 'Neural Link',
      status: 'ONLINE',
      usage: 42,
      ip: '127.0.0.1:8088',
      lastPing: 'Hace 2s',
    },
    {
      id: 'd2',
      name: 'Display Streamer 4K HDR',
      type: 'Display',
      status: 'ONLINE',
      usage: 60,
      ip: '192.168.1.105',
      lastPing: 'Hace 5s',
    },
    {
      id: 'd3',
      name: 'Ollama Neural Accelerator (RTX 4090)',
      type: 'Compute',
      status: 'BUSY',
      usage: 78,
      ip: '127.0.0.1:11434',
      lastPing: 'Hace 1s',
    },
    {
      id: 'd4',
      name: 'Micrófono Array Direccional 8CH',
      type: 'Audio',
      status: 'ONLINE',
      usage: 15,
      ip: 'USB_AUDIO_01',
      lastPing: 'Hace 10s',
    },
    {
      id: 'd5',
      name: 'Storage Array NVMe RAID-0',
      type: 'Storage',
      status: 'ONLINE',
      usage: 64,
      ip: '/dev/nvme0n1',
      lastPing: 'Hace 1s',
    },
  ]);

  // Virtual Files
  const [files, setFiles] = useState<VirtualFile[]>([
    {
      id: 'f1',
      name: 'error.log',
      path: '/var/log/nginx/error.log',
      size: '14.2 MB',
      type: 'log',
      clearance: 'NIVEL 2',
      encrypted: false,
      modified: 'Hoy 08:34',
    },
    {
      id: 'f2',
      name: 'dump_20231027_01.tar.gz',
      path: '/tmp/dumps/dump_20231027_01.tar.gz',
      size: '1.2 GB',
      type: 'archive',
      clearance: 'NIVEL 4 RESTRICTED',
      encrypted: true,
      modified: 'Hoy 03:15',
    },
    {
      id: 'f3',
      name: 'dump_20231027_02.tar.gz',
      path: '/tmp/dumps/dump_20231027_02.tar.gz',
      size: '850 MB',
      type: 'archive',
      clearance: 'NIVEL 4 RESTRICTED',
      encrypted: true,
      modified: 'Hoy 07:46',
    },
    {
      id: 'f4',
      name: 'jarvis.config.json',
      path: '/home/alex/projects/jarvis/config.json',
      size: '4.8 KB',
      type: 'file',
      clearance: 'NIVEL 1',
      encrypted: false,
      modified: 'Ayer',
    },
    {
      id: 'f5',
      name: 'neural_weights.bin',
      path: '/var/sys/core/neural_weights.bin',
      size: '7.8 GB',
      type: 'file',
      clearance: 'NIVEL 4 RESTRICTED',
      encrypted: true,
      modified: 'Hace 3 días',
    },
  ]);

  // Notifications
  const [notifications, setNotifications] = useState<SystemNotification[]>([
    {
      id: 'n1',
      title: 'Análisis de Servidor Web',
      message: 'Se han detectado 3 errores críticos en /var/log/nginx/error.log',
      time: '08:34 AM',
      type: 'warn',
      read: false,
    },
    {
      id: 'n2',
      title: 'Resumen Matutino',
      message: 'Rutina ejecutada y enviada a Telegram con éxito.',
      time: '08:00 AM',
      type: 'info',
      read: false,
    },
    {
      id: 'n3',
      title: 'Fallo de Acceso Denegado',
      message: 'Intento de acceso a recurso protegido sin elevación sudo.',
      time: '08:15 AM',
      type: 'crit',
      read: true,
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
    addLog('SYS', 'Autorización otorgada: Eliminación de archivos temporales completada.');

    // Remove deleted files from virtual files
    setFiles((prev) => prev.filter((f) => !f.path.includes('/tmp/dumps')));
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
          addLog('SYS', 'Elevación sudo autorizada para el operador Alejandro.');
          handleExecuteCommand('sudo chmod 600 /etc/shadow && sudo systemctl restart auth');
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

