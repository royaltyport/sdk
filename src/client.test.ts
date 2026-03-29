import { describe, it, expect, vi } from 'vitest';
import { Royaltyport } from './client.js';
import { Projects } from './resources/projects.js';
import { Artists } from './resources/artists.js';
import { Writers } from './resources/writers.js';
import { Recordings } from './resources/recordings.js';
import { Compositions } from './resources/compositions.js';
import { Entities } from './resources/entities.js';
import { Relations } from './resources/relations.js';
import { Contracts } from './resources/contracts.js';
import { Statements } from './resources/statements.js';

function mockResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: new Headers(),
  });
}

describe('Royaltyport client', () => {
  it('creates with apiKey and default baseUrl', () => {
    const rp = new Royaltyport({ apiKey: 'test-key' });
    expect(rp).toBeDefined();
  });

  it('creates with custom baseUrl', () => {
    const rp = new Royaltyport({ apiKey: 'test-key', baseUrl: 'https://custom.api.com' });
    expect(rp).toBeDefined();
  });

  describe('lazy resource getters', () => {
    const rp = new Royaltyport({ apiKey: 'test-key' });

    it('returns Projects instance', () => {
      expect(rp.projects).toBeInstanceOf(Projects);
    });

    it('returns Artists instance', () => {
      expect(rp.artists).toBeInstanceOf(Artists);
    });

    it('returns Writers instance', () => {
      expect(rp.writers).toBeInstanceOf(Writers);
    });

    it('returns Recordings instance', () => {
      expect(rp.recordings).toBeInstanceOf(Recordings);
    });

    it('returns Compositions instance', () => {
      expect(rp.compositions).toBeInstanceOf(Compositions);
    });

    it('returns Entities instance', () => {
      expect(rp.entities).toBeInstanceOf(Entities);
    });

    it('returns Relations instance', () => {
      expect(rp.relations).toBeInstanceOf(Relations);
    });

    it('returns Contracts instance', () => {
      expect(rp.contracts).toBeInstanceOf(Contracts);
    });

    it('returns Statements instance', () => {
      expect(rp.statements).toBeInstanceOf(Statements);
    });

    it('returns same instance on repeated access', () => {
      expect(rp.artists).toBe(rp.artists);
      expect(rp.contracts).toBe(rp.contracts);
    });
  });

  describe('search', () => {
    it('calls /projects/{id}/search with query param', async () => {
      const fetchFn = vi.fn().mockResolvedValue(
        mockResponse({ data: { recordings: [], compositions: [], contracts: [], entities: [], artists: [], writers: [] } }),
      );

      const rp = new Royaltyport({ apiKey: 'test-key', baseUrl: 'https://api.example.com', fetch: fetchFn });
      const result = await rp.search('proj-1', 'oliver heldens');

      const url = new URL(fetchFn.mock.calls[0]![0] as string);
      expect(url.pathname).toBe('/v1/projects/proj-1/search');
      expect(url.searchParams.get('q')).toBe('oliver heldens');
      expect(result.data).toHaveProperty('recordings');
      expect(result.data).toHaveProperty('artists');
    });
  });
});
