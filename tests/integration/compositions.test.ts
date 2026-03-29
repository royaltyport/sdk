import { describe, it, expect } from 'vitest';
import { client, PROJECT_ID } from './setup.js';

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
});
