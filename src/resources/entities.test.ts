import { describe, it, expect } from 'vitest';
import { Entities } from './entities.js';
import { createMockHttp } from './test-helpers.js';

describe('Entities', () => {
  it('list passes projectId and includeMerged', async () => {
    const http = createMockHttp();
    const entities = new Entities(http);

    await entities.list('proj-1', { includeMerged: true });

    expect(http.get).toHaveBeenCalledWith('/entities', {
      projectId: 'proj-1',
      page: undefined,
      perPage: undefined,
      includeMerged: 'true',
    });
  });

  it('get passes entityId and projectId', async () => {
    const http = createMockHttp();
    const entities = new Entities(http);

    await entities.get('proj-1', 789, { includeMerged: false });

    expect(http.get).toHaveBeenCalledWith('/entities/789', {
      projectId: 'proj-1',
      includeMerged: 'false',
    });
  });
});
