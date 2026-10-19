import { describe, expect, it, vi } from 'vitest';
import { Contracts } from './contracts.js';
import { Statements } from './statements.js';
import { HttpClient } from '../http.js';

const pause_id = 'b0bcb400-1dd5-4a92-8943-d4aacb6aca10';
const body = { pause_id, action: 'retry' as const, input: {} };
function fixture(fetch: typeof globalThis.fetch) {
  const http = new HttpClient({ baseUrl: 'http://localhost:3000', token: 'local-test', fetch, retryDelay: 0 });
  return { contracts: new Contracts(http), statements: new Statements(http) };
}

describe('durable staging resolution', () => {
  it.each(['contracts', 'statements'] as const)('posts %s decisions with caller key and preserves metadata', async kind => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { status: 'queued' }, meta: { decision_id: 'decision-1' } }), { status: 202 }));
    const result = await fixture(fetch)[kind].resolveStaging('project-1', 42, body, { idempotencyKey: 'decision-1' });
    expect(fetch).toHaveBeenCalledWith(`http://localhost:3000/v1/${kind}/staging/42/resolve?projectId=project-1`, expect.objectContaining({ method: 'POST', body: JSON.stringify(body), headers: expect.objectContaining({ 'Idempotency-Key': 'decision-1' }) }));
    expect(result.meta).toEqual({ decision_id: 'decision-1' });
  });
  it('replays identical key and bytes after network acknowledgement loss', async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new TypeError('connection lost')).mockResolvedValueOnce(new Response(JSON.stringify({ data: { status: 'queued' } }), { status: 202 }));
    await fixture(fetch).contracts.resolveStaging('project-1', 42, body, { idempotencyKey: 'stable-key' });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[0]).toEqual(fetch.mock.calls[1]);
  });
  it('does not retry a conflicting decision', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 'idempotency_conflict', message: 'Key already used' } }), { status: 409 }));
    await expect(fixture(fetch).contracts.resolveStaging('project-1', 42, body, { idempotencyKey: 'stable-key' })).rejects.toMatchObject({ status: 409, code: 'idempotency_conflict', message: 'Key already used' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('supports structured contract split selection without changing it', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { status: 'queued' } }), { status: 202 }));
    const split = { pause_id, action: 'approve_split' as const, input: { agreements: [{ title: 'Agreement', start_page: 1, end_page: 2, process: true }] } };
    await fixture(fetch).contracts.resolveStaging('project-1', 42, split, { idempotencyKey: 'split-1' });
    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ body: JSON.stringify(split) }));
  });
  it.each(['', 'contains space', 'x'.repeat(201)])('rejects invalid key %j before sending', async idempotencyKey => {
    const fetch = vi.fn();
    await expect(fixture(fetch).contracts.resolveStaging('project-1', 42, body, { idempotencyKey })).rejects.toThrow('idempotencyKey');
    expect(fetch).not.toHaveBeenCalled();
  });
});
