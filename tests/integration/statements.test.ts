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

    it('uploads a statement via multipart', async () => {
      const testContent = 'artist,track,revenue\nTest Artist,Test Track,100.00';
      const file = new Blob([testContent], { type: 'application/pdf' });

      const { data } = await client.statements.upload(PROJECT_ID, file, {
        fileName: 'sdk-test-statement.pdf',
      });

      expect(data).toHaveProperty('staging_id');
      expect(typeof data.staging_id).toBe('number');

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
