import { describe, expect, it } from 'vitest';
import { advanceJourney, defaultJourneys } from './journeys';
import { defaultTasks } from './tasks';

describe('advanceJourney', () => {
  it('marks the completed stage and moves the active task forward', () => {
    const journey = advanceJourney(defaultJourneys[0], defaultTasks, 'task-copy', 120, 1_000);

    expect(journey.stages[0].completed).toBe(false);
    expect(journey.activeTaskId).toBe('task-review');
    expect(journey.accumulatedSeconds).toBe(120);
    expect(journey.completedAt).toBeUndefined();
  });

  it('records completion when the final task is completed', () => {
    const completedTasks = defaultTasks.map((task) => ({ ...task, completed: task.id !== 'task-reading' }));
    const journey = advanceJourney(defaultJourneys[0], completedTasks, 'task-reading', 60, 1_000);

    expect(journey.stages.every((stage) => stage.completed)).toBe(true);
    expect(journey.activeTaskId).toBeUndefined();
    expect(journey.completedAt).toBe(new Date(1_000).toISOString());
  });
});
