import { describe, it, expect } from 'vitest';
import { client, PROJECT_ID } from './setup.js';

describe('Statements (integration)', () => {
  it('lists statements', async () => {
    const { data } = await client.statements.list(PROJECT_ID, { page: 1, perPage: 10 });

    expect(data).toHaveProperty('items');
    expect(data).toHaveProperty('total_count');
    expect(Array.isArray(data.items)).toBe(true);
  });

  describe('upload -> get -> processes', () => {
    let uploadedStagingId: number;

    it('uploads a statement via the signed-URL flow', async () => {
      // Must start with %PDF- — the API validates the real bytes at complete
      const testContent = '%PDF-1.4 test statement content for SDK integration test';
      const file = new Blob([testContent], { type: 'application/pdf' });

      const { data } = await client.statements.upload(PROJECT_ID, file, {
        fileName: 'sdk-test-statement.pdf',
      });

      expect(typeof data.staging_id).toBe('number');
      expect(data.status).toBe('uploaded');
      expect(typeof data.file_path).toBe('string');

      uploadedStagingId = data.staging_id;
    });

    it('gets statement processes', async () => {
      if (!uploadedStagingId) return;

      const { data } = await client.statements.processes(PROJECT_ID, uploadedStagingId);

      expect(data).toHaveProperty('staging_id');
      expect(data.staging_id).toBe(uploadedStagingId);
      expect(data).toHaveProperty('staging_done');
      expect(data).toHaveProperty('staging_processes');
      expect(typeof data.staging_processes.stage).toBe('string');
    });
  });
});
