import { describe, it, expect } from 'vitest';
import { Artists } from './artists.js';
import { createMockHttp } from './test-helpers.js';

describe('Artists', () => {
  it('list passes projectId and pagination', async () => {
    const http = createMockHttp();
    const artists = new Artists(http);

    await artists.list('proj-1', { page: 2, perPage: 50 });

    expect(http.get).toHaveBeenCalledWith('/artists', {
      projectId: 'proj-1',
      page: '2',
      perPage: '50',
      includeMerged: undefined,
    });
  });

  it('list passes includeMerged flag', async () => {
    const http = createMockHttp();
    const artists = new Artists(http);

    await artists.list('proj-1', { includeMerged: true });

    expect(http.get).toHaveBeenCalledWith('/artists', {
      projectId: 'proj-1',
      page: undefined,
      perPage: undefined,
      includeMerged: 'true',
    });
  });

  it('list works with no options', async () => {
    const http = createMockHttp();
    const artists = new Artists(http);

    await artists.list('proj-1');

    expect(http.get).toHaveBeenCalledWith('/artists', {
      projectId: 'proj-1',
      page: undefined,
      perPage: undefined,
      includeMerged: undefined,
    });
  });

  it('get passes artistId and projectId', async () => {
    const http = createMockHttp();
    const artists = new Artists(http);

    await artists.get('proj-1', 123);

    expect(http.get).toHaveBeenCalledWith('/artists/123', {
      projectId: 'proj-1',
      includeMerged: undefined,
    });
  });

  it('get passes includeMerged', async () => {
    const http = createMockHttp();
    const artists = new Artists(http);

    await artists.get('proj-1', 123, { includeMerged: true });

    expect(http.get).toHaveBeenCalledWith('/artists/123', {
      projectId: 'proj-1',
      includeMerged: 'true',
    });
  });
});
