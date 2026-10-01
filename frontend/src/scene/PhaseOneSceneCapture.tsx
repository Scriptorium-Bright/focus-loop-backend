import { SceneCanvas } from './SceneCanvas';
import { defaultSkin } from '../domain/skins';
import type { SceneState } from '../domain/session/sessionTypes';

interface PhaseOneSceneCaptureProps {
  sceneState: Extract<SceneState, 'DOCKED_VIEW' | 'CAST_OFF' | 'OPEN_WATER' | 'HARBOR_REST' | 'APPROACHING_DESTINATION'>;
}

/**
 * Full-viewport, chrome-free scene used for the Phase 1 visual evidence.
 * It is only mounted from the ?phase1Scene= query entry in main.tsx so the
 * normal Home/Focus/Rest composition stays unchanged during visual evidence
 * capture.
 */
export function PhaseOneSceneCapture({ sceneState }: PhaseOneSceneCaptureProps) {
  return (
    <main className="phase-one-capture" aria-label="Phase 1 장면 캡처">
      <SceneCanvas
        sceneState={sceneState}
        progress={sceneState === 'OPEN_WATER' ? 0.38 : sceneState === 'APPROACHING_DESTINATION' ? 0.9 : 0}
        skin={defaultSkin}
        reduceMotion={false}
        seed={17}
        className="phase-one-capture-canvas"
        ariaLabel={sceneState === 'DOCKED_VIEW' ? '정박한 배에서 바라본 장면' : sceneState === 'CAST_OFF' ? '출항 중인 배에서 바라본 장면' : sceneState === 'HARBOR_REST' ? '휴식 항구 장면' : sceneState === 'APPROACHING_DESTINATION' ? '목적지에 도착하는 장면' : '넓은 바다를 항해하는 장면'}
      />
    </main>
  );
}
