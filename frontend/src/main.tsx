import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { PhaseOneSceneCapture } from './scene/PhaseOneSceneCapture';
import './styles/tokens.css';
import './styles/app.css';

const phaseOneScene = new URLSearchParams(window.location.search).get('phase1Scene');
const sceneStateByCaptureName = {
  docked: 'DOCKED_VIEW',
  departing: 'CAST_OFF',
  open: 'OPEN_WATER',
  rest: 'HARBOR_REST',
  arrival: 'APPROACHING_DESTINATION',
} as const;
const captureScene = phaseOneScene && phaseOneScene in sceneStateByCaptureName
  ? sceneStateByCaptureName[phaseOneScene as keyof typeof sceneStateByCaptureName]
  : null;

createRoot(document.getElementById('root')!).render(
  captureScene ? <PhaseOneSceneCapture sceneState={captureScene} /> : (
    <StrictMode>
      <App />
    </StrictMode>
  ),
);

const viteEnv = (import.meta as ImportMeta & { env?: { PROD?: boolean } }).env;
if (viteEnv?.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // The app remains local-first even when the installable shell is unavailable.
    });
  });
}
