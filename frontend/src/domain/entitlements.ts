export type EntitlementSource = 'STORE' | 'SYNC' | 'LOCAL';

export interface EntitlementCache {
  version: 1;
  skinIds: string[];
  productIds: string[];
  validatedAt: string;
  expiresAt: string;
  source: EntitlementSource;
}

export const ENTITLEMENT_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const emptyEntitlementCache = (now = Date.now()): EntitlementCache => ({
  version: 1,
  skinIds: [],
  productIds: [],
  validatedAt: new Date(now).toISOString(),
  expiresAt: new Date(now).toISOString(),
  source: 'LOCAL',
});

export const normalizeEntitlementCache = (value: Partial<EntitlementCache> | null | undefined, now = Date.now()): EntitlementCache => {
  const fallback = emptyEntitlementCache(now);
  const skinIds = Array.isArray(value?.skinIds) ? value.skinIds.filter((id): id is string => typeof id === 'string') : [];
  const productIds = Array.isArray(value?.productIds) ? value.productIds.filter((id): id is string => typeof id === 'string') : [];
  const validatedAt = typeof value?.validatedAt === 'string' && !Number.isNaN(Date.parse(value.validatedAt)) ? value.validatedAt : fallback.validatedAt;
  const expiresAt = typeof value?.expiresAt === 'string' && !Number.isNaN(Date.parse(value.expiresAt))
    ? value.expiresAt
    : new Date(Date.parse(validatedAt) + ENTITLEMENT_CACHE_TTL_MS).toISOString();
  const source = value?.source === 'STORE' || value?.source === 'SYNC' || value?.source === 'LOCAL' ? value.source : 'LOCAL';
  return { version: 1, skinIds: [...new Set(skinIds)], productIds: [...new Set(productIds)], validatedAt, expiresAt, source };
};

export const isEntitlementCacheFresh = (cache: EntitlementCache, now = Date.now()) => Date.parse(cache.expiresAt) > now;

export const isSkinEntitled = (cache: EntitlementCache, skinId: string, now = Date.now()) => isEntitlementCacheFresh(cache, now) && cache.skinIds.includes(skinId);

export const mergeEntitlementCache = (current: EntitlementCache, incoming: Partial<EntitlementCache>, now = Date.now()): EntitlementCache => {
  const next = normalizeEntitlementCache(incoming, now);
  return normalizeEntitlementCache({
    ...next,
    skinIds: [...current.skinIds, ...next.skinIds],
    productIds: [...current.productIds, ...next.productIds],
  }, now);
};
