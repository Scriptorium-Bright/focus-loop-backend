import { describe, expect, it } from 'vitest';
import { emptyEntitlementCache, isSkinEntitled, mergeEntitlementCache, normalizeEntitlementCache } from './entitlements';

describe('offline entitlement cache', () => {
  it('requires a fresh validation timestamp before applying a purchased skin', () => {
    const now = Date.parse('2026-01-01T00:00:00.000Z');
    const cache = normalizeEntitlementCache({ skinIds: ['RAIN'], validatedAt: new Date(now).toISOString(), expiresAt: new Date(now + 60_000).toISOString(), source: 'STORE' }, now);

    expect(isSkinEntitled(cache, 'RAIN', now + 59_999)).toBe(true);
    expect(isSkinEntitled(cache, 'RAIN', now + 60_000)).toBe(false);
  });

  it('merges server entitlements without duplicate ids', () => {
    const now = Date.parse('2026-01-01T00:00:00.000Z');
    const current = normalizeEntitlementCache({ ...emptyEntitlementCache(now), skinIds: ['RAIN'], validatedAt: new Date(now).toISOString(), expiresAt: new Date(now + 60_000).toISOString() }, now);
    const merged = mergeEntitlementCache(current, { skinIds: ['RAIN', 'MOON'], productIds: ['pack-night'], validatedAt: new Date(now).toISOString(), expiresAt: new Date(now + 60_000).toISOString(), source: 'SYNC' }, now);

    expect(merged.skinIds).toEqual(['RAIN', 'MOON']);
    expect(merged.productIds).toEqual(['pack-night']);
    expect(merged.source).toBe('SYNC');
  });
});
