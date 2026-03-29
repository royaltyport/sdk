import { describe, it, expect } from 'vitest';
import { client, PROJECT_ID } from './setup.js';
import type { SseProgressEvent } from '../../src/index.js';

describe('Contracts (integration)', () => {
  it('lists contracts', async () => {
    const { data } = await client.contracts.list(PROJECT_ID, { page: 1, perPage: 10 });

    expect(data).toHaveProperty('items');
    expect(data).toHaveProperty('total_count');
    expect(Array.isArray(data.items)).toBe(true);
  });

  it('lists contracts with includes', async () => {
    const { data } = await client.contracts.list(PROJECT_ID, {
      includes: ['entities', 'royalties'],
    });

    expect(data).toHaveProperty('items');
  });

  describe('upload -> get -> download -> processes', () => {
    let uploadedStagingId: number;

    it('uploads a contract via multipart with SSE progress', async () => {
      // Create a minimal PDF-like file for testing
      const testContent = '%PDF-1.4 test contract content for SDK integration test';
      const file = new Blob([testContent], { type: 'application/pdf' });

      const progressEvents: SseProgressEvent[] = [];

      const { data } = await client.contracts.upload(PROJECT_ID, file, {
        fileName: 'sdk-test-contract.pdf',
        extractions: ['extract-dates', 'extract-signatures'],
        onProgress: (event) => progressEvents.push(event),
      });

      expect(data).toHaveProperty('staging_id');
      expect(typeof data.staging_id).toBe('number');
      expect(data).toHaveProperty('created_at');

      uploadedStagingId = data.staging_id;
    });

    it('gets contract processes', async () => {
      if (!uploadedStagingId) return;

      const { data } = await client.contracts.processes(PROJECT_ID, uploadedStagingId);

      expect(data).toHaveProperty('staging_id');
      expect(data.staging_id).toBe(uploadedStagingId);
      expect(data).toHaveProperty('staging_done');
      expect(data).toHaveProperty('staging_processes');
      expect(typeof data.staging_processes.stage).toBe('string');
    });
  });
});
