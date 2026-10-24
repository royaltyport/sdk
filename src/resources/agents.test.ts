import { describe, expect, it, vi } from 'vitest';
import { Royaltyport } from '../client.js';
import { RoyaltyportError } from '../errors.js';
import { Agents } from './agents.js';
import { createMockHttp } from './test-helpers.js';

const version = '2026-10-20.birch';
function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Royaltyport-Version': version } });
}

describe('Agents', () => {
  it('serializes every run filter without interpreting the opaque cursor', async () => {
    const http = createMockHttp();
    await new Agents(http).listRuns('project-1', { resourceType: 'contract', resourceId: 42,
      processKey: 'contract-processing', status: 'completed_with_issues', limit: 5, cursor: 'opaque+/=' });
    expect(http.get).toHaveBeenCalledWith('/agents/runs', { projectId: 'project-1', resourceType: 'contract',
      resourceId: '42', processKey: 'contract-processing', status: 'completed_with_issues', limit: '5', cursor: 'opaque+/=' });
  });

  it('reads one run with a project scope', async () => {
    const http = createMockHttp();
    await new Agents(http).getRun('project-1', 'run/id');
    expect(http.get).toHaveBeenCalledWith('/agents/runs/run%2Fid', { projectId: 'project-1' });
  });

  it('preserves cursor envelopes and the Birch release through the real HTTP client', async () => {
    const envelope = { data: [], meta: { has_more: true, next_cursor: 'next' }, links: { next: '/v1/agents/runs?cursor=next' } };
    const fetch = vi.fn().mockResolvedValue(reply(envelope));
    const rp = new Royaltyport({ apiKey: 'test', fetch });
    expect(rp.agents).toBe(rp.agents);
    const result = await rp.agents.listRuns('project-1');
    expect(result.data).toEqual([]);
    expect(result.meta).toEqual(envelope.meta);
    expect(result.links).toEqual(envelope.links);
    expect(fetch).toHaveBeenCalledWith('https://api.royaltyport.com/v1/agents/runs?projectId=project-1',
      expect.objectContaining({ headers: expect.objectContaining({ 'Royaltyport-Version': version }) }));
  });

  it.each(['contract', 'statement'] as const)('reads canonical %s agents without reshaping readiness', async kind => {
    const data = { resource: { type: kind, id: 42 }, source_revision: 'source', observed_at: '2026-10-24T10:00:00Z',
      handoff: { status: 'accepted', source_revision: 'source', error: null },
      agent_readiness: [{ key: kind === 'contract' ? 'recordings' : 'asset_matching', status: 'ready', revision: 'revision', published_at: null,
        reason: null, quality: { status: 'issues', issues: [{ code: 'provider_enrichment_incomplete', message: 'Some provider metadata could not be retrieved.' }] },
        links: { data: kind === 'contract' ? '/v1/contracts/42/extractions/recordings?expectedRevision=revision' : null } }],
      agent_runs: [], poll_after_seconds: null, links: { self: '/agents' } };
    const fetch = vi.fn().mockResolvedValue(reply({ data }));
    const rp = new Royaltyport({ apiKey: 'test', fetch });
    const result = await (kind === 'contract' ? rp.contracts : rp.statements).agents('project-1', 42);
    expect(result.data).toEqual(data);
    expect(fetch).toHaveBeenCalledWith(`https://api.royaltyport.com/v1/${kind}s/42/agents?projectId=project-1`, expect.any(Object));
  });

  it('keeps the same reader revision on every page and exposes the verified revision', async () => {
    const fetch = vi.fn().mockImplementation(() => Promise.resolve(reply({
      data: { items: [], total_count: 0, page: 1, per_page: 1 }, meta: { revision: 'r1_current' },
    })));
    const rp = new Royaltyport({ apiKey: 'test', fetch });
    for (const page of [1, 2]) {
      const result = await rp.contracts.listExtraction('project-1', 42, 'recordings', { page, perPage: 1, expectedRevision: 'r1_current' });
      expect(result.meta?.revision).toBe('r1_current');
      const url = new URL(fetch.mock.calls[page - 1]![0]);
      expect(url.searchParams.get('expectedRevision')).toBe('r1_current');
      expect(url.searchParams.get('page')).toBe(String(page));
    }
  });

  it('does not retry a changed readiness revision', async () => {
    const fetch = vi.fn().mockResolvedValue(reply({ error: { code: 'readiness_changed', message: 'Readiness changed.' } }, 409));
    const rp = new Royaltyport({ apiKey: 'test', fetch });
    await expect(rp.contracts.listExtraction('project-1', 42, 'compositions', { expectedRevision: 'old' }))
      .rejects.toMatchObject<RoyaltyportError>({ status: 409, code: 'readiness_changed' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
