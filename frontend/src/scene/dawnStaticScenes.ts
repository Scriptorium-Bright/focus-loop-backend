import type { SceneState } from '../domain/session/sessionTypes';

export type DawnStaticScene = 'docked' | 'departing' | 'open-water' | 'harbor-rest' | 'arrival';

const paths: Record<DawnStaticScene, string> = {
  docked: '/scenes/dawn/docked.png',
  departing: '/scenes/dawn/departing.png',
  'open-water': '/scenes/dawn/open-water.png',
  'harbor-rest': '/scenes/dawn/harbor-rest.png',
  arrival: '/scenes/dawn/arrival.png',
};

/**
 * Phase 1 is intentionally a set of still compositions. Transitions that
 * belong to a later motion pass resolve to their closest approved keyframe.
 */
export const dawnStaticSceneFor = (sceneState: SceneState): DawnStaticScene => {
  switch (sceneState) {
    case 'DOCKED_VIEW':
      return 'docked';
    case 'CAST_OFF':
    case 'LEAVING_HARBOR':
      return 'departing';
    case 'HARBOR_REST':
      return 'harbor-rest';
    case 'APPROACHING_DESTINATION':
    case 'ARRIVED':
      return 'arrival';
    case 'SEARCHING_HARBOR':
    case 'OPEN_WATER':
    default:
      return 'open-water';
  }
};

export const dawnStaticScenePathFor = (sceneState: SceneState) => paths[dawnStaticSceneFor(sceneState)];

export const dawnStaticScenePaths = Object.values(paths);
