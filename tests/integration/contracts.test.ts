import { describe, it, expect } from 'vitest';
import { client, PROJECT_ID } from './setup.js';

describe('Contracts (integration)', () => {
  it('lists contracts', async () => {
    const { data } = await client.contracts.list(PROJECT_ID, { page: 1, perPage: 10 });

    expect(data).toHaveProperty('items');
    expect(data).toHaveProperty('total_count');
    expect(Array.isArray(data.items)).toBe(true);
  });

  it('returns contract metadata without embedded extraction collections', async () => {
    const { data } = await client.contracts.list(PROJECT_ID);
    for (const contract of data.items) expect(contract).not.toHaveProperty('extractions');
  });

  it('pages typed commitments with automatic asset links', async () => {
    const { data: listed } = await client.contracts.list(PROJECT_ID, { perPage: 1 });
    const contractId = listed.items[0]?.id;
    if (!contractId) throw new Error('Staging corpus must include a contract');
    const { data } = await client.contracts.listExtraction(PROJECT_ID, contractId, 'commitments', { citations: true });
    expect(Array.isArray(data.items)).toBe(true);
    for (const commitment of data.items) {
      expect(commitment).not.toHaveProperty('internal_id');
      expect(typeof commitment.internal_uuid).toBe('string');
      expect(typeof commitment.created_at).toBe('string');
      expect(typeof commitment.updated_at).toBe('string');
      expect(Array.isArray(commitment.linked_deliverables)).toBe(true);
      expect(Array.isArray(commitment.citations)).toBe(true);
      for (const citation of commitment.citations ?? []) {
        expect(Object.keys(citation).sort()).toEqual([
          'citation',
          'field',
          'page',
          'section_number',
          'section_structure',
          'section_title',
        ]);
      }
      expect(Array.isArray(commitment.linked_assets)).toBe(true);
      expect(commitment).not.toHaveProperty('commitment_items');
      expect(commitment).not.toHaveProperty('reconciliation_state');
    }
  });

  describe('upload -> get -> download -> processes', () => {
    let uploadedStagingId: number;

    it('uploads a contract via the signed-URL flow', async () => {
      // Must start with %PDF- — the API validates the real bytes at complete
      const testContent = '%PDF-1.4 test contract content for SDK integration test';
      const file = new Blob([testContent], { type: 'application/pdf' });

      const { data } = await client.contracts.upload(PROJECT_ID, file, {
        fileName: 'sdk-test-contract.pdf',
        extractions: ['extract-dates', 'extract-signatures', 'extract-language'],
      });

      expect(typeof data.staging_id).toBe('number');
      expect(data.status).toBe('uploaded');
      expect(typeof data.file_path).toBe('string');

      uploadedStagingId = data.staging_id;
    });

    it('gets contract processes', async () => {
      if (!uploadedStagingId) return;

      const { data } = await client.contracts.ingestion(PROJECT_ID, uploadedStagingId);

      expect(data).toHaveProperty('staging_id');
      expect(data.staging_id).toBe(uploadedStagingId);
      expect(typeof data.status).toBe('string');
      expect(typeof data.terminal).toBe('boolean');
      expect(Array.isArray(data.resources)).toBe(true);
      expect(Array.isArray(data.document_processes)).toBe(true);
      for (const field of ['contract_id','statement_id','staging_done','extraction_done','extraction_processes']) expect(data).not.toHaveProperty(field);
      expect(data).toHaveProperty('staging_processes');
      expect(typeof data.staging_processes.stage).toBe('string');
    });
  });
});
