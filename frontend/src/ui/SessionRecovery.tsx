import type { FocusSkin } from '../domain/skins';
import { getFocusSeconds, getRestSeconds, formatClock } from '../domain/session/timerClock';
import type { SessionMachine } from '../domain/session/sessionTypes';
import { SceneCanvas } from '../scene/SceneCanvas';
import { getHarborSearchProgress, getSceneProgress } from '../scene/sceneTiming';
import { ActionButton, Pill } from './primitives';

export function SessionRecovery({ machine, skin, reduceMotion, onContinue, onRecord }: { machine: SessionMachine; skin: FocusSkin; reduceMotion: boolean; onContinue: () => void; onRecord: () => void }) {
  const session = machine.session;
  if (!session) return null;
  const focusSeconds = getFocusSeconds(session, machine.now);
  const restSeconds = getRestSeconds(session, machine.now);
  const statusLabel = machine.status === 'RESTING' ? '휴식 항구' : machine.status === 'HARBOR_SEARCH' ? '쉼터 탐색' : '항해 중';
  return (
    <div className="recovery-backdrop">
      <section className="recovery-card" role="dialog" aria-modal="true" aria-labelledby="recovery-title">
        <SceneCanvas sceneState={machine.sceneState} progress={getSceneProgress(machine, reduceMotion)} harborSearchProgress={getHarborSearchProgress(machine)} skin={skin} reduceMotion={reduceMotion} seed={session.seed} className="recovery-scene" ariaLabel={`${skin.name} 복구된 항해 장면`} />
        <div className="recovery-copy">
          <Pill tone="accent">복구된 항해 · {statusLabel}</Pill>
          <h1 id="recovery-title">이 항해를 이어갈까요?</h1>
          <p className="recovery-task">{session.taskTitle}</p>
          <div className="recovery-stats"><span>집중 {formatClock(focusSeconds, true)}</span><span>휴식 {formatClock(restSeconds, true)}</span><span>{session.pauseCount}회 정박</span></div>
          <div className="recovery-actions"><ActionButton type="button" size="lg" onClick={onContinue}>이어가기 <span>→</span></ActionButton><ActionButton type="button" variant="secondary" size="lg" onClick={onRecord}>중간 정박으로 기록</ActionButton></div>
          <p className="recovery-note">마지막 저장 시점의 시간이 복구되었습니다. 기록을 선택하면 완료 여부와 메모를 다시 정할 수 있습니다.</p>
        </div>
      </section>
    </div>
  );
}
