import { describe, it, expect } from 'vitest';
import { Recordings } from './recordings.js';
import { createMockHttp } from './test-helpers.js';

describe('Recordings', () => {
  it('list passes projectId and includeProducts', async () => {
    const http = createMockHttp();
    const recordings = new Recordings(http);

    await recordings.list('proj-1', { includeProducts: true, page: 1, perPage: 25 });

    expect(http.get).toHaveBeenCalledWith('/recordings', {
      projectId: 'proj-1',
      page: '1',
      perPage: '25',
      includeProducts: 'true',
    });
  });

  it('get passes recordingId with includeProducts', async () => {
    const http = createMockHttp();
    const recordings = new Recordings(http);

    await recordings.get('proj-1', 555, { includeProducts: true });

    expect(http.get).toHaveBeenCalledWith('/recordings/555', {
      projectId: 'proj-1',
      includeProducts: 'true',
    });
  });
});
