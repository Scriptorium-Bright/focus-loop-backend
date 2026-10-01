import { describe, expect, it } from 'vitest';
import { dawnStaticSceneFor, dawnStaticScenePathFor } from './dawnStaticScenes';

describe('dawnStaticSceneFor', () => {
  it.each([
    ['DOCKED_VIEW', 'docked'],
    ['CAST_OFF', 'departing'],
    ['OPEN_WATER', 'open-water'],
    ['HARBOR_REST', 'harbor-rest'],
    ['APPROACHING_DESTINATION', 'arrival'],
  ] as const)('maps %s to the approved %s keyframe', (sceneState, keyframe) => {
    expect(dawnStaticSceneFor(sceneState)).toBe(keyframe);
    expect(dawnStaticScenePathFor(sceneState)).toBe(`/scenes/dawn/${keyframe}.png`);
  });

  it('uses a stable open-water still while harbor search motion is deferred', () => {
    expect(dawnStaticSceneFor('SEARCHING_HARBOR')).toBe('open-water');
  });
});
