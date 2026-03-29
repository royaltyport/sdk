import { describe, it, expect } from 'vitest';
import { client, PROJECT_ID } from './setup.js';

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
});
