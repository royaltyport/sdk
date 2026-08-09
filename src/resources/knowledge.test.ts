import { describe, expect, it } from 'vitest';
import { Knowledge } from './knowledge.js';
import { createMockHttp } from './test-helpers.js';

describe('Knowledge', () => {
  it('searches project-scoped knowledge', async () => {
    const http = createMockHttp();
    const knowledge = new Knowledge(http);

    await knowledge.search('proj-1', 'distribution policy', { limit: 5 });

    expect(http.get).toHaveBeenCalledWith('/projects/proj-1/knowledge/search', {
      q: 'distribution policy',
      limit: '5',
    });
  });
});
