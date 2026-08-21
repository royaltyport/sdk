import { describe, it, expect, vi } from 'vitest';
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
      stagingIds: undefined,
      extractionStage: undefined,
      score: undefined,
    });
  });

  it('list passes staging and processing filters', async () => {
    const http = createMockHttp();
    const statements = new Statements(http);

    await statements.list('proj-1', { stagingIds: [10, 11], extractionStage: 'completed', score: true });

    expect(http.get).toHaveBeenCalledWith('/statements', {
      projectId: 'proj-1',
      page: undefined,
      perPage: undefined,
      stagingIds: '10,11',
      extractionStage: 'completed',
      score: 'true',
    });
  });

  it('get passes statementId', async () => {
    const http = createMockHttp();
    const statements = new Statements(http);

    await statements.get('proj-1', 77);

    expect(http.get).toHaveBeenCalledWith('/statements/77', { projectId: 'proj-1', detailed: undefined, score: undefined });
  });

  it('get requests the detailed CSV export', async () => {
    const http = createMockHttp();
    const statements = new Statements(http);

    await statements.get('proj-1', 77, { detailed: true });

    expect(http.get).toHaveBeenCalledWith('/statements/77', { projectId: 'proj-1', detailed: 'true', score: undefined });
  });

  it('updates selected statement metadata', async () => {
    const http = createMockHttp();
    const statements = new Statements(http);

    await statements.update('proj-1', 77, {
      tags: ['Quarterly'],
      payee: 'Ocean Wave Records Ltd',
      accountingPeriod: '2026Q1',
      currency: 'GBP',
    });

    expect(http.put).toHaveBeenCalledWith(
      '/statements/77',
      {
        tags: ['Quarterly'],
        payee: 'Ocean Wave Records Ltd',
        accountingPeriod: '2026Q1',
        currency: 'GBP',
      },
      { projectId: 'proj-1' },
    );
  });

  it('upload runs the mint -> put -> complete flow', async () => {
    const http = createMockHttp();
    const rateLimit = { limit: 100, remaining: 99, reset: 0 };
    vi.mocked(http.post)
      .mockResolvedValueOnce({
        data: { staging_id: 123, upload_url: 'https://storage.example.com/signed', file_path: 'proj-1/statements_staging/abc' },
        rateLimit,
      })
      .mockResolvedValueOnce({ data: { staging_id: 123, status: 'uploaded', context_applied: false }, rateLimit });
    const statements = new Statements(http);

    const blob = new Blob(['%PDF-1.4 data'], { type: 'application/pdf' });
    const result = await statements.upload('proj-1', blob, { fileName: 'report.pdf' });

    expect(http.post).toHaveBeenNthCalledWith(
      1,
      '/statements/uploads',
      { fileName: 'report.pdf', fileType: 'application/pdf', fileSize: 13, fileExtension: 'pdf' },
      { projectId: 'proj-1' },
      { retry: false },
    );
    expect(http.putExternal).toHaveBeenCalledWith('https://storage.example.com/signed', {
      headers: { 'content-type': 'application/pdf', 'x-upsert': 'true' },
      body: expect.any(Uint8Array),
    });
    expect(http.post).toHaveBeenNthCalledWith(
      2,
      '/statements/uploads/complete',
      { stagingId: 123 },
      { projectId: 'proj-1' },
      { retry: false },
    );
    expect(result.data).toEqual({
      staging_id: 123,
      status: 'uploaded',
      file_path: 'proj-1/statements_staging/abc',
      context_applied: false,
    });
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

  it('retries paused staging without automatic HTTP retries', async () => {
    const http = createMockHttp();
    const statements = new Statements(http);
    await statements.retryStaging('proj-1', 77);
    expect(http.post).toHaveBeenCalledWith('/statements/staging/77/retry', {}, { projectId: 'proj-1' }, { retry: false });
  });
});
