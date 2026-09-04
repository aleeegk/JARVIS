export type AppView =
  | 'control'
  | 'chat'
  | 'automations'
  | 'memory'
  | 'files'
  | 'devices'
  | 'telegram'
  | 'system'
  | 'analytics'
  | 'live';

export type TopNavTab = 'MONITOR' | 'ANALYTICS' | 'LIVE';

export type SystemStatus = 'OPERATIONAL' | 'WARNING' | 'CRITICAL FAULT' | 'CALIBRATING';

export interface TelemetryData {
  cpu: number;
  ram: number;
  gpu: number;
  vram: number;
  battery: string;
  disk: number;
  temp: number;
  latencyMs: number;
  tokensPerSec: number;
}

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'CRIT' | 'SYS';
  message: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'jarvis' | 'system';
  timestamp: string;
  text: string;
  tableData?: {
    headers: string[];
    rows: {
      time: string;
      level: 'CRIT' | 'WARN' | 'INFO';
      message: string;
    }[];
  };
  fileList?: { path: string; size: string }[];
  requiresAuth?: boolean;
  authConfirmed?: boolean;
  authRejected?: boolean;
}

export interface AutomationRoutine {
  id: string;
  num: string;
  title: string;
  status: 'ACTIVA' | 'PAUSADA' | 'ERROR';
  frequency: string;
  time: string;
  triggerType: 'Schedule' | 'Event' | 'Webhook';
  targetOutput: string;
  description: string;
}

export interface FlowNode {
  id: string;
  type: 'TRIGGER' | 'API_CALL' | 'DATA_FETCH' | 'LLM_GENERATE' | 'OUTPUT';
  label: string;
  sublabel: string;
  x: number;
  y: number;
}

export interface MemoryItem {
  id: string;
  hexId: string;
  category: 'USER_PREF' | 'PROJECT' | 'CONTEXT' | 'SYSTEM_RULE';
  title: string;
  description: string;
  active?: boolean;
  updatedAt: string;
  tags: string[];
}

export interface TelegramConfig {
  authorizedChatId: string;
  webhookStatus: 'Conectado' | 'Desconectado' | 'Reconectando...';
  botToken: string;
  lastMessage: string;
  lastCommand: string;
  trafficLogs: string[];
}

export interface SystemSettings {
  aiModel: string;
  ollamaUrl: string;
  voice: string;
  theme: string;
  language: string;
  allowedDirectories: string[];
  authorizedApps: { id: string; name: string; icon: string }[];
  requireCriticalConfirmation: boolean;
}

export interface DeviceItem {
  id: string;
  name: string;
  type: string;
  status: 'ONLINE' | 'STANDBY' | 'BUSY' | 'OFFLINE';
  usage: number;
  ip: string;
  lastPing: string;
}

export interface VirtualFile {
  id: string;
  name: string;
  path: string;
  size: string;
  type: 'file' | 'folder' | 'archive' | 'log';
  clearance: 'NIVEL 1' | 'NIVEL 2' | 'NIVEL 3' | 'NIVEL 4 RESTRICTED';
  encrypted: boolean;
  modified: string;
}
