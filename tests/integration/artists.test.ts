import { describe, it, expect } from 'vitest';
import { client, PROJECT_ID } from './setup.js';
import { RoyaltyportError } from '../../src/index.js';

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

  it('gets an artist by ID', async () => {
    const { data: listData } = await client.artists.list(PROJECT_ID, { page: 1, perPage: 1 });
    if (listData.items.length === 0) return;

    const artistId = listData.items[0].id;
    const { data, rateLimit } = await client.artists.get(PROJECT_ID, artistId);

    expect(data.id).toBe(artistId);
    expect(typeof data.name).toBe('string');
    expect(typeof data.created_at).toBe('string');
    expect(rateLimit.limit).toBeGreaterThan(0);
  });

  it('throws RoyaltyportError for non-existent artist ID', async () => {
    await expect(client.artists.get(PROJECT_ID, 999999999)).rejects.toThrow(RoyaltyportError);
  });
});
