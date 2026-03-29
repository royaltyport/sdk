import { describe, it, expect } from 'vitest';
import { client, PROJECT_ID } from './setup.js';

describe('Recordings (integration)', () => {
  it('lists recordings with pagination', async () => {
    const { data } = await client.recordings.list(PROJECT_ID, { page: 1, perPage: 10 });

    expect(data).toHaveProperty('items');
    expect(data).toHaveProperty('total_count');
    expect(Array.isArray(data.items)).toBe(true);
  });

  it('lists recordings with includeProducts', async () => {
    const { data } = await client.recordings.list(PROJECT_ID, { includeProducts: true });

    expect(data).toHaveProperty('items');
  });
});
