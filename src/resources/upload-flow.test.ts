import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import { HttpClient } from '../http.js';
import { Statements } from './statements.js';
import { Contracts } from './contracts.js';
import {
  RoyaltyportError,
  RoyaltyportUploadError,
  RoyaltyportValidationError,
} from '../errors.js';

const SIGNED_URL = 'https://storage.example.com/object/sign/abc?token=xyz';
const FILE_PATH = 'proj-1/statements_staging/internal-id';
const RATE_HEADERS = { 'X-RateLimit-Limit': '10', 'X-RateLimit-Remaining': '9', 'X-RateLimit-Reset': '1' };

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = RATE_HEADERS) {
  return new Response(JSON.stringify(body), { status, headers: new Headers(headers) });
}

function mintResponse(stagingId = 123) {
  return jsonResponse(
    { data: { staging_id: stagingId, upload_url: SIGNED_URL, file_path: FILE_PATH } },
    201,
  );
}

function completeResponse(stagingId = 123) {
  return jsonResponse({ data: { staging_id: stagingId, status: 'uploaded', context_applied: false } });
}

function createStatements(fetchFn: typeof globalThis.fetch) {
  const http = new HttpClient({
    baseUrl: 'https://api.example.com',
    token: 'test-token',
    fetch: fetchFn,
    retryDelay: 0,
  });
  return new Statements(http);
}

function happyPathFetch() {
  return vi
    .fn()
    .mockResolvedValueOnce(mintResponse())
    .mockResolvedValueOnce(new Response('{}', { status: 200 }))
    .mockResolvedValueOnce(completeResponse());
}

const pdfBytes = new TextEncoder().encode('%PDF-1.4 test content');

describe('upload flow orchestration', () => {
  it('runs mint -> PUT -> complete in order and returns the slim result', async () => {
    const fetchFn = happyPathFetch();
    const statements = createStatements(fetchFn);

    const result = await statements.upload('proj-1', pdfBytes, { fileName: 'stmt.pdf' });

    expect(fetchFn).toHaveBeenCalledTimes(3);

    const [mintUrl, mintInit] = fetchFn.mock.calls[0]! as [string, RequestInit];
    expect(mintUrl).toBe('https://api.example.com/v1/statements/uploads?projectId=proj-1');
    expect(mintInit.method).toBe('POST');
    expect(JSON.parse(mintInit.body as string)).toEqual({
      fileName: 'stmt.pdf',
      fileType: 'application/pdf',
      fileSize: pdfBytes.byteLength,
      fileExtension: 'pdf',
    });

    const [putUrl, putInit] = fetchFn.mock.calls[1]! as [string, RequestInit];
    expect(putUrl).toBe(SIGNED_URL);
    expect(putInit.method).toBe('PUT');
    const putHeaders = putInit.headers as Record<string, string>;
    expect(putHeaders['Authorization']).toBeUndefined();
    expect(putHeaders['content-type']).toBe('application/pdf');
    expect(putHeaders['x-upsert']).toBe('true');

    const [completeUrl, completeInit] = fetchFn.mock.calls[2]! as [string, RequestInit];
    expect(completeUrl).toBe('https://api.example.com/v1/statements/uploads/complete?projectId=proj-1');
    expect(JSON.parse(completeInit.body as string)).toEqual({ stagingId: 123 });

    expect(result.data).toEqual({
      staging_id: 123,
      status: 'uploaded',
      file_path: FILE_PATH,
      context_applied: false,
    });
    expect(result.rateLimit).toEqual({ limit: 10, remaining: 9, reset: 1 });
  });

  it('sends extractions as a real JSON array for contracts', async () => {
    const fetchFn = happyPathFetch();
    const http = new HttpClient({
      baseUrl: 'https://api.example.com',
      token: 'test-token',
      fetch: fetchFn,
      retryDelay: 0,
    });
    const contracts = new Contracts(http);

    await contracts.upload('proj-1', pdfBytes, { extractions: ['extract-dates'] });

    const mintBody = JSON.parse((fetchFn.mock.calls[0]![1] as RequestInit).body as string);
    expect(mintBody.extractions).toEqual(['extract-dates']);
    expect(fetchFn.mock.calls[0]![0]).toBe('https://api.example.com/v1/contracts/uploads?projectId=proj-1');
  });

  it('sends approved statement context and returns contextual completion fields', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(mintResponse())
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
      .mockResolvedValueOnce(jsonResponse({
        data: {
          staging_id: 123,
          status: 'queued',
          context_applied: true,
          snapshot_hash: 'a'.repeat(64),
          enqueued: 1,
          paused: 0,
        },
      }));
    const statements = createStatements(fetchFn);

    const result = await statements.upload('proj-1', pdfBytes, {
      folderName: 'Ocean Wave/2026/Q1',
      context: {
        accountingPeriod: { value: '2026Q1' },
        targetPeriod: { value: '2026Q1' },
        currencyRoyalty: 'GBP',
        currencyTransaction: 'USD',
        payee: 'Ocean Wave Records Ltd',
        payor: 'Absolute Marketing & Distribution Ltd',
        classification: {
          scenarioFamily: 'distribution.general',
          targetFamily: 'recording_distribution',
        },
        tags: ['Priority', 'Quarterly'],
      },
    });

    const mintBody = JSON.parse((fetchFn.mock.calls[0]![1] as RequestInit).body as string);
    expect(mintBody).toMatchObject({
      folderName: 'Ocean Wave/2026/Q1',
      context: {
        accountingPeriod: { value: '2026Q1' },
        targetPeriod: { value: '2026Q1' },
        currencyRoyalty: 'GBP',
        currencyTransaction: 'USD',
        payee: 'Ocean Wave Records Ltd',
        payor: 'Absolute Marketing & Distribution Ltd',
        classification: {
          scenarioFamily: 'distribution.general',
          targetFamily: 'recording_distribution',
        },
        tags: ['Priority', 'Quarterly'],
      },
    });
    expect(result.data).toEqual({
      staging_id: 123,
      status: 'queued',
      file_path: FILE_PATH,
      context_applied: true,
      snapshot_hash: 'a'.repeat(64),
      enqueued: 1,
      paused: 0,
    });
  });

  it('sends contract tag names and folder metadata', async () => {
    const fetchFn = happyPathFetch();
    const http = new HttpClient({
      baseUrl: 'https://api.example.com',
      token: 'test-token',
      fetch: fetchFn,
      retryDelay: 0,
    });
    const contracts = new Contracts(http);

    await contracts.upload('proj-1', pdfBytes, {
      folderName: 'Ocean Wave/Agreements',
      context: { tags: ['Priority', 'Artist agreement'] },
    });

    const mintBody = JSON.parse((fetchFn.mock.calls[0]![1] as RequestInit).body as string);
    expect(mintBody).toMatchObject({
      folderName: 'Ocean Wave/Agreements',
      context: { tags: ['Priority', 'Artist agreement'] },
    });
  });
});

