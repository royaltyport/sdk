import { describe, it, expect, vi } from 'vitest';
import { Contracts } from './contracts.js';
import { createMockHttp } from './test-helpers.js';
import type { HttpClient } from '../http.js';

function mockUploadFlow(http: HttpClient) {
  const rateLimit = { limit: 100, remaining: 99, reset: 0 };
  vi.mocked(http.post)
    .mockResolvedValueOnce({
      data: { staging_id: 42, upload_url: 'https://storage.example.com/signed', file_path: 'proj-1/contracts_staging/abc' },
      rateLimit,
    })
    .mockResolvedValueOnce({ data: { staging_id: 42, status: 'uploaded' }, rateLimit });
}

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

  it('upload runs the mint -> put -> complete flow', async () => {
    const http = createMockHttp();
    mockUploadFlow(http);
    const contracts = new Contracts(http);

    const blob = new Blob(['%PDF-1.4 pdf'], { type: 'application/pdf' });
    const result = await contracts.upload('proj-1', blob, { fileName: 'test.pdf' });

    expect(http.post).toHaveBeenNthCalledWith(
      1,
      '/contracts/uploads',
      { fileName: 'test.pdf', fileType: 'application/pdf', fileSize: 12, fileExtension: 'pdf' },
      { projectId: 'proj-1' },
      { retry: false },
    );
    expect(http.putExternal).toHaveBeenCalledWith('https://storage.example.com/signed', {
      headers: { 'content-type': 'application/pdf', 'x-upsert': 'true' },
      body: expect.any(Uint8Array),
    });
    expect(http.post).toHaveBeenNthCalledWith(
      2,
      '/contracts/uploads/complete',
      { stagingId: 42 },
      { projectId: 'proj-1' },
      { retry: false },
    );
    expect(result.data).toEqual({
      staging_id: 42,
      status: 'uploaded',
      file_path: 'proj-1/contracts_staging/abc',
    });
  });

  it('upload sends extractions as a JSON array in the mint body', async () => {
    const http = createMockHttp();
    mockUploadFlow(http);
    const contracts = new Contracts(http);

    const blob = new Blob(['%PDF-1.4 pdf'], { type: 'application/pdf' });
    await contracts.upload('proj-1', blob, {
      extractions: ['extract-royalties', 'extract-dates'],
    });

    expect(http.post).toHaveBeenNthCalledWith(
      1,
      '/contracts/uploads',
      expect.objectContaining({ extractions: ['extract-royalties', 'extract-dates'] }),
      { projectId: 'proj-1' },
      { retry: false },
    );
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
