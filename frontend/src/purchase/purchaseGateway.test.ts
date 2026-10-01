import { describe, expect, it, vi } from 'vitest';
import { createFetchPurchaseGateway } from './purchaseGateway';

describe('purchase gateway boundary', () => {
  it('sends only a skin id and keeps validated entitlements for offline use', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'SUCCESS', entitlements: { skinIds: ['RAIN'], productIds: ['skin-rain'], validatedAt: '2026-01-01T00:00:00.000Z', expiresAt: '2026-02-01T00:00:00.000Z', source: 'STORE' } }),
    });
    const result = await createFetchPurchaseGateway('https://purchase.example.test', fetcher).purchaseSkin('RAIN');

    const request = fetcher.mock.calls[0][1] as RequestInit;
    expect(fetcher).toHaveBeenCalledWith('https://purchase.example.test/purchases/skin', expect.objectContaining({ method: 'POST' }));
    expect(request.headers).toMatchObject({ 'content-type': 'application/json', 'idempotency-key': expect.any(String) });
    expect(JSON.parse(String(request.body))).toMatchObject({ skinId: 'RAIN', requestId: expect.any(String) });
    expect(result.status).toBe('SUCCESS');
    expect(result.entitlements?.skinIds).toEqual(['RAIN']);
  });

  it('turns non-2xx responses into a retryable failure result', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({ message: 'temporarily unavailable' }) });
    const result = await createFetchPurchaseGateway('https://purchase.example.test', fetcher).restoreEntitlements();

    expect(result.status).toBe('FAILED');
    expect(result.message).toBe('temporarily unavailable');
  });
});
