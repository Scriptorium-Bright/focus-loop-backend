import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings, repository } from './localRepository';

const createMemoryStorage = (): Storage => {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => [...values.keys()][index] ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, value),
  };
};

describe('localRepository', () => {
  beforeEach(() => vi.stubGlobal('localStorage', createMemoryStorage()));

  it('round-trips local settings and keeps data namespaced', () => {
    const settings = { ...defaultSettings, onboardingSeen: true, skinId: 'COAST' };

    repository.saveSettings(settings);

    expect(repository.loadSettings()).toEqual(settings);
    expect(localStorage.getItem('settings')).toBeNull();
    expect(localStorage.getItem('focusloop:v2:settings')).not.toBeNull();
  });

  it('returns a serializable export without sending it anywhere', () => {
    const exported = repository.exportData({
      settings: defaultSettings,
      tasks: [],
      journeys: [],
      logbook: [],
      session: null,
    });

    expect(JSON.parse(exported)).toMatchObject({ settings: defaultSettings, session: null });
  });

  it('fills fields introduced after the first local schema version', () => {
    localStorage.setItem('focusloop:v2:logbook', JSON.stringify([{ id: 'log-old', title: '기존 기록', focusedSeconds: 30, mode: 'QUICK', skinId: 'DAWN' }]));

    const [entry] = repository.loadLogbook();

    expect(entry.plannedSeconds).toBe(30);
    expect(entry.restSeconds).toBe(0);
    expect(entry.visitedHarborIds).toEqual([]);
    expect(entry.endedStatus).toBe('COMPLETED');
  });
});
