import { normalizeEntitlementCache, type EntitlementCache } from '../domain/entitlements';

export type PurchaseStatus = 'SUCCESS' | 'CANCELLED' | 'UNAVAILABLE' | 'FAILED';

export interface PurchaseResult {
  status: PurchaseStatus;
  entitlements?: EntitlementCache;
  message?: string;
}

export interface PurchaseGateway {
  purchaseSkin: (skinId: string) => Promise<PurchaseResult>;
  restoreEntitlements: () => Promise<PurchaseResult>;
}

interface PurchaseResponse {
  status?: PurchaseStatus;
  entitlements?: Partial<EntitlementCache>;
  message?: string;
}

const readResponse = async (response: Response): Promise<PurchaseResponse> => {
  let body: PurchaseResponse = {};
  try {
    body = await response.json() as PurchaseResponse;
  } catch {
    // A non-JSON response is still represented as a failed purchase.
  }
  if (!response.ok) throw new Error(body.message || `purchase request failed: ${response.status}`);
  return body;
};

const toResult = (body: PurchaseResponse): PurchaseResult => ({
  status: body.status === 'SUCCESS' || body.status === 'CANCELLED' || body.status === 'UNAVAILABLE' || body.status === 'FAILED' ? body.status : 'FAILED',
  entitlements: body.entitlements ? normalizeEntitlementCache(body.entitlements) : undefined,
  message: body.message,
});

const createPurchaseRequestId = (skinId: string) => globalThis.crypto?.randomUUID?.() ?? `purchase-${skinId}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const createFetchPurchaseGateway = (endpoint: string, fetcher: typeof fetch = fetch): PurchaseGateway => ({
  async purchaseSkin(skinId) {
    try {
      const requestId = createPurchaseRequestId(skinId);
      const response = await fetcher(`${endpoint.replace(/\/$/, '')}/purchases/skin`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'idempotency-key': requestId },
        body: JSON.stringify({ skinId, requestId }),
      });
      return toResult(await readResponse(response));
    } catch (error) {
      return { status: 'FAILED', message: error instanceof Error ? error.message : String(error) };
    }
  },
  async restoreEntitlements() {
    try {
      const response = await fetcher(`${endpoint.replace(/\/$/, '')}/entitlements`, { headers: { accept: 'application/json' } });
      return toResult(await readResponse(response));
    } catch (error) {
      return { status: 'FAILED', message: error instanceof Error ? error.message : String(error) };
    }
  },
});

export const unavailablePurchaseGateway: PurchaseGateway = {
  async purchaseSkin() {
    return { status: 'UNAVAILABLE', message: '구매 서버가 설정되지 않았습니다.' };
  },
  async restoreEntitlements() {
    return { status: 'UNAVAILABLE', message: '권한 복원 서버가 설정되지 않았습니다.' };
  },
};
