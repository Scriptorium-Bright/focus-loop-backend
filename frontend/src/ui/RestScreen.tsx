import type { FocusSkin } from '../domain/skins';
import type { RestMode, SessionMachine } from '../domain/session/sessionTypes';
import { getRestSeconds, formatClock } from '../domain/session/timerClock';
import { SceneCanvas } from '../scene/SceneCanvas';
import { ActionButton, IconButton, Segmented } from './primitives';

export function RestScreen({
  machine,
  skin,
  reduceMotion,
  soundEnabled,
  onSoundToggle,
  onModeChange,
  onResume,
  onEnd,
  onSceneFailure,
  onFps,
}: {
  machine: SessionMachine;
  skin: FocusSkin;
  reduceMotion: boolean;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  onModeChange: (mode: RestMode) => void;
  onResume: () => void;
  onEnd: () => void;
  onSceneFailure: () => void;
  onFps?: (fps: number) => void;
}) {
  const session = machine.session!;
  const restSeconds = getRestSeconds(session, machine.now);
  const restLimit = session.restMode === 'FIVE' ? 300 : session.restMode === 'TEN' ? 600 : undefined;
  const remaining = restLimit === undefined ? 0 : Math.max(0, restLimit - restSeconds);
  const harbor = skin.pauseHarbors.find((candidate) => session.visitedHarborIds.includes(candidate.id)) ?? skin.pauseHarbors[0] ?? skin.harbors[0];
  return (
    <div className="rest-screen">
      <SceneCanvas sceneState="HARBOR_REST" progress={0} skin={skin} reduceMotion={reduceMotion} seed={session.seed} className="rest-scene" onError={onSceneFailure} onFps={onFps} ariaLabel={`${skin.name} 휴식 항구`} />
      <div className="rest-shade" />
      <div className="rest-content">
        <div className="rest-topline"><div><p className="eyebrow">{skin.name} · {harbor?.name ?? '쉼터 항구'}</p><h1>잠시 정박 중</h1></div><IconButton name={soundEnabled ? 'sound' : 'sound-off'} label={soundEnabled ? '소리 끄기' : '소리 켜기'} onClick={onSoundToggle} /></div>
        <p className="rest-description">{harbor?.description ?? '준비되면 같은 여정을 이어갈 수 있어요.'}</p>
        <div className="rest-timer">{restLimit === undefined ? formatClock(restSeconds, true) : formatClock(remaining)}</div>
        <div className="rest-options"><span className="field-caption">휴식 시간</span><Segmented value={session.restMode ?? 'FIVE'} options={['FIVE', 'TEN', 'FREE']} onChange={onModeChange} labels={{ FIVE: '5분', TEN: '10분', FREE: '자유롭게' }} ariaLabel="휴식 시간" /></div>
        <div className="rest-actions"><ActionButton type="button" size="lg" onClick={onResume}>다시 출항하기 <span>→</span></ActionButton><button className="text-button light" type="button" onClick={onEnd}>이번 항해 기록하기</button></div>
      </div>
    </div>
  );
}
