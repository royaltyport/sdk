import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import type { ApiResponse, PaginatedResult } from '../types/common.js';
import type {
  Contract,
  ContractListOptions,
  ContractGetOptions,
  ContractUploadOptions,
  ContractUploadResult,
  DownloadResult,
  ContractProcesses,
} from '../types/contracts.js';
import { BaseResource } from './base.js';

export class Contracts extends BaseResource {
  async list(projectId: string, options?: ContractListOptions): Promise<ApiResponse<PaginatedResult<Contract>>> {
    return this.http.get('/contracts', {
      projectId,
      page: options?.page?.toString(),
      perPage: options?.perPage?.toString(),
      includes: options?.includes?.join(','),
    });
  }

  async get(projectId: string, contractId: number, options?: ContractGetOptions): Promise<ApiResponse<Contract>> {
    return this.http.get(`/contracts/${contractId}`, {
      projectId,
      includes: options?.includes?.join(','),
    });
  }

  async upload(
    projectId: string,
    file: Buffer | Uint8Array | Blob | string,
    options?: ContractUploadOptions,
  ): Promise<ApiResponse<ContractUploadResult>> {
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

    if (options?.extractions) {
      formData.append('extractions', JSON.stringify(options.extractions));
    }

    const uploadOptions = options?.onProgress ? { onProgress: options.onProgress } : undefined;

    return this.http.postMultipart('/contracts', formData, { projectId }, uploadOptions);
  }

  async download(projectId: string, contractId: number): Promise<ApiResponse<DownloadResult>> {
    return this.http.get(`/contracts/${contractId}/download`, { projectId });
  }

  async processes(projectId: string, contractId: number): Promise<ApiResponse<ContractProcesses>> {
    return this.http.get(`/contracts/${contractId}/processes`, { projectId });
  }
}
