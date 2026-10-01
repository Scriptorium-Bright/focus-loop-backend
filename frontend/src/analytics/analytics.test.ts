import { describe, expect, it } from 'vitest';
import { LocalAnalytics, taskLengthBucket } from './analytics';

describe('privacy-safe analytics', () => {
  it('stores only catalog properties and never task text', () => {
    const analytics = new LocalAnalytics();
    analytics.track('task_entered', { title: '민감한 작업명', taskTitle: '민감한 작업명', task_title: '민감한 작업명', note: '민감한 메모', length_bucket: taskLengthBucket('민감한 작업명'), mode: 'QUICK' });

    expect(analytics.snapshot()[0].properties).toEqual({ length_bucket: '0-9', mode: 'QUICK' });
  });
});
