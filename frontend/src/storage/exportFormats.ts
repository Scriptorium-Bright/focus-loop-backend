import type { LogbookEntry } from '../domain/logbook';

const csvCell = (value: string | number | boolean | undefined) => {
  const text = value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const logbookToCsv = (entries: LogbookEntry[]) => {
  const header = ['id', 'session_id', 'task_id', 'journey_id', 'title', 'created_at', 'mode', 'planned_seconds', 'focused_seconds', 'rest_seconds', 'pause_count', 'task_completed', 'skin_id', 'departure_harbor_id', 'visited_harbor_ids', 'arrival_id', 'ended_status', 'note'];
  const rows = entries.map((entry) => [
    entry.id,
    entry.sessionId,
    entry.taskId,
    entry.journeyId,
    entry.title,
    entry.createdAt,
    entry.mode,
    entry.plannedSeconds,
    entry.focusedSeconds,
    entry.restSeconds,
    entry.pauseCount,
    entry.taskCompleted,
    entry.skinId,
    entry.departureHarborId,
    entry.visitedHarborIds.join('|'),
    entry.arrivalId,
    entry.endedStatus,
    entry.note,
  ].map(csvCell).join(','));
  return [header.join(','), ...rows].join('\n');
};

export const downloadBlob = (content: BlobPart, type: string, filename: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};
