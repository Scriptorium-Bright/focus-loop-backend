import { useState } from 'react';
import type { Journey } from '../domain/journeys';
import { getJourneyTask } from '../domain/journeys';
import type { LogbookEntry } from '../domain/logbook';
import type { FocusTask } from '../domain/tasks';
import { formatClock } from '../domain/session/timerClock';
import { ActionButton, EmptyState, Pill, SectionHeading } from './primitives';

export function JourneysScreen({ journeys, tasks, entries, onStart, onCreate }: { journeys: Journey[]; tasks: FocusTask[]; entries: LogbookEntry[]; onStart: (journey: Journey) => void; onCreate: (title: string) => void }) {
  const [selectedId, setSelectedId] = useState<string>();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const selectedJourney = journeys.find((journey) => journey.id === selectedId);

  const create = () => {
    const nextTitle = title.trim();
    if (!nextTitle) return;
    onCreate(nextTitle);
    setTitle('');
    setCreating(false);
  };

  return (
    <div className="content-screen screen-padding">
      <SectionHeading
        eyebrow="긴 여정"
        title="천천히 이어가는 항로."
        detail="한 번의 집중이 다음 단계로 이어집니다."
        action={<ActionButton variant="quiet" size="sm" type="button" onClick={() => setCreating((value) => !value)}>+ 새 여정</ActionButton>}
      />
      {creating && (
        <div className="journey-create" role="group" aria-label="새 여정 만들기">
          <label className="field-label"><span>여정 이름</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: 자격증 준비 항로" maxLength={60} /></label>
          <ActionButton type="button" size="sm" onClick={create} disabled={!title.trim()}>만들기</ActionButton>
        </div>
      )}
      {selectedJourney ? (
        <JourneyDetail journey={selectedJourney} tasks={tasks} entries={entries} onBack={() => setSelectedId(undefined)} onStart={onStart} />
      ) : journeys.length === 0 ? (
        <EmptyState title="아직 여정이 없어요." detail="작은 단계부터 항로를 만들어보세요." />
      ) : (
        <div className="journey-list">
          {journeys.map((journey) => {
            const task = getJourneyTask(journey, tasks);
            const totalTasks = journey.stages.reduce((sum, stage) => sum + stage.taskIds.length, 0);
            const doneTasks = journey.stages.reduce((sum, stage) => sum + stage.taskIds.filter((taskId) => tasks.find((item) => item.id === taskId)?.completed).length, 0);
            return (
              <article className="journey-card" key={journey.id}>
                <button className="journey-card-open" type="button" onClick={() => setSelectedId(journey.id)} aria-label={`${journey.title} 상세 보기`}>
                  <div className="journey-card-top"><Pill tone="accent">{journey.stages.length} stages</Pill><span>{doneTasks}/{totalTasks} 완료</span></div>
                  <h2>{journey.title}</h2>
                  <div className="journey-progress"><span style={{ width: `${totalTasks ? (doneTasks / totalTasks) * 100 : 0}%` }} /></div>
                  <p>다음 작업 · {task?.title ?? (journey.completedAt ? '모든 항로를 마쳤어요' : '새 작업을 기다리는 중')}</p>
                </button>
                <div className="journey-card-actions"><ActionButton type="button" size="sm" onClick={() => onStart(journey)} disabled={!task}>현재 단계 출항 <span>→</span></ActionButton><button className="text-button" type="button" onClick={() => setSelectedId(journey.id)}>상세 보기</button></div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function JourneyDetail({ journey, tasks, entries, onBack, onStart }: { journey: Journey; tasks: FocusTask[]; entries: LogbookEntry[]; onBack: () => void; onStart: (journey: Journey) => void }) {
  const task = getJourneyTask(journey, tasks);
  const journeyEntries = entries.filter((entry) => entry.journeyId === journey.id);
  return (
    <section className="journey-detail" aria-label={`${journey.title} 상세`}> 
      <button className="text-button" type="button" onClick={onBack}>← 여정 목록</button>
      <div className="journey-detail-heading"><div><p className="eyebrow">현재 항로</p><h2>{journey.title}</h2><p>누적 집중 {formatClock(journey.accumulatedSeconds, true)} · {journey.completedAt ? '완료됨' : '진행 중'}</p></div><ActionButton type="button" onClick={() => onStart(journey)} disabled={!task}>현재 작업 출항 <span>→</span></ActionButton></div>
      <div className="journey-stages">
        {journey.stages.map((stage, index) => (
          <section className={stage.completed ? 'journey-stage is-complete' : 'journey-stage'} key={stage.id}>
            <div className="journey-stage-heading"><span className="journey-stage-index">{stage.completed ? '✓' : index + 1}</span><strong>{stage.title}</strong><Pill tone={stage.completed ? 'accent' : 'neutral'}>{stage.completed ? '완료' : '진행 예정'}</Pill></div>
            <ul>{stage.taskIds.map((taskId) => { const item = tasks.find((candidate) => candidate.id === taskId); return <li key={taskId} className={item?.completed ? 'is-complete' : ''}><span>{item?.completed ? '✓' : '○'}</span>{item?.title ?? '삭제된 작업'}</li>; })}</ul>
          </section>
        ))}
      </div>
      <div className="journey-detail-log"><p className="field-caption">이 여정의 항해일지</p>{journeyEntries.length === 0 ? <p className="journey-muted">아직 기록된 항해가 없습니다.</p> : journeyEntries.map((entry) => <div key={entry.id}><span>{entry.title}</span><small>{formatClock(entry.focusedSeconds, true)} · {new Date(entry.createdAt).toLocaleDateString('ko-KR')}</small></div>)}</div>
    </section>
  );
}
