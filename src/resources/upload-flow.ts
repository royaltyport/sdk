import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import type { HttpClient } from '../http.js';
import type { ApiResponse } from '../types/common.js';
import type { ExtractionId } from '../types/contracts.js';
import type { ContractUploadContext, StatementUploadContext, UploadResult } from '../types/uploads.js';
import { RoyaltyportError, RoyaltyportUploadError, RoyaltyportValidationError } from '../errors.js';
import {
  getStatementUploadExtension,
  isStatementUploadFileNameAccepted,
  resolveStatementUploadMimeType,
} from './statement-upload.js';

const MAX_FILE_SIZE = 52_428_800; // 50 MB, mirrors the server's limit
const CONTRACT_UPLOAD_FILE_TYPE = 'application/pdf';

interface UploadUrlResult {
  staging_id: number;
  upload_url: string;
  file_path: string;
}

type CompleteResult = Omit<UploadResult, 'file_path'>;

export type UploadFlowResult = UploadResult;

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
        folderName?: string | null;
        context?: ContractUploadContext | StatementUploadContext;
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

function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot > 0 && lastDot < fileName.length - 1
    ? fileName.slice(lastDot + 1).toLowerCase()
    : '';
}

async function normalizeFile(
  file: Buffer | Uint8Array | Blob | string,
  resourcePath: UploadFlowParams['resourcePath'],
  options?: UploadFlowParams['options'],
): Promise<NormalizedFile> {
  let bytes: Uint8Array;
  let fileName: string;
  let fileType: string;

  if (typeof file === 'string') {
    bytes = new Uint8Array(await readFile(file));
    fileName = options?.fileName ?? basename(file);
  } else if (file instanceof Blob) {
    bytes = new Uint8Array(await file.arrayBuffer());
    fileName = options?.fileName ?? 'upload.pdf';
  } else {
    bytes = file;
    fileName = options?.fileName ?? 'upload.pdf';
  }

  const blobFileType = file instanceof Blob && file.type ? file.type : undefined;
  const suppliedFileType = options?.fileType ?? blobFileType;
  fileType = resourcePath === '/statements'
    ? resolveStatementUploadMimeType(fileName, suppliedFileType)
    : suppliedFileType ?? CONTRACT_UPLOAD_FILE_TYPE;
  const extension = resourcePath === '/statements'
    ? getStatementUploadExtension(fileName)
    : getFileExtension(fileName);
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
  const { bytes, fileName, fileType, fileSize, fileExtension } = await normalizeFile(file, resourcePath, options);

  // Local preflight mirroring the server's mint validation — fail before any network call.
  if (resourcePath === '/statements' && !isStatementUploadFileNameAccepted(fileName)) {
    throw new RoyaltyportValidationError('fileName is not supported by the statement stager');
  }
  if (
    resourcePath === '/contracts'
    && (fileType !== CONTRACT_UPLOAD_FILE_TYPE || (fileExtension && fileExtension !== 'pdf'))
  ) {
    throw new RoyaltyportValidationError('Contracts must be PDF files with fileType application/pdf');
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
      ...(options?.folderName !== undefined && { folderName: options.folderName }),
      ...(options?.context !== undefined && { context: options.context }),
    },
    { projectId },
    { retry: false },
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
      { retry: false },
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
    data: { ...done.data, staging_id, file_path },
    rateLimit: done.rateLimit,
  };
}
