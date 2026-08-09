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
import { runUploadFlow } from './upload-flow.js';

export class Contracts extends BaseResource {
  async list(projectId: string, options?: ContractListOptions): Promise<ApiResponse<PaginatedResult<Contract>>> {
    return this.http.get('/contracts', {
      projectId,
      page: options?.page?.toString(),
      perPage: options?.perPage?.toString(),
      includes: options?.includes?.join(','),
    });
  }

  async get(projectId: string, contractId: number | string, options?: ContractGetOptions): Promise<ApiResponse<Contract>> {
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
    return runUploadFlow({ http: this.http, resourcePath: '/contracts', projectId, file, options });
  }

  async download(projectId: string, contractId: number | string): Promise<ApiResponse<DownloadResult>> {
    return this.http.get(`/contracts/${contractId}/download`, { projectId });
  }

  async processes(projectId: string, id: number): Promise<ApiResponse<ContractProcesses>> {
    return this.http.get(`/contracts/${id}/processes`, { projectId });
  }
}
