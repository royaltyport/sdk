import type { HttpClient } from '../http.js';
import type { Contract } from '../types/contracts.js';
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
  it('list passes projectId, pagination, and includes', async () => {
    const http = createMockHttp();
    const contracts = new Contracts(http);

    await contracts.list('proj-1', { page: 1, perPage: 10, includes: ['entities', 'royalties', 'languages'] });

    expect(http.get).toHaveBeenCalledWith('/contracts', {
      projectId: 'proj-1',
      page: '1',
      perPage: '10',
      includes: 'entities,royalties,languages',
      extractorIds: undefined,
      score: undefined,
      citations: undefined,
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
      extractorIds: undefined,
      score: undefined,
      citations: undefined,
    });
  });

  it('get passes contractId and includes', async () => {
    const http = createMockHttp();
    const contracts = new Contracts(http);

    await contracts.get('proj-1', 99, { includes: ['dates', 'signatures'] });

    expect(http.get).toHaveBeenCalledWith('/contracts/99', {
      projectId: 'proj-1',
      includes: 'dates,signatures',
      extractorIds: undefined,
      score: undefined,
      citations: undefined,
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

  it('serializes commitments on list and get', async () => {
    const http = createMockHttp();
    const contracts = new Contracts(http);

    await contracts.list('proj-1', { includes: ['commitments'], citations: true });
    await contracts.get('proj-1', 99, { includes: ['commitments'], citations: true });

    expect(http.get).toHaveBeenNthCalledWith(1, '/contracts', expect.objectContaining({
      includes: 'commitments',
      citations: 'true',
    }));
    expect(http.get).toHaveBeenNthCalledWith(2, '/contracts/99', expect.objectContaining({
      includes: 'commitments',
      citations: 'true',
    }));
  });

  it('types commitments with linked deliverables and automatically joined assets', () => {
    const contract: Contract = {
      id: 99,
      internal_uuid: '11111111-1111-4111-8111-111111111111',
      file_name: 'agreement.pdf',
      file_type: 'application/pdf',
      created_at: '2026-08-21T10:00:00Z',
      extractions: {
        commitments: [{
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
        }],
      },
    };

    expect(contract.extractions?.commitments?.[0]?.linked_deliverables[0]?.type).toBe('album');
    expect(contract.extractions?.commitments?.[0]?.linked_assets[0]?.type).toBe('recording');
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

  it('processes calls correct path', async () => {
    const http = createMockHttp();
    const contracts = new Contracts(http);

    await contracts.processes('proj-1', 42);

    expect(http.get).toHaveBeenCalledWith('/contracts/42/processes', { projectId: 'proj-1' });
  });

  it('retries paused staging without automatic HTTP retries', async () => {
    const http = createMockHttp();
    const contracts = new Contracts(http);
    await contracts.retryStaging('proj-1', 42);
    expect(http.post).toHaveBeenCalledWith('/contracts/staging/42/retry', {}, { projectId: 'proj-1' }, { retry: false });
  });
});
