import { describe, it, expect } from 'vitest';
import { client, PROJECT_ID } from './setup.js';
import { RoyaltyportError } from '../../src/index.js';

describe('Compositions (integration)', () => {
  it('lists compositions with pagination', async () => {
    const { data } = await client.compositions.list(PROJECT_ID, { page: 1, perPage: 10 });

    expect(data).toHaveProperty('items');
    expect(data).toHaveProperty('total_count');
    expect(Array.isArray(data.items)).toBe(true);
  });

  it('lists compositions with includeProducts', async () => {
    const { data } = await client.compositions.list(PROJECT_ID, { includeProducts: true });

    expect(data).toHaveProperty('items');
  });

  it('gets a composition by ID', async () => {
    const { data: listData } = await client.compositions.list(PROJECT_ID, { page: 1, perPage: 1 });
    if (listData.items.length === 0) return;

    const compositionId = listData.items[0].id;
    const { data, rateLimit } = await client.compositions.get(PROJECT_ID, compositionId);

    expect(data.id).toBe(compositionId);
    expect(typeof data.name).toBe('string');
    expect(typeof data.created_at).toBe('string');
    expect(rateLimit.limit).toBeGreaterThan(0);
  });

  it('throws RoyaltyportError for non-existent composition ID', async () => {
    await expect(client.compositions.get(PROJECT_ID, 999999999)).rejects.toThrow(RoyaltyportError);
  });
});
