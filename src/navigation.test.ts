import { expect, it, vi } from 'vitest';
import { Royaltyport } from './client.js';
import type { ContractRecording, PaginatedResult } from './types/index.js';

const revision = 'r1_verified';
const self = '/v1/contracts/42/extractions/recordings?projectId=p&perPage=1&citations=true&expectedRevision=r1_verified&page=1';
const next = self.replace('page=1', 'page=2');
const reply = (page: number, link: string | null) => new Response(JSON.stringify({
  data: { items: [{ id: page }], total_count: 2, page, per_page: 1 }, meta: { revision }, links: { self: page === 1 ? self : next, next: link },
}), { headers: { 'Royaltyport-Version': '2026-10-20.birch' } });

it('preserves extraction navigation/revision and follows next without losing scope or credentials', async () => {
  const fetch = vi.fn().mockResolvedValueOnce(reply(1, next)).mockResolvedValueOnce(reply(2, null));
  const sdk = new Royaltyport({ apiKey: 'dummy-key', baseUrl: 'https://api.example.test', fetch });
  const first = await sdk.contracts.listExtraction('p', 42, 'recordings', { perPage: 1, citations: true, expectedRevision: revision });
  expect(first.links).toEqual({ self, next });
  expect(first.meta?.revision).toBe(revision);
  const second = await sdk.follow<PaginatedResult<ContractRecording>>(first.links!.next!);
  expect(second.links?.next).toBeNull();
  expect(second.meta?.revision).toBe(revision);
  expect(fetch.mock.calls[1]![0]).toBe('https://api.example.test' + next);
  for (const [, init] of fetch.mock.calls) {
    expect(new Headers(init!.headers).get('Authorization')).toBe('Bearer dummy-key');
    expect(new Headers(init!.headers).get('Royaltyport-Version')).toBe('2026-10-20.birch');
  }
  expect(fetch.mock.calls[1]![1]?.redirect).toBe('error');
});

it.each([
  'https://storage.example.test/signed?token=x', '//evil.example.test/v1/projects',
  'https://api.example.test/v2/projects', 'https://user:pass@api.example.test/v1/projects',
  '/v1/projects#fragment', 'https://api.example.test/oauth/token',
])('rejects non-API navigation before sending credentials: %s', async href => {
  const fetch = vi.fn();
  const sdk = new Royaltyport({ apiKey: 'dummy', baseUrl: 'https://api.example.test', fetch });
  await expect(sdk.follow(href)).rejects.toThrow('Navigation links');
  expect(fetch).not.toHaveBeenCalled();
});
