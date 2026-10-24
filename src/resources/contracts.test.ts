import type { HttpClient } from '../http.js';
import type { ContractCommitment } from '../types/contracts.js';
import { describe, it, expect, vi } from 'vitest';
import { Contracts } from './contracts.js';
import { createMockHttp } from './test-helpers.js';

function mockUploadFlow(http: HttpClient) {
  const rateLimit = { limit: 100, remaining: 99, reset: 0 };
  vi.mocked(http.post)
    .mockResolvedValueOnce({
      data: { staging_id: 42, upload_url: 'https://storage.example.com/signed', file_path: 'proj-1/contracts_staging/abc' },
      rateLimit,
    })
    .mockResolvedValueOnce({ data: { staging_id: 42, status: 'uploaded', context_applied: false }, rateLimit });
}

describe('Contracts', () => {
  it('list passes projectId and pagination', async () => {
    const http = createMockHttp();
    const contracts = new Contracts(http);

    await contracts.list('proj-1', { page: 1, perPage: 10 });

    expect(http.get).toHaveBeenCalledWith('/contracts', {
      projectId: 'proj-1',
      page: '1',
      perPage: '10',
      extractorIds: undefined,
      score: undefined,
      citations: undefined,
    });
  });

  it('list omits extraction selections', async () => {
    const http = createMockHttp();
    const contracts = new Contracts(http);

    await contracts.list('proj-1');

    expect(http.get).toHaveBeenCalledWith('/contracts', {
      projectId: 'proj-1',
      page: undefined,
      perPage: undefined,
      extractorIds: undefined,
      score: undefined,
      citations: undefined,
    });
  });

  it('get passes contractId', async () => {
    const http = createMockHttp();
    const contracts = new Contracts(http);

    await contracts.get('proj-1', 99);

    expect(http.get).toHaveBeenCalledWith('/contracts/99', {
      projectId: 'proj-1',
      extractorIds: undefined,
      score: undefined,
      citations: undefined,
    });
  });

  it('pages one typed extraction independently', async () => {
    const http = createMockHttp();
    const contracts = new Contracts(http);

    await contracts.listExtraction('proj-1', 99, 'recordings', {
      page: 2,
      perPage: 250,
      citations: true,
    });

    expect(http.get).toHaveBeenCalledWith('/contracts/99/extractions/recordings', {
      projectId: 'proj-1',
      page: '2',
      perPage: '250',
      citations: 'true',
      expectedRevision: undefined,
    });
  });

  it('updates the complete contract tag list', async () => {
    const http = createMockHttp();
    const contracts = new Contracts(http);

    await contracts.update('proj-1', '11111111-1111-4111-8111-111111111111', {
      tags: ['Priority', 'Artist agreement'],
    });

    expect(http.put).toHaveBeenCalledWith(
      '/contracts/11111111-1111-4111-8111-111111111111',
      { tags: ['Priority', 'Artist agreement'] },
      { projectId: 'proj-1' },
    );
  });

  it('forwards custom extractor IDs on list and get', async () => {
    const http = createMockHttp();
    const contracts = new Contracts(http);
    await contracts.list('proj-1', { extractorIds: [201, 202] });
    await contracts.get('proj-1', 99, { extractorIds: [201] });
    expect(http.get).toHaveBeenNthCalledWith(1, '/contracts', expect.objectContaining({ extractorIds: '201,202' }));
    expect(http.get).toHaveBeenNthCalledWith(2, '/contracts/99', expect.objectContaining({ extractorIds: '201' }));
  });

  it('forwards citations for custom extractor results on list and get', async () => {
    const http = createMockHttp();
    const contracts = new Contracts(http);

    await contracts.list('proj-1', { extractorIds: [201], citations: true });
    await contracts.get('proj-1', 99, { extractorIds: [201], citations: true });

    expect(http.get).toHaveBeenNthCalledWith(1, '/contracts', expect.objectContaining({
      citations: 'true',
    }));
    expect(http.get).toHaveBeenNthCalledWith(2, '/contracts/99', expect.objectContaining({
      citations: 'true',
    }));
  });

  it('types commitments with linked deliverables and automatically joined assets', () => {
    const commitments: ContractCommitment[] = [{
          id: 12,
          internal_uuid: '22222222-2222-4222-8222-222222222222',
          created_at: '2026-08-21T10:00:00Z',
          updated_at: '2026-08-21T10:05:00Z',
          title: 'Initial Contract Period',
          type: 'fixed',
          description: null,
          recurring_unit: null,
          recurring_quantity: null,
          linked_deliverables: [{ type: 'album', description: 'Studio album', quantity: 2, fulfilled: 1 }],
          citations: [],
          linked_assets: [{
            id: 21,
            type: 'recording',
            contract_recording_id: 31,
            recording_id: 41,
            created_at: '2026-08-21T10:05:00Z',
            updated_at: '2026-08-21T10:05:00Z',
          }],
        }];

    expect(commitments[0]?.linked_deliverables[0]?.type).toBe('album');
    expect(commitments[0]?.linked_assets[0]?.type).toBe('recording');
  });

  it('forwards score on list and get', async () => {
    const http = createMockHttp();
    const contracts = new Contracts(http);
    await contracts.list('proj-1', { score: true });
    await contracts.get('proj-1', 99, { score: true });
    expect(http.get).toHaveBeenNthCalledWith(1, '/contracts', expect.objectContaining({ score: 'true' }));
    expect(http.get).toHaveBeenNthCalledWith(2, '/contracts/99', expect.objectContaining({ score: 'true' }));
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
      context_applied: false,
    });
  });

  it('upload sends extractions as a JSON array in the mint body', async () => {
    const http = createMockHttp();
    mockUploadFlow(http);
    const contracts = new Contracts(http);

    const blob = new Blob(['%PDF-1.4 pdf'], { type: 'application/pdf' });
    await contracts.upload('proj-1', blob, {
      extractions: ['extract-royalties', 'extract-dates', 'extract-language'],
    });

    expect(http.post).toHaveBeenNthCalledWith(
      1,
      '/contracts/uploads',
      expect.objectContaining({ extractions: ['extract-royalties', 'extract-dates', 'extract-language'] }),
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

  it('ingestion calls correct path', async () => {
    const http = createMockHttp();
    const contracts = new Contracts(http);

    await contracts.ingestion('proj-1', 42);

    expect(http.get).toHaveBeenCalledWith('/contracts/42/ingestion', { projectId: 'proj-1' });
  });


});
