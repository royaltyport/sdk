import { describe, it, expect } from 'vitest';
import { client, PROJECT_ID } from './setup.js';
import { RoyaltyportError } from '../../src/index.js';

describe('Relations (integration)', () => {
  it('lists relations with pagination', async () => {
    const { data } = await client.relations.list(PROJECT_ID, { page: 1, perPage: 10 });

    expect(data).toHaveProperty('items');
    expect(data).toHaveProperty('total_count');
    expect(Array.isArray(data.items)).toBe(true);
  });

  it('lists relations with includeMerged', async () => {
    const { data } = await client.relations.list(PROJECT_ID, { includeMerged: true });

    expect(data).toHaveProperty('items');
  });

  it('gets a relation by ID', async () => {
    const { data: listData } = await client.relations.list(PROJECT_ID, { page: 1, perPage: 1 });
    if (listData.items.length === 0) return;

    const relationId = listData.items[0].id;
    const { data, rateLimit } = await client.relations.get(PROJECT_ID, relationId);

    expect(data.id).toBe(relationId);
    expect(typeof data.name).toBe('string');
    expect(typeof data.created_at).toBe('string');
    expect(rateLimit.limit).toBeGreaterThan(0);
  });

  it('throws RoyaltyportError for non-existent relation ID', async () => {
    await expect(client.relations.get(PROJECT_ID, 999999999)).rejects.toThrow(RoyaltyportError);
  });
});
