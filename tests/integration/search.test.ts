import { describe, it, expect } from 'vitest';
import { client, PROJECT_ID } from './setup.js';

describe('Search (integration)', () => {
  it('searches across all resource types', async () => {
    const { data, rateLimit } = await client.search(PROJECT_ID, 'test');

    expect(data).toHaveProperty('recordings');
    expect(data).toHaveProperty('compositions');
    expect(data).toHaveProperty('contracts');
    expect(data).toHaveProperty('entities');
    expect(data).toHaveProperty('artists');
    expect(data).toHaveProperty('writers');
    expect(Array.isArray(data.recordings)).toBe(true);
    expect(Array.isArray(data.artists)).toBe(true);
    expect(rateLimit.limit).toBeGreaterThan(0);
  });

  it('rejects empty search query with validation error', async () => {
    const { RoyaltyportValidationError } = await import('../../src/index.js');

    await expect(client.search(PROJECT_ID, '')).rejects.toThrow(RoyaltyportValidationError);
  });

  it('handles special characters in query', async () => {
    const { data } = await client.search(PROJECT_ID, 'test & "special" <chars>');

    expect(data).toHaveProperty('recordings');
  });

  it('searches governed project knowledge', async () => {
    const { data } = await client.knowledge.search(PROJECT_ID, 'policy', { limit: 5 });

    expect(Array.isArray(data.results)).toBe(true);
    expect(data.freshness).toHaveProperty('last_indexed_at');
    for (const item of data.results) {
      expect(Array.isArray(item.claims)).toBe(true);
      expect(Array.isArray(item.relationships)).toBe(true);
    }
  });
});
