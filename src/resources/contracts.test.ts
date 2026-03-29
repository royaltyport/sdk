import { describe, it, expect } from 'vitest';
import { Contracts } from './contracts.js';
import { createMockHttp } from './test-helpers.js';

describe('Contracts', () => {
  it('list passes projectId, pagination, and includes', async () => {
    const http = createMockHttp();
    const contracts = new Contracts(http);

    await contracts.list('proj-1', { page: 1, perPage: 10, includes: ['entities', 'royalties'] });

    expect(http.get).toHaveBeenCalledWith('/contracts', {
      projectId: 'proj-1',
      page: '1',
      perPage: '10',
      includes: 'entities,royalties',
    });
  });

  it('list passes undefined includes when not set', async () => {
    const http = createMockHttp();
    const contracts = new Contracts(http);

    await contracts.list('proj-1');

    expect(http.get).toHaveBeenCalledWith('/contracts', {
      projectId: 'proj-1',
      page: undefined,
      perPage: undefined,
      includes: undefined,
    });
  });

  it('get passes contractId and includes', async () => {
    const http = createMockHttp();
    const contracts = new Contracts(http);

    await contracts.get('proj-1', 99, { includes: ['dates', 'signatures'] });

    expect(http.get).toHaveBeenCalledWith('/contracts/99', {
      projectId: 'proj-1',
      includes: 'dates,signatures',
    });
  });

  it('upload sends FormData via postMultipart', async () => {
    const http = createMockHttp();
    const contracts = new Contracts(http);

    const blob = new Blob(['fake pdf'], { type: 'application/pdf' });
    await contracts.upload('proj-1', blob, { fileName: 'test.pdf' });

    expect(http.postMultipart).toHaveBeenCalledWith(
      '/contracts',
      expect.any(FormData),
      { projectId: 'proj-1' },
      undefined,
    );
  });

  it('upload passes onProgress as uploadOptions', async () => {
    const http = createMockHttp();
    const contracts = new Contracts(http);

    const onProgress = () => {};
    const blob = new Blob(['fake pdf'], { type: 'application/pdf' });
    await contracts.upload('proj-1', blob, { onProgress });

    expect(http.postMultipart).toHaveBeenCalledWith(
      '/contracts',
      expect.any(FormData),
      { projectId: 'proj-1' },
      { onProgress },
    );
  });

  it('upload appends extractions to FormData', async () => {
    const http = createMockHttp();
    const contracts = new Contracts(http);

    const blob = new Blob(['fake pdf'], { type: 'application/pdf' });
    await contracts.upload('proj-1', blob, {
      extractions: ['extract-royalties', 'extract-dates'],
    });

    const formData = (http.postMultipart as ReturnType<typeof import('vitest').vi.fn>).mock.calls[0]![1] as FormData;
    expect(formData.get('extractions')).toBe('["extract-royalties","extract-dates"]');
    expect(formData.get('file')).toBeInstanceOf(Blob);
  });

  it('download calls correct path', async () => {
    const http = createMockHttp();
    const contracts = new Contracts(http);

    await contracts.download('proj-1', 42);

    expect(http.get).toHaveBeenCalledWith('/contracts/42/download', { projectId: 'proj-1' });
  });

  it('processes calls correct path', async () => {
    const http = createMockHttp();
    const contracts = new Contracts(http);

    await contracts.processes('proj-1', 42);

    expect(http.get).toHaveBeenCalledWith('/contracts/42/processes', { projectId: 'proj-1' });
  });
});
