import { describe, it, expect, vi } from 'vitest';
import { Royaltyport } from './client.js';
import { HttpClient } from './http.js';
import { API_RELEASE } from './versioning.js';

describe('API release pin', () => {
  it('retains the exact pin across retry and exposes the resolved version', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response('{}', { status: 503, headers: { 'Royaltyport-Version': API_RELEASE } }))
      .mockResolvedValueOnce(new Response('{"data":[]}', { headers: { 'Royaltyport-Version': API_RELEASE } }));
    const client = new HttpClient({ baseUrl: 'https://api.example.com', token: 'key', fetch, retryDelay: 0 });
    expect((await client.get('/projects')).apiVersion).toBe(API_RELEASE);
    expect(fetch).toHaveBeenCalledTimes(2);
    for (const [, init] of fetch.mock.calls) expect(new Headers(init.headers).get('Royaltyport-Version')).toBe(API_RELEASE);
  });
  it.each([null, '2026-04-20.aster'])('rejects incompatible successful responses (%s) without retry', async version => {
    const fetch = vi.fn().mockResolvedValue(new Response('{"data":[]}', { headers: version ? { 'Royaltyport-Version': version } : {} }));
    const client = new Royaltyport({ apiKey: 'key', fetch });
    await expect(client.projects.list()).rejects.toMatchObject({ code: 'api_version_mismatch' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('does not forward credentials or release header to signed storage', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(''));
    const client = new HttpClient({ baseUrl: 'https://api.example.com', token: 'key', fetch });
    await client.putExternal('https://storage.example.com/signed', { headers: { 'Content-Type': 'application/pdf' }, body: 'bytes' });
    const headers = new Headers(fetch.mock.calls[0][1].headers);
    expect(headers.has('Royaltyport-Version')).toBe(false);
    expect(headers.has('Authorization')).toBe(false);
  });
});

it('rejects another release at construction before any request', () => {
  const fetch = vi.fn();
  // JavaScript callers can pass values outside the published literal type.
  expect(() => new Royaltyport({ apiKey: 'key', fetch, apiVersion: '2026-04-20.aster' as never }))
    .toThrow('supports only 2026-10-20.birch');
  expect(() => new Royaltyport({ apiKey: 'key', fetch, apiVersion: null as never }))
    .toThrow('supports only 2026-10-20.birch');
  expect(fetch).not.toHaveBeenCalled();
});
