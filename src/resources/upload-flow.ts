import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import type { HttpClient } from '../http.js';
import type { ApiResponse } from '../types/common.js';
import type { ExtractionId } from '../types/contracts.js';
import { RoyaltyportError, RoyaltyportUploadError, RoyaltyportValidationError } from '../errors.js';

const MAX_FILE_SIZE = 52_428_800; // 50 MB, mirrors the server's limit
const ALLOWED_FILE_TYPE = 'application/pdf';

interface UploadUrlResult {
  staging_id: number;
  upload_url: string;
  file_path: string;
}

interface CompleteResult {
  staging_id: number;
  status: 'uploaded';
}

export interface UploadFlowResult {
  staging_id: number;
  status: 'uploaded';
  file_path: string;
}

export interface UploadFlowParams {
  http: HttpClient;
  resourcePath: '/statements' | '/contracts';
  projectId: string;
  file: Buffer | Uint8Array | Blob | string;
  options?:
    | {
        fileName?: string;
        fileType?: string;
        extractions?: ExtractionId[];
      }
    | undefined;
}

interface NormalizedFile {
  bytes: Uint8Array;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileExtension: string | undefined;
}

async function normalizeFile(
  file: Buffer | Uint8Array | Blob | string,
  options?: UploadFlowParams['options'],
): Promise<NormalizedFile> {
  let bytes: Uint8Array;
  let fileName: string;
  let fileType: string;

  if (typeof file === 'string') {
    bytes = new Uint8Array(await readFile(file));
    fileName = options?.fileName ?? basename(file);
    fileType = options?.fileType ?? ALLOWED_FILE_TYPE;
  } else if (file instanceof Blob) {
    bytes = new Uint8Array(await file.arrayBuffer());
    fileName = options?.fileName ?? 'upload.pdf';
    fileType = options?.fileType ?? (file.type || ALLOWED_FILE_TYPE);
  } else {
    bytes = file;
    fileName = options?.fileName ?? 'upload.pdf';
    fileType = options?.fileType ?? ALLOWED_FILE_TYPE;
  }

  const dot = fileName.lastIndexOf('.');
  const extension = dot > 0 ? fileName.slice(dot + 1) : '';
  return {
    bytes,
    fileName,
    fileType,
    fileSize: bytes.byteLength,
    fileExtension: extension || undefined,
  };
}

export async function runUploadFlow({
  http,
  resourcePath,
  projectId,
  file,
  options,
}: UploadFlowParams): Promise<ApiResponse<UploadFlowResult>> {
  const { bytes, fileName, fileType, fileSize, fileExtension } = await normalizeFile(file, options);

  // Local preflight mirroring the server's mint validation — fail before any network call.
  if (fileType !== ALLOWED_FILE_TYPE) {
    throw new RoyaltyportValidationError(`fileType must be one of: ${ALLOWED_FILE_TYPE}`);
  }
  if (fileSize > MAX_FILE_SIZE) {
    throw new RoyaltyportValidationError(`fileSize exceeds maximum of ${MAX_FILE_SIZE} bytes`);
  }

  const mint = await http.post<UploadUrlResult>(
    `${resourcePath}/uploads`,
    {
      fileName,
      fileType,
      fileSize,
      ...(fileExtension && { fileExtension }),
      ...(options?.extractions && { extractions: options.extractions }),
    },
    { projectId },
  );

  const { staging_id, upload_url, file_path } = mint.data;

  try {
    await http.putExternal(upload_url, {
      headers: { 'content-type': fileType, 'x-upsert': 'true' },
      body: bytes as BodyInit,
    });
  } catch (err) {
    const status = err instanceof RoyaltyportError ? err.status : 0;
    throw new RoyaltyportUploadError(
      `Upload failed while sending file bytes to storage: ${err instanceof Error ? err.message : String(err)}`,
      { step: 'put', status, stagingId: staging_id, filePath: file_path, cause: err },
    );
  }

  let done: ApiResponse<CompleteResult>;
  try {
    // No retry on ambiguous network failures: a request that was sent but got
    // no response may already have triggered processing server-side.
    done = await http.post<CompleteResult>(
      `${resourcePath}/uploads/complete`,
      { stagingId: staging_id },
      { projectId },
      { retryNetworkErrors: false },
    );
  } catch (err) {
    const status = err instanceof RoyaltyportError ? err.status : 0;
    const rateLimit = err instanceof RoyaltyportError ? err.rateLimit : undefined;
    throw new RoyaltyportUploadError(
      `Upload completion failed (file bytes are in storage): ${err instanceof Error ? err.message : String(err)}`,
      { step: 'complete', status, stagingId: staging_id, ...(rateLimit && { rateLimit }), cause: err },
    );
  }

  return {
    data: { staging_id, status: 'uploaded', file_path },
    rateLimit: done.rateLimit,
  };
}
