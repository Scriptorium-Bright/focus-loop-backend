import { useEffect, useState } from 'react';
import type { FocusSkin } from '../domain/skins';
import { getSearchSeconds, getRemainingSeconds, formatClock } from '../domain/session/timerClock';
import type { FocusSession, SessionMachine, SessionStatus } from '../domain/session/sessionTypes';
import { SceneCanvas } from '../scene/SceneCanvas';
import { getHarborSearchProgress, getSceneProgress } from '../scene/sceneTiming';
import { ActionButton, IconButton, Pill } from './primitives';

export function FocusScreen({
  machine,
  skin,
  focusSeconds,
  onPause,
  onSearchSkip,
  onSearchCancel,
  onComplete,
  onAbort,
  onSceneFailure,
  onSave,
  soundEnabled,
  onSoundToggle,
  reduceMotion,
  focusAutoHide,
  onFps,
}: {
  machine: SessionMachine;
  skin: FocusSkin;
  focusSeconds: number;
  onPause: () => void;
  onSearchSkip: () => void;
  onSearchCancel: () => void;
  onComplete: () => void;
  onAbort: () => void;
  onSceneFailure: () => void;
  onSave: (taskCompleted: boolean, note: string) => void;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  reduceMotion: boolean;
  focusAutoHide: boolean;
  onFps?: (fps: number) => void;
}) {
  const session = machine.session as FocusSession;
  const [controlsVisible, setControlsVisible] = useState(true);
  const [taskCompleted, setTaskCompleted] = useState(true);
  const [note, setNote] = useState('');
  const isFinished = machine.status === 'COMPLETED' || machine.status === 'ABORTED';
  const searchSeconds = getSearchSeconds(session, machine.now);
  const searchProgress = getHarborSearchProgress(machine);
  const sceneProgress = getSceneProgress(machine, reduceMotion);

  useEffect(() => {
    if (!focusAutoHide || !controlsVisible || machine.status !== 'ACTIVE') return undefined;
    const timeout = window.setTimeout(() => setControlsVisible(false), 4800);
    return () => window.clearTimeout(timeout);
  }, [controlsVisible, focusAutoHide, machine.status]);

  useEffect(() => {
    if (machine.status !== 'ACTIVE') setControlsVisible(true);
  }, [machine.status]);

  const revealControls = () => {
    if (machine.status === 'ACTIVE') setControlsVisible(true);
  };

  const timerLabel = session.timerMode === 'COUNTDOWN'
    ? formatClock(getRemainingSeconds(session, machine.now))
    : formatClock(focusSeconds, true);

  return (
    <div className="focus-screen">
      <SceneCanvas
        sceneState={machine.sceneState}
        progress={sceneProgress}
        skin={skin}
        reduceMotion={reduceMotion}
        seed={session.seed}
        harborSearchProgress={searchProgress}
        className="focus-scene"
        onError={onSceneFailure}
        onFps={onFps}
        onClick={revealControls}
        ariaLabel={`${skin.name} ${sceneLabel(machine.status)} 장면`}
      />
      <div className={`focus-vignette focus-state-${machine.status.toLowerCase()}`} />
      {!isFinished && (
        <div className={`${!focusAutoHide || controlsVisible || machine.status !== 'ACTIVE' ? 'focus-controls is-visible' : 'focus-controls'} focus-controls-${machine.status.toLowerCase()}`}>
          <div className="focus-heading">
            <div>
              <h1>{session.taskTitle}</h1>
            </div>
            <div className="focus-actions-top">
              <IconButton name={soundEnabled ? 'sound' : 'sound-off'} label={soundEnabled ? '소리 끄기' : '소리 켜기'} onClick={onSoundToggle} />
              <IconButton name="exit" label="항해 종료" onClick={onAbort} />
            </div>
          </div>
          {machine.status !== 'HARBOR_SEARCH' && machine.status !== 'ARRIVING' && (
            <div className="focus-timer" aria-live="polite">{timerLabel}</div>
          )}
          {machine.status === 'ARRIVING' && (
            <p className="focus-arrival-whisper">목적지가 가까워지고 있어요</p>
          )}
          {machine.status === 'ACTIVE' && (
            <div className="focus-bottom-actions"><ActionButton variant="secondary" size="lg" type="button" onClick={onPause}><span>잠시 정박</span></ActionButton><ActionButton variant="quiet" size="lg" type="button" onClick={onComplete}>완료</ActionButton></div>
          )}
          {machine.status === 'HARBOR_SEARCH' && (
            <div className="harbor-search-actions" aria-label="쉼터 탐색 선택">
              <p className="harbor-search-whisper"><span className="eyebrow">쉼터 탐색</span><span>{formatClock(Math.max(0, 15 - Math.floor(searchSeconds)))}</span></p>
              <div className="focus-bottom-actions"><ActionButton type="button" onClick={onSearchSkip}>바로 쉬기</ActionButton><ActionButton variant="quiet" type="button" onClick={onSearchCancel}>집중으로 돌아가기</ActionButton></div>
            </div>
          )}
        </div>
      )}
      {isFinished && (
        <div className="completion-overlay">
          <div className="completion-card">
            <Pill tone="accent">{machine.status === 'ABORTED' ? '중간 정박' : '항해 도착'}</Pill>
            <h1>{machine.status === 'ABORTED' ? '잠시 멈춘 시간도 기록할까요?' : '이번 항해를 마쳤습니다.'}</h1>
            <p>집중한 시간 {formatClock(focusSeconds, true)} · 항구 {session.visitedHarborIds.length}곳</p>
            <div className="completion-choice" role="group" aria-label="작업 완료 여부">
              <button type="button" className={taskCompleted ? 'choice-button is-selected' : 'choice-button'} onClick={() => setTaskCompleted(true)}>완료했어요 <span>✓</span></button>
              <button type="button" className={!taskCompleted ? 'choice-button is-selected' : 'choice-button'} onClick={() => setTaskCompleted(false)}>다음에 이어갈게요</button>
            </div>
            <label className="field-label"><span>한 줄 메모 <small>선택</small></span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="오늘의 물결은 어땠나요?" rows={3} maxLength={180} /></label>
            <ActionButton type="button" size="lg" onClick={() => onSave(taskCompleted, note)} className="full-button">항해일지에 남기기 <span>→</span></ActionButton>
          </div>
        </div>
      )}
    </div>
  );
}

function sceneLabel(status: SessionStatus) {
  const labels: Record<SessionStatus, string> = {
    READY: '정박 중',
    DEPARTING: '출항',
    ACTIVE: '항해 중',
    HARBOR_SEARCH: '쉼터 탐색',
    RESTING: '정박 중',
    RESUMING: '재출항',
    ARRIVING: '도착 중',
    COMPLETED: '도착',
    ABORTED: '중간 정박',
  };
  return labels[status];
}
