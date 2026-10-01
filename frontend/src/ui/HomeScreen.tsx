import { useState } from 'react';
import type { FocusSkin } from '../domain/skins';
import type { FocusMode, TimerMode } from '../domain/session/sessionTypes';
import type { FocusTask } from '../domain/tasks';
import { getJourneyTask, type Journey } from '../domain/journeys';
import { SceneCanvas } from '../scene/SceneCanvas';
import { ActionButton, Pill, SectionHeading, Segmented } from './primitives';

export function HomeScreen({
  mode,
  onModeChange,
  taskTitle,
  onTaskTitleChange,
  timerMode,
  onTimerModeChange,
  plannedSeconds,
  onPlannedSecondsChange,
  selectedSkin,
  reduceMotion,
  onSkinChange,
  skins,
  tasks,
  selectedTaskId,
  onTaskChange,
  onAddTask,
  journeys,
  selectedJourneyId,
  onJourneyChange,
  onStart,
  onOpenSkins,
  recentTitle,
}: {
  mode: FocusMode;
  onModeChange: (mode: FocusMode) => void;
  taskTitle: string;
  onTaskTitleChange: (value: string) => void;
  timerMode: TimerMode;
  onTimerModeChange: (mode: TimerMode) => void;
  plannedSeconds: number;
  onPlannedSecondsChange: (seconds: number) => void;
  selectedSkin: FocusSkin;
  reduceMotion: boolean;
  onSkinChange: (id: string) => void;
  skins: FocusSkin[];
  tasks: FocusTask[];
  selectedTaskId?: string;
  onTaskChange: (task: FocusTask) => void;
  onAddTask: (title: string) => void;
  journeys: Journey[];
  selectedJourneyId: string;
  onJourneyChange: (id: string) => void;
  onStart: () => void;
  onOpenSkins: () => void;
  recentTitle?: string;
}) {
  const modeLabels: Record<FocusMode, string> = { QUICK: '빠른 집중', DAILY: '오늘의 계획', JOURNEY: '긴 여정' };
  const selectedJourney = journeys.find((journey) => journey.id === selectedJourneyId);
  const journeyTask = selectedJourney ? getJourneyTask(selectedJourney, tasks) : undefined;
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const startDisabled = mode === 'QUICK' ? !taskTitle.trim() : mode === 'DAILY' ? !tasks.some((task) => task.id === selectedTaskId) : !journeyTask;
  return (
    <div className="home-screen screen-padding">
      <section className="home-hero">
        <SceneCanvas sceneState="DOCKED_VIEW" progress={0} skin={selectedSkin} reduceMotion={reduceMotion} seed={17} className="home-scene" ariaLabel="정박 중인 1인칭 보트 장면" />
        <div className="home-hero-copy">
          <p className="eyebrow">정박 중 · {selectedSkin.departureDock.name}</p>
          <h1>오늘은 어디까지<br />가볼까요?</h1>
          <p>작업 하나를 정하면, 조용한 물길이 열립니다.</p>
        </div>
      </section>

      <section className="composer-panel" aria-label="집중 시작 설정">
        <div className="composer-topline">
          <div>
            <p className="eyebrow">작은 출항 준비</p>
            <h2>지금 할 일 하나를 정하세요.</h2>
          </div>
          {recentTitle && <button className="recent-link" type="button" onClick={() => onTaskTitleChange(recentTitle)}>지난 작업 · {recentTitle}</button>}
        </div>
        <Segmented value={mode} options={['QUICK', 'DAILY', 'JOURNEY']} onChange={onModeChange} labels={modeLabels} ariaLabel="집중 모드" />

        {mode === 'QUICK' && (
          <label className="field-label">
            <span>작업</span>
            <input value={taskTitle} onChange={(event) => onTaskTitleChange(event.target.value)} placeholder="예: 설계 문서 한 단락 정리" maxLength={80} />
          </label>
        )}
        {mode === 'DAILY' && (
          <div className="daily-task-picker">
            <div className="task-picker" role="listbox" aria-label="오늘의 작업">
              {tasks.filter((task) => !task.journeyId).slice(0, 3).map((task) => (
                <button key={task.id} className={selectedTaskId === task.id ? 'task-option is-selected' : 'task-option'} type="button" onClick={() => onTaskChange(task)}>
                  <span className="task-option-check">{selectedTaskId === task.id ? '✓' : ''}</span>
                  <span>{task.title}</span>
                  <small>{Math.round(task.estimatedSeconds / 60)}분</small>
                </button>
              ))}
            </div>
            <div className="task-add-row"><input value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder="작업 추가" maxLength={80} aria-label="오늘의 작업 추가" /><button className="text-button" type="button" disabled={!newTaskTitle.trim()} onClick={() => { const title = newTaskTitle.trim(); if (!title) return; onAddTask(title); setNewTaskTitle(''); }}>추가</button></div>
          </div>
        )}
        {mode === 'JOURNEY' && (
          <label className="field-label">
            <span>이어갈 여정</span>
            <select value={selectedJourneyId} onChange={(event) => onJourneyChange(event.target.value)}>
              {journeys.map((journey) => <option key={journey.id} value={journey.id}>{journey.title}</option>)}
            </select>
          </label>
        )}

        <div className="composer-row">
          <div className="field-group">
            <span className="field-caption">시간</span>
            <Segmented
              value={String(plannedSeconds)}
              options={['900', '1500', '2700', '3600']}
              onChange={(value) => onPlannedSecondsChange(Number(value))}
              labels={{ '900': '15분', '1500': '25분', '2700': '45분', '3600': '60분' }}
              ariaLabel="집중 시간"
            />
          </div>
          <div className="field-group">
            <span className="field-caption">타이머</span>
            <Segmented value={timerMode} options={['COUNTDOWN', 'STOPWATCH']} onChange={onTimerModeChange} labels={{ COUNTDOWN: '카운트다운', STOPWATCH: '스톱워치' }} ariaLabel="타이머 방식" />
          </div>
        </div>

        <div className="skin-quick-row">
          <div>
            <span className="field-caption">환경</span>
            <div className="skin-quick-value"><span className="skin-swatch" style={{ background: selectedSkin.palette.skyBottom }} /> <strong>{selectedSkin.name}</strong><Pill tone={selectedSkin.access === 'FREE' ? 'accent' : 'premium'}>{selectedSkin.access === 'FREE' ? '무료' : 'PREVIEW'}</Pill></div>
          </div>
          <button className="text-button" type="button" onClick={onOpenSkins}>환경 둘러보기 →</button>
        </div>
        <ActionButton type="button" size="lg" className="start-button" onClick={onStart} disabled={startDisabled}>
          <span>출항하기</span><span className="button-arrow">→</span>
        </ActionButton>
      </section>
    </div>
  );
}
