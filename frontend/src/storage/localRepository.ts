import type { Journey } from '../domain/journeys';
import type { LogbookEntry } from '../domain/logbook';
import type { FocusSkin } from '../domain/skins';
import type { FocusTask } from '../domain/tasks';
import { emptyEntitlementCache, normalizeEntitlementCache, type EntitlementCache } from '../domain/entitlements';
import type { SessionMachine } from '../domain/session/sessionTypes';
import type { SyncQueueItem } from '../sync/syncQueue';

const PREFIX = 'focusloop:v2:';

const read = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(`${PREFIX}${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = <T>(key: string, value: T) => {
  try {
    localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Local mode remains usable when storage is unavailable.
  }
};

export interface LocalSettings {
  reduceMotion: boolean;
  soundEnabled: boolean;
  brightness: number;
  skinId: string;
  onboardingSeen: boolean;
  focusAutoHide: boolean;
}

export interface LocalData {
  settings: LocalSettings;
  tasks: FocusTask[];
  journeys: Journey[];
  logbook: LogbookEntry[];
  session: SessionMachine | null;
  syncQueue?: SyncQueueItem[];
  entitlements?: EntitlementCache;
}

export const defaultSettings: LocalSettings = {
  reduceMotion: false,
  soundEnabled: true,
  brightness: 1,
  skinId: 'DAWN',
  onboardingSeen: false,
  focusAutoHide: true,
};

export const repository = {
  loadSettings: () => read('settings', defaultSettings),
  saveSettings: (settings: LocalSettings) => write('settings', settings),
  loadTasks: (fallback: FocusTask[]) => read('tasks', fallback),
  saveTasks: (tasks: FocusTask[]) => write('tasks', tasks),
  loadJourneys: (fallback: Journey[]) => read('journeys', fallback),
  saveJourneys: (journeys: Journey[]) => write('journeys', journeys),
  loadLogbook: () => read<Partial<LogbookEntry>[]>('logbook', []).map((entry) => ({
    ...entry,
    plannedSeconds: entry.plannedSeconds ?? entry.focusedSeconds ?? 0,
    focusedSeconds: entry.focusedSeconds ?? 0,
    restSeconds: entry.restSeconds ?? 0,
    pauseCount: entry.pauseCount ?? 0,
    visitedHarborIds: entry.visitedHarborIds ?? [],
    departureHarborId: entry.departureHarborId ?? '',
    seed: entry.seed ?? 0,
    endedStatus: entry.endedStatus ?? 'COMPLETED',
  }) as LogbookEntry),
  saveLogbook: (entries: LogbookEntry[]) => write('logbook', entries),
  deleteLogbookEntry: (id: string) => {
    const entries = read<LogbookEntry[]>('logbook', []);
    write('logbook', entries.filter((entry) => entry.id !== id));
  },
  clearLogbook: () => write('logbook', []),
  loadSyncQueue: () => read<SyncQueueItem[]>('syncQueue', []),
  saveSyncQueue: (queue: SyncQueueItem[]) => write('syncQueue', queue),
  loadEntitlements: () => normalizeEntitlementCache(read<Partial<EntitlementCache>>('entitlements', emptyEntitlementCache())),
  saveEntitlements: (entitlements: EntitlementCache) => write('entitlements', entitlements),
  loadSession: () => read<SessionMachine | null>('session', null),
  saveSession: (session: SessionMachine | null) => write('session', session),
  clearSession: () => write('session', null),
  exportData: (data: LocalData) => JSON.stringify(data, null, 2),
};
