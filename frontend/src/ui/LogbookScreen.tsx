import { useMemo, useState } from 'react';
import { defaultSkin, type FocusSkin } from '../domain/skins';
import type { LogbookEntry } from '../domain/logbook';
import { formatClock } from '../domain/session/timerClock';
import { SceneCanvas } from '../scene/SceneCanvas';
import { ActionButton, EmptyState, Pill, SectionHeading } from './primitives';

export function LogbookScreen({ entries, skins, onContinue, onDelete, onDeleteAll, onExport, onExportCsv, onExportImage, onPromoteToDaily, onPromoteToJourney }: { entries: LogbookEntry[]; skins: FocusSkin[]; onContinue: (entry: LogbookEntry) => void; onDelete: (entry: LogbookEntry) => void; onDeleteAll: () => void; onExport: () => void; onExportCsv: () => void; onExportImage: (entry: LogbookEntry) => void; onPromoteToDaily: (entry: LogbookEntry) => void; onPromoteToJourney: (entry: LogbookEntry) => void }) {
  const [tab, setTab] = useState<'TODAY' | 'WEEK' | 'JOURNEY'>('TODAY');
  const visibleEntries = useMemo(() => {
    const now = new Date();
    return entries.filter((entry) => {
      if (tab === 'JOURNEY') return entry.mode === 'JOURNEY';
      if (tab === 'TODAY') return new Date(entry.createdAt).toDateString() === now.toDateString();
      return Date.now() - new Date(entry.createdAt).getTime() < 7 * 86400000;
    });
  }, [entries, tab]);
  const total = visibleEntries.reduce((sum, entry) => sum + entry.focusedSeconds, 0);
  const completedCount = visibleEntries.filter((entry) => entry.taskCompleted).length;
  return (
    <div className="content-screen screen-padding">
      <SectionHeading eyebrow="항해일지" title="보낸 시간이 남아 있어요." detail="점수 대신, 지나온 물길을 기록합니다." action={<div className="log-actions"><ActionButton variant="quiet" size="sm" type="button" onClick={onExport}>JSON 내보내기</ActionButton><ActionButton variant="quiet" size="sm" type="button" onClick={onExportCsv}>CSV 내보내기</ActionButton>{entries.length > 0 && <button className="text-button danger-text" type="button" onClick={onDeleteAll}>모두 삭제</button>}</div>} />
      <div className="log-tabs" role="tablist" aria-label="항해일지 기간"><button id="log-tab-today" role="tab" aria-selected={tab === 'TODAY'} aria-controls="log-panel" className={tab === 'TODAY' ? 'log-tab is-active' : 'log-tab'} type="button" onClick={() => setTab('TODAY')}>오늘</button><button id="log-tab-week" role="tab" aria-selected={tab === 'WEEK'} aria-controls="log-panel" className={tab === 'WEEK' ? 'log-tab is-active' : 'log-tab'} type="button" onClick={() => setTab('WEEK')}>이번 주</button><button id="log-tab-journey" role="tab" aria-selected={tab === 'JOURNEY'} aria-controls="log-panel" className={tab === 'JOURNEY' ? 'log-tab is-active' : 'log-tab'} type="button" onClick={() => setTab('JOURNEY')}>긴 여정</button></div>
      <section className="log-summary"><div><span>집중한 시간</span><strong>{formatClock(total, true)}</strong></div><div><span>{tab === 'WEEK' ? '완료한 작업' : '항해 횟수'}</span><strong>{tab === 'WEEK' ? completedCount : visibleEntries.length}</strong></div><div><span>방문 항구</span><strong>{new Set(visibleEntries.flatMap((entry) => entry.visitedHarborIds)).size}</strong></div></section>
      <section id="log-panel" role="tabpanel" aria-labelledby={`log-tab-${tab.toLowerCase()}`}>{visibleEntries.length === 0 ? <EmptyState title="아직 항해일지가 없어요." detail="첫 항해를 마치면 이곳에 조용히 남습니다." /> : <div className="logbook-list">{visibleEntries.map((entry) => <LogbookCard key={entry.id} entry={entry} skin={skins.find((skin) => skin.id === entry.skinId)} onContinue={() => onContinue(entry)} onDelete={() => onDelete(entry)} onExportImage={() => onExportImage(entry)} onPromoteToDaily={() => onPromoteToDaily(entry)} onPromoteToJourney={() => onPromoteToJourney(entry)} />)}</div>}</section>
    </div>
  );
}

function LogbookCard({ entry, skin, onContinue, onDelete, onExportImage, onPromoteToDaily, onPromoteToJourney }: { entry: LogbookEntry; skin?: FocusSkin; onContinue: () => void; onDelete: () => void; onExportImage: () => void; onPromoteToDaily: () => void; onPromoteToJourney: () => void }) {
  const snapshotSkin = skin ?? defaultSkin;
  const snapshotState = entry.endedStatus === 'ABORTED' ? 'HARBOR_REST' : 'ARRIVED';
  return <article className="logbook-card"><div className="logbook-card-art"><SceneCanvas sceneState={snapshotState} progress={snapshotState === 'ARRIVED' ? 1 : 0} skin={snapshotSkin} reduceMotion seed={entry.seed} className="logbook-card-scene" ariaLabel={`${snapshotSkin.name} 항해 스냅샷`} /></div><div className="logbook-card-body"><div className="logbook-card-meta"><Pill tone="accent">{entry.taskCompleted ? '완료' : '이어가기'}</Pill><time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</time></div><p className="logbook-snapshot-label">{snapshotSkin.name} · {entry.visitedHarborIds.length > 0 ? '쉼터를 거친 항해' : '바다로 나간 항해'}</p><h2>{entry.title}</h2><div className="logbook-card-stats"><span>{formatClock(entry.focusedSeconds, true)} 집중</span><span>{entry.restSeconds > 0 ? `${formatClock(entry.restSeconds)} 휴식` : '휴식 없음'}</span><span>{entry.pauseCount}회 정박</span><span>{snapshotSkin.name}</span></div>{entry.note && <p className="logbook-note">“{entry.note}”</p>}<div className="logbook-card-actions"><ActionButton type="button" variant="quiet" size="sm" onClick={onContinue}>같은 작업 이어가기 <span>→</span></ActionButton><button className="text-button" type="button" onClick={onExportImage}>공유 이미지</button><button className="text-button danger-text" type="button" onClick={onDelete}>삭제</button></div>{entry.mode === 'QUICK' && <div className="logbook-promote"><span>이 작업을 계획으로 남기기</span><button className="text-button" type="button" onClick={onPromoteToDaily}>오늘의 계획에 추가</button><button className="text-button" type="button" onClick={onPromoteToJourney}>긴 여정으로 승격</button></div>}</div></article>;
}
