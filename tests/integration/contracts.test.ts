import { describe, it, expect } from 'vitest';
import { client, PROJECT_ID } from './setup.js';

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

    it('uploads a contract via the signed-URL flow', async () => {
      // Must start with %PDF- — the API validates the real bytes at complete
      const testContent = '%PDF-1.4 test contract content for SDK integration test';
      const file = new Blob([testContent], { type: 'application/pdf' });

      const { data } = await client.contracts.upload(PROJECT_ID, file, {
        fileName: 'sdk-test-contract.pdf',
        extractions: ['extract-dates', 'extract-signatures'],
      });

      expect(typeof data.staging_id).toBe('number');
      expect(data.status).toBe('uploaded');
      expect(typeof data.file_path).toBe('string');

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
