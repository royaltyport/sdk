import { describe, it, expect } from 'vitest';
import { client, PROJECT_ID } from './setup.js';

describe('Projects (integration)', () => {
  it('lists projects', async () => {
    const { data, rateLimit } = await client.projects.list();

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const project = data[0]!;
    expect(project).toHaveProperty('id');
    expect(project).toHaveProperty('name');
    expect(project).toHaveProperty('created_at');

    // Rate limit headers should be present
    expect(rateLimit).toHaveProperty('limit');
    expect(rateLimit).toHaveProperty('remaining');
    expect(rateLimit).toHaveProperty('reset');
  });

  it('gets a project by ID', async () => {
    const { data } = await client.projects.get(PROJECT_ID);

    expect(data.id).toBe(PROJECT_ID);
    expect(data.name).toBe('SDK - Integration Tests');
    expect(typeof data.created_at).toBe('string');
  });
});
