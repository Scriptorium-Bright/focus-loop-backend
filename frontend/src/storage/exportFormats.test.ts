import { describe, expect, it } from 'vitest';
import { logbookToCsv } from './exportFormats';

describe('logbook export formats', () => {
  it('quotes commas, quotes, and newlines without losing fields', () => {
    const csv = logbookToCsv([{
      id: 'log-1',
      sessionId: 'session-1',
      title: '문서, 검토',
      plannedSeconds: 1_500,
      focusedSeconds: 60,
      restSeconds: 0,
      pauseCount: 0,
      taskCompleted: true,
      note: '첫 줄\n"좋았다"',
      skinId: 'DAWN',
      departureHarborId: 'dawn-departure',
      visitedHarborIds: [],
      seed: 1,
      mode: 'QUICK',
      endedStatus: 'COMPLETED',
      createdAt: '2026-01-01T00:00:00.000Z',
    }]);

    expect(csv).toContain('"문서, 검토"');
    expect(csv).toContain('"첫 줄\n""좋았다"""');
  });
});
