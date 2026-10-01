import type { FocusTask } from './tasks';

export interface JourneyStage {
  id: string;
  title: string;
  taskIds: string[];
  completed: boolean;
}

export interface Journey {
  id: string;
  title: string;
  stages: JourneyStage[];
  activeTaskId?: string;
  accumulatedSeconds: number;
  completedAt?: string;
}

export const defaultJourneys: Journey[] = [
  {
    id: 'journey-portfolio',
    title: '포트폴리오 항로',
    stages: [
      { id: 'stage-shape', title: '구조를 잡는 날', taskIds: ['task-copy', 'task-review'], completed: false },
      { id: 'stage-polish', title: '마무리 항해', taskIds: ['task-reading'], completed: false },
    ],
    activeTaskId: 'task-copy',
    accumulatedSeconds: 0,
  },
];

export const getJourneyTask = (journey: Journey, tasks: FocusTask[]): FocusTask | undefined => {
  const activeId = journey.activeTaskId ?? journey.stages.flatMap((stage) => stage.taskIds)[0];
  return tasks.find((task) => task.id === activeId);
};

export const advanceJourney = (
  journey: Journey,
  tasks: FocusTask[],
  completedTaskId: string,
  focusedSeconds: number,
  now: number,
): Journey => {
  const completedTaskIds = new Set(tasks.filter((task) => task.completed).map((task) => task.id));
  completedTaskIds.add(completedTaskId);
  const stages = journey.stages.map((stage) => ({
    ...stage,
    completed: stage.taskIds.every((taskId) => completedTaskIds.has(taskId)),
  }));
  const activeTaskId = stages.flatMap((stage) => stage.taskIds).find((taskId) => !completedTaskIds.has(taskId));
  return {
    ...journey,
    stages,
    activeTaskId,
    accumulatedSeconds: journey.accumulatedSeconds + focusedSeconds,
    completedAt: activeTaskId ? undefined : new Date(now).toISOString(),
  };
};
