import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import type { ApiResponse, PaginatedResult } from '../types/common.js';
import type {
  Statement,
  StatementListOptions,
  StatementUploadOptions,
  StatementUploadResult,
  StatementDownloadResult,
  StatementProcesses,
} from '../types/statements.js';
import { BaseResource } from './base.js';

export class Statements extends BaseResource {
  async list(projectId: string, options?: StatementListOptions): Promise<ApiResponse<PaginatedResult<Statement>>> {
    return this.http.get('/statements', {
      projectId,
      page: options?.page?.toString(),
      perPage: options?.perPage?.toString(),
    });
  }

  async get(projectId: string, statementId: number): Promise<ApiResponse<Statement>> {
    return this.http.get(`/statements/${statementId}`, { projectId });
  }

  async upload(
    projectId: string,
    file: Buffer | Uint8Array | Blob | string,
    options?: StatementUploadOptions,
  ): Promise<ApiResponse<StatementUploadResult>> {
    const formData = new FormData();

    if (typeof file === 'string') {
      const fileBuffer = readFileSync(file);
      const fileName = options?.fileName ?? basename(file);
      const fileType = options?.fileType ?? 'application/pdf';
      formData.append('file', new Blob([new Uint8Array(fileBuffer)], { type: fileType }), fileName);
    } else if (file instanceof Blob) {
      formData.append('file', file, options?.fileName ?? 'upload.pdf');
    } else {
      const fileType = options?.fileType ?? 'application/pdf';
      formData.append('file', new Blob([new Uint8Array(file)], { type: fileType }), options?.fileName ?? 'upload.pdf');
    }

    const uploadOptions = options?.onProgress ? { onProgress: options.onProgress } : undefined;

    return this.http.postMultipart('/statements', formData, { projectId }, uploadOptions);
  }

  async download(projectId: string, statementId: number): Promise<ApiResponse<StatementDownloadResult>> {
    return this.http.get(`/statements/${statementId}/download`, { projectId });
  }

  async processes(projectId: string, statementId: number): Promise<ApiResponse<StatementProcesses>> {
    return this.http.get(`/statements/${statementId}/processes`, { projectId });
  }
}
