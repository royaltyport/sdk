import { describe, it, expect } from 'vitest';
import { Relations } from './relations.js';
import { createMockHttp } from './test-helpers.js';

describe('Relations', () => {
  it('list passes projectId and pagination', async () => {
    const http = createMockHttp();
    const relations = new Relations(http);

    await relations.list('proj-1', { page: 3, perPage: 10 });

    expect(http.get).toHaveBeenCalledWith('/relations', {
      projectId: 'proj-1',
      page: '3',
      perPage: '10',
      includeMerged: undefined,
    });
  });

  it('get passes relationId and projectId', async () => {
    const http = createMockHttp();
    const relations = new Relations(http);

    await relations.get('proj-1', 100);

    expect(http.get).toHaveBeenCalledWith('/relations/100', {
      projectId: 'proj-1',
      includeMerged: undefined,
    });
  });
});
