import { describe, it, expect } from 'vitest';
import { client, PROJECT_ID } from './setup.js';
import { RoyaltyportError } from '../../src/index.js';

describe('Writers (integration)', () => {
  it('lists writers with pagination', async () => {
    const { data } = await client.writers.list(PROJECT_ID, { page: 1, perPage: 10 });

    expect(data).toHaveProperty('items');
    expect(data).toHaveProperty('total_count');
    expect(Array.isArray(data.items)).toBe(true);
  });

  it('lists writers with includeMerged', async () => {
    const { data } = await client.writers.list(PROJECT_ID, { includeMerged: true });

    expect(data).toHaveProperty('items');
  });

  it('gets a writer by ID', async () => {
    const { data: listData } = await client.writers.list(PROJECT_ID, { page: 1, perPage: 1 });
    if (listData.items.length === 0) return;

    const writerId = listData.items[0].id;
    const { data, rateLimit } = await client.writers.get(PROJECT_ID, writerId);

    expect(data.id).toBe(writerId);
    expect(typeof data.name).toBe('string');
    expect(typeof data.created_at).toBe('string');
    expect(rateLimit.limit).toBeGreaterThan(0);
  });

  it('throws RoyaltyportError for non-existent writer ID', async () => {
    await expect(client.writers.get(PROJECT_ID, 999999999)).rejects.toThrow(RoyaltyportError);
  });
});