describe('input normalization', () => {
  it('reads a filesystem path and derives fileName from basename', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sdk-upload-'));
    const filePath = join(dir, 'statement.pdf');
    await writeFile(filePath, pdfBytes);

    const fetchFn = happyPathFetch();
    const statements = createStatements(fetchFn);

    await statements.upload('proj-1', filePath);

    const mintBody = JSON.parse((fetchFn.mock.calls[0]![1] as RequestInit).body as string);
    expect(mintBody).toEqual({
      fileName: 'statement.pdf',
      fileType: 'application/pdf',
      fileSize: pdfBytes.byteLength,
      fileExtension: 'pdf',
    });
  });

  it('normalizes a Buffer with defaults', async () => {
    const fetchFn = happyPathFetch();
    const statements = createStatements(fetchFn);

    await statements.upload('proj-1', Buffer.from(pdfBytes));

    const mintBody = JSON.parse((fetchFn.mock.calls[0]![1] as RequestInit).body as string);
    expect(mintBody).toEqual({
      fileName: 'upload.pdf',
      fileType: 'application/pdf',
      fileSize: pdfBytes.byteLength,
      fileExtension: 'pdf',
    });
  });

  it('uses the Blob type when no fileType option is given', async () => {
    const fetchFn = happyPathFetch();
    const statements = createStatements(fetchFn);

    await statements.upload('proj-1', new Blob([pdfBytes], { type: 'application/pdf' }));

    const mintBody = JSON.parse((fetchFn.mock.calls[0]![1] as RequestInit).body as string);
    expect(mintBody.fileType).toBe('application/pdf');
  });

  it('lets options.fileType win over the Blob type', async () => {
    const fetchFn = happyPathFetch();
    const statements = createStatements(fetchFn);

    // Blob claims text/plain; the explicit option must win (old SDK ignored it)
    await statements.upload('proj-1', new Blob([pdfBytes], { type: 'text/plain' }), {
      fileType: 'application/pdf',
    });

    const mintBody = JSON.parse((fetchFn.mock.calls[0]![1] as RequestInit).body as string);
    expect(mintBody.fileType).toBe('application/pdf');
  });

  it('omits fileExtension for a dot-less fileName', async () => {
    const fetchFn = happyPathFetch();
    const statements = createStatements(fetchFn);

    await statements.upload('proj-1', pdfBytes, { fileName: 'contract' });

    const mintBody = JSON.parse((fetchFn.mock.calls[0]![1] as RequestInit).body as string);
    expect(mintBody.fileName).toBe('contract');
    expect(mintBody).not.toHaveProperty('fileExtension');
  });

  it('defaults an untyped Blob to application/pdf', async () => {
    const fetchFn = happyPathFetch();
    const statements = createStatements(fetchFn);

    await statements.upload('proj-1', new Blob([pdfBytes]));

    const mintBody = JSON.parse((fetchFn.mock.calls[0]![1] as RequestInit).body as string);
    expect(mintBody.fileType).toBe('application/pdf');
  });
});

