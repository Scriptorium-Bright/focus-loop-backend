export interface FocusTask {
  id: string;
  title: string;
  estimatedSeconds: number;
  completed: boolean;
  journeyId?: string;
  stageId?: string;
}

export const defaultTasks: FocusTask[] = [
  { id: 'task-copy', title: '설계 문서 한 단락 정리', estimatedSeconds: 1500, completed: false },
  { id: 'task-review', title: '코드 리뷰 질문 세 가지 답하기', estimatedSeconds: 1800, completed: false },
  { id: 'task-reading', title: '오늘 읽을 자료 한 편', estimatedSeconds: 1200, completed: false },
];
