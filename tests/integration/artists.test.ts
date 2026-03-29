import { describe, it, expect } from 'vitest';
import { client, PROJECT_ID } from './setup.js';

describe('Artists (integration)', () => {
  it('lists artists with pagination', async () => {
    const { data, rateLimit } = await client.artists.list(PROJECT_ID, { page: 1, perPage: 10 });

    expect(data).toHaveProperty('items');
    expect(data).toHaveProperty('total_count');
    expect(data).toHaveProperty('page');
    expect(data).toHaveProperty('per_page');
    expect(Array.isArray(data.items)).toBe(true);
    expect(typeof data.total_count).toBe('number');
    expect(rateLimit.limit).toBeGreaterThan(0);
  });

  it('lists artists with includeMerged', async () => {
    const { data } = await client.artists.list(PROJECT_ID, { includeMerged: true });

    expect(data).toHaveProperty('items');
    expect(Array.isArray(data.items)).toBe(true);
  });
});
