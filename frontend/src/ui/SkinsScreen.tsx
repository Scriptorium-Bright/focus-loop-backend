import { useEffect, useRef, useState } from 'react';
import { AmbientAudio } from '../audio/ambientAudio';
import type { FocusSkin } from '../domain/skins';
import { SceneCanvas } from '../scene/SceneCanvas';
import { ActionButton, Pill, SectionHeading } from './primitives';

export function SkinsScreen({ skins, selectedSkinId, unlockedSkinIds, reduceMotion, soundEnabled, purchaseMessage, onApply, onPurchase, onRestore, onPreview, onFps }: { skins: FocusSkin[]; selectedSkinId: string; unlockedSkinIds: string[]; reduceMotion: boolean; soundEnabled: boolean; purchaseMessage: string; onApply: (id: string) => void; onPurchase: (id: string) => void; onRestore: () => void; onPreview: (id: string) => void; onFps?: (fps: number) => void }) {
  const [previewId, setPreviewId] = useState(selectedSkinId);
  const [previewStage, setPreviewStage] = useState(0);
  const [soundPreviewing, setSoundPreviewing] = useState(false);
  const previewAudioRef = useRef<AmbientAudio>();
  const soundTimerRef = useRef<number>();
  const previewSkin = skins.find((skin) => skin.id === previewId) ?? skins[0];
  if (!previewAudioRef.current) previewAudioRef.current = new AmbientAudio();
  useEffect(() => {
    if (reduceMotion) return undefined;
    const id = window.setInterval(() => setPreviewStage((stage) => (stage + 1) % 5), 2200);
    return () => window.clearInterval(id);
  }, [previewId, reduceMotion]);
  useEffect(() => () => {
    if (soundTimerRef.current) window.clearTimeout(soundTimerRef.current);
    previewAudioRef.current?.dispose();
  }, []);
  useEffect(() => {
    if (!soundEnabled) {
      if (soundTimerRef.current) window.clearTimeout(soundTimerRef.current);
      previewAudioRef.current?.stop();
      setSoundPreviewing(false);
    }
  }, [soundEnabled]);
  const sceneStates = ['DOCKED_VIEW', 'CAST_OFF', 'OPEN_WATER', 'HARBOR_REST', 'APPROACHING_DESTINATION'] as const;
  const canApply = previewSkin.access === 'FREE' || unlockedSkinIds.includes(previewSkin.id);
  const accessLabel = previewSkin.access === 'FREE' ? '무료 환경' : unlockedSkinIds.includes(previewSkin.id) ? '구매 완료 · 오프라인 사용 가능' : previewSkin.access === 'UNLOCK' ? '여정 완료로 해금' : 'PREMIUM 미리보기';
  const toggleSoundPreview = () => {
    if (soundPreviewing) {
      if (soundTimerRef.current) window.clearTimeout(soundTimerRef.current);
      previewAudioRef.current?.stop();
      setSoundPreviewing(false);
      return;
    }
    if (!soundEnabled) return;
    previewAudioRef.current?.setEnabled(true);
    const started = previewAudioRef.current?.start(previewSkin.audio) ?? false;
    if (!started) return;
    setSoundPreviewing(true);
    soundTimerRef.current = window.setTimeout(() => {
      previewAudioRef.current?.stop();
      setSoundPreviewing(false);
    }, 8000);
  };
  const applyDisabled = selectedSkinId === previewSkin.id || (!canApply && previewSkin.access !== 'PREMIUM');
  const primaryAction = selectedSkinId === previewSkin.id
    ? () => undefined
    : canApply
      ? () => onApply(previewSkin.id)
      : previewSkin.access === 'PREMIUM'
        ? () => onPurchase(previewSkin.id)
        : () => undefined;
  const primaryLabel = selectedSkinId === previewSkin.id ? '현재 환경' : canApply ? '이 환경으로 출항' : previewSkin.access === 'PREMIUM' ? '구매하기' : '미리보기만 가능';
  return <div className="content-screen screen-padding"><SectionHeading eyebrow="환경" title="다른 물빛을 골라보세요." detail="스킨은 색보다 넓은 감각의 묶음입니다." action={<ActionButton type="button" variant="quiet" size="sm" onClick={onRestore}>구매 내역 복원</ActionButton>} /><section className="skin-preview-panel"><SceneCanvas sceneState={sceneStates[previewStage]} progress={previewStage / 4} skin={previewSkin} reduceMotion={reduceMotion} seed={previewId.length * 7} className="skin-preview-scene" ariaLabel={`${previewSkin.name} ${['정박', '출항', '항해', '항구', '도착'][previewStage]} 미리보기`} onFps={onFps} /><div className="skin-preview-copy"><Pill tone={previewSkin.access === 'FREE' || unlockedSkinIds.includes(previewSkin.id) ? 'accent' : 'premium'}>{accessLabel}</Pill><h2>{previewSkin.name}</h2><p>{previewSkin.mood}</p><p className="skin-preview-sequence">정박 → 출항 → 항해 → 항구 → 도착</p><p className="skin-preview-audio"><span aria-hidden="true">◖))</span> {previewSkin.audio.ambient}</p><div className="preview-dots" aria-label="미리보기 장면 진행">{sceneStates.map((_, index) => <span key={index} className={index === previewStage ? 'dot is-active' : 'dot'} />)}</div><div className="skin-preview-actions"><ActionButton type="button" variant="quiet" onClick={toggleSoundPreview} disabled={!soundEnabled}>{soundPreviewing ? '소리 미리보기 중지' : '소리 미리보기'}</ActionButton><ActionButton type="button" disabled={applyDisabled} onClick={primaryAction}>{primaryLabel} <span>→</span></ActionButton></div>{purchaseMessage && <p className="skin-purchase-message" role="status">{purchaseMessage}</p>}</div></section><div className="skin-grid">{skins.map((skin) => <button key={skin.id} type="button" className={previewId === skin.id ? 'skin-card is-selected' : 'skin-card'} onClick={() => { if (soundTimerRef.current) window.clearTimeout(soundTimerRef.current); previewAudioRef.current?.stop(); setSoundPreviewing(false); setPreviewId(skin.id); setPreviewStage(0); onPreview(skin.id); }}><span className="skin-card-art" style={{ background: `linear-gradient(145deg, ${skin.palette.skyTop}, ${skin.sky.glow} 46%, ${skin.palette.water})` }}><span className="skin-card-bow" /></span><span className="skin-card-copy"><strong>{skin.name}</strong><small>{skin.mood}</small><Pill tone={skin.access === 'FREE' || unlockedSkinIds.includes(skin.id) ? 'accent' : 'premium'}>{skin.access === 'FREE' ? '무료' : unlockedSkinIds.includes(skin.id) ? '사용 가능' : skin.access === 'UNLOCK' ? '해금 필요' : 'PREMIUM'}</Pill></span></button>)}</div></div>;
}
