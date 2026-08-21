import { describe, expect, it } from 'vitest';
import { Tags } from './tags.js';
import { createMockHttp } from './test-helpers.js';

describe('Tags', () => {
  it('lists scoped tags with pagination and search', async () => {
    const http = createMockHttp();
    const tags = new Tags(http);

    await tags.list('proj-1', 'contracts', { page: 2, perPage: 25, search: 'priority' });

    expect(http.get).toHaveBeenCalledWith('/tags', {
      projectId: 'proj-1',
      scope: 'contracts',
      page: '2',
      perPage: '25',
      search: 'priority',
    });
  });

  it('replaces tags on a scoped resource', async () => {
    const http = createMockHttp();
    const tags = new Tags(http);

    await tags.update('proj-1', {
      scope: 'statements',
      resourceId: 77,
      tags: ['Priority', 'Quarterly'],
    });

    expect(http.put).toHaveBeenCalledWith(
      '/tags',
      { scope: 'statements', resourceId: 77, tags: ['Priority', 'Quarterly'] },
      { projectId: 'proj-1' },
    );
  });
});
