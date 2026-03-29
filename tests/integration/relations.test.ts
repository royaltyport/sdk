import { describe, it, expect } from 'vitest';
import { client, PROJECT_ID } from './setup.js';

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
});