describe('local preflight', () => {
  it('rejects files over 50 MB without any network call', async () => {
    const fetchFn = vi.fn();
    const statements = createStatements(fetchFn);

    const oversized = new Uint8Array(52_428_801);
    await expect(statements.upload('proj-1', oversized)).rejects.toThrow(RoyaltyportValidationError);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('rejects non-PDF fileType without any network call', async () => {
    const fetchFn = vi.fn();
    const statements = createStatements(fetchFn);

    await expect(
      statements.upload('proj-1', pdfBytes, { fileType: 'text/csv' }),
    ).rejects.toThrow(RoyaltyportValidationError);
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

describe('error mapping per step', () => {
  it('step 1 (mint) failure throws the plain mapped error class', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse({ error: { fileSize: ['fileSize exceeds maximum'] } }, 400),
    );
    const statements = createStatements(fetchFn);

    try {
      await statements.upload('proj-1', pdfBytes);
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(RoyaltyportValidationError);
      expect(err).not.toBeInstanceOf(RoyaltyportUploadError);
      expect((err as RoyaltyportValidationError).fields).toEqual({ fileSize: ['fileSize exceeds maximum'] });
    }
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('step 1 ambiguous server failure is not retried', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse({ error: { message: 'Internal server error' } }, 500),
    );
    const statements = createStatements(fetchFn);

    await expect(statements.upload('proj-1', pdfBytes)).rejects.toThrow(RoyaltyportError);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('step 2 (PUT) failure throws RoyaltyportUploadError with stagingId and filePath', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(mintResponse())
      .mockResolvedValue(new Response('access denied', { status: 403 }));
    const statements = createStatements(fetchFn);

    try {
      await statements.upload('proj-1', pdfBytes);
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(RoyaltyportUploadError);
      const uploadErr = err as RoyaltyportUploadError;
      expect(uploadErr.step).toBe('put');
      expect(uploadErr.stagingId).toBe(123);
      expect(uploadErr.filePath).toBe(FILE_PATH);
      expect(uploadErr.status).toBe(403);
      expect(uploadErr.cause).toBeInstanceOf(RoyaltyportError);
    }
  });

  it('step 3 (complete) failure wraps the mapped error as cause', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(mintResponse())
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
      .mockResolvedValueOnce(jsonResponse({ error: { message: 'Uploaded file is not a PDF' } }, 400));
    const statements = createStatements(fetchFn);

    try {
      await statements.upload('proj-1', pdfBytes);
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(RoyaltyportUploadError);
      const uploadErr = err as RoyaltyportUploadError;
      expect(uploadErr.step).toBe('complete');
      expect(uploadErr.stagingId).toBe(123);
      expect(uploadErr.status).toBe(400);
      expect(uploadErr.cause).toBeInstanceOf(RoyaltyportValidationError);
      expect(uploadErr.message).toContain('Uploaded file is not a PDF');
    }
  });

  it('step 3 ambiguous network failure is not retried', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(mintResponse())
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
      .mockRejectedValue(new TypeError('socket hang up'));
    const statements = createStatements(fetchFn);

    try {
      await statements.upload('proj-1', pdfBytes);
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(RoyaltyportUploadError);
      expect((err as RoyaltyportUploadError).step).toBe('complete');
      expect((err as RoyaltyportUploadError).stagingId).toBe(123);
    }
    // mint + PUT + a single complete attempt — no retry after the ambiguous failure
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it('step 2 retries transient storage failures before succeeding', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(mintResponse())
      .mockResolvedValueOnce(new Response('storage blip', { status: 500 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
      .mockResolvedValueOnce(completeResponse());
    const statements = createStatements(fetchFn);

    const result = await statements.upload('proj-1', pdfBytes);

    expect(result.data.status).toBe('uploaded');
    expect(fetchFn).toHaveBeenCalledTimes(4);
  });
});
