import { describe, it, expect } from 'vitest';
import { Writers } from './writers.js';
import { createMockHttp } from './test-helpers.js';

describe('Writers', () => {
  it('list passes projectId and pagination', async () => {
    const http = createMockHttp();
    const writers = new Writers(http);

    await writers.list('proj-1', { page: 1, perPage: 20, includeMerged: true });

    expect(http.get).toHaveBeenCalledWith('/writers', {
      projectId: 'proj-1',
      page: '1',
      perPage: '20',
      includeMerged: 'true',
    });
  });

  it('get passes writerId and projectId', async () => {
    const http = createMockHttp();
    const writers = new Writers(http);

    await writers.get('proj-1', 456);

    expect(http.get).toHaveBeenCalledWith('/writers/456', {
      projectId: 'proj-1',
      includeMerged: undefined,
    });
  });
});
