import { describe, it, expect } from 'vitest';
import { Projects } from './projects.js';
import { createMockHttp } from './test-helpers.js';

describe('Projects', () => {
  it('list calls /projects with no params', async () => {
    const http = createMockHttp();
    const projects = new Projects(http);

    await projects.list();

    expect(http.get).toHaveBeenCalledWith('/projects');
  });

  it('get calls /projects/{id}', async () => {
    const http = createMockHttp();
    const projects = new Projects(http);

    await projects.get('proj-abc');

    expect(http.get).toHaveBeenCalledWith('/projects/proj-abc');
  });

  it('create disables retries for the non-idempotent mutation', async () => {
    const http = createMockHttp();
    const projects = new Projects(http);

    await projects.create({ name: 'New Project', entityName: 'Label BV' });

    expect(http.post).toHaveBeenCalledWith(
      '/projects',
      { name: 'New Project', entityName: 'Label BV' },
      undefined,
      { retry: false },
    );
  });
});
