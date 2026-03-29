import { describe, it, expect } from 'vitest';
import { Compositions } from './compositions.js';
import { createMockHttp } from './test-helpers.js';

describe('Compositions', () => {
  it('list passes projectId and includeProducts', async () => {
    const http = createMockHttp();
    const compositions = new Compositions(http);

    await compositions.list('proj-1', { includeProducts: false });

    expect(http.get).toHaveBeenCalledWith('/compositions', {
      projectId: 'proj-1',
      page: undefined,
      perPage: undefined,
      includeProducts: 'false',
    });
  });

  it('get passes compositionId', async () => {
    const http = createMockHttp();
    const compositions = new Compositions(http);

    await compositions.get('proj-1', 42);

    expect(http.get).toHaveBeenCalledWith('/compositions/42', {
      projectId: 'proj-1',
      includeProducts: undefined,
    });
  });
});
