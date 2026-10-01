import type { LogbookEntry } from '../domain/logbook';
import type { FocusSkin } from '../domain/skins';
import { renderScene } from '../scene/sceneRenderer';

export const createLogbookThumbnail = (entry: LogbookEntry, skin: FocusSkin, width = 640, height = 360): Promise<Blob | null> => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const sceneState = entry.endedStatus === 'ABORTED' ? 'HARBOR_REST' : 'ARRIVED';
  renderScene({ canvas, width, height, time: 0, sceneState, progress: sceneState === 'ARRIVED' ? 1 : 0, skin, reduceMotion: true, seed: entry.seed });
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
};
