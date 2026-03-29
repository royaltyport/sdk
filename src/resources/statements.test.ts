import { describe, it, expect } from 'vitest';
import { Statements } from './statements.js';
import { createMockHttp } from './test-helpers.js';

describe('Statements', () => {
  it('list passes projectId and pagination', async () => {
    const http = createMockHttp();
    const statements = new Statements(http);

    await statements.list('proj-1', { page: 2, perPage: 30 });

    expect(http.get).toHaveBeenCalledWith('/statements', {
      projectId: 'proj-1',
      page: '2',
      perPage: '30',
    });
  });

  it('get passes statementId', async () => {
    const http = createMockHttp();
    const statements = new Statements(http);

    await statements.get('proj-1', 77);

    expect(http.get).toHaveBeenCalledWith('/statements/77', { projectId: 'proj-1' });
  });

  it('upload sends FormData via postMultipart', async () => {
    const http = createMockHttp();
    const statements = new Statements(http);

    const blob = new Blob(['csv data'], { type: 'text/csv' });
    await statements.upload('proj-1', blob, { fileName: 'report.csv' });

    expect(http.postMultipart).toHaveBeenCalledWith(
      '/statements',
      expect.any(FormData),
      { projectId: 'proj-1' },
      undefined,
    );
  });

  it('download calls correct path', async () => {
    const http = createMockHttp();
    const statements = new Statements(http);

    await statements.download('proj-1', 77);

    expect(http.get).toHaveBeenCalledWith('/statements/77/download', { projectId: 'proj-1' });
  });

  it('processes calls correct path', async () => {
    const http = createMockHttp();
    const statements = new Statements(http);

    await statements.processes('proj-1', 77);

    expect(http.get).toHaveBeenCalledWith('/statements/77/processes', { projectId: 'proj-1' });
  });
});
