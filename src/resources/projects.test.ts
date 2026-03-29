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
});
