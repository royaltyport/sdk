import { describe, it, expect } from 'vitest';
import { client, PROJECT_ID } from './setup.js';

describe('Entities (integration)', () => {
  it('lists entities with pagination', async () => {
    const { data } = await client.entities.list(PROJECT_ID, { page: 1, perPage: 10 });

    expect(data).toHaveProperty('items');
    expect(data).toHaveProperty('total_count');
    expect(Array.isArray(data.items)).toBe(true);
  });

  it('lists entities with includeMerged', async () => {
    const { data } = await client.entities.list(PROJECT_ID, { includeMerged: true });

    expect(data).toHaveProperty('items');
  });
});
