import type { ApiResponse, PaginatedResult } from '../types/common.js';
import type {
  Statement,
  StatementListOptions,
  StatementGetOptions,
  StatementUpdateInput,
  StatementUpdateResult,
  StatementUploadOptions,
  StatementUploadResult,
  StatementDownloadResult,
  StatementProcesses,
} from '../types/statements.js';
import type { StagingActionResult } from '../types/staging.js';
import { BaseResource } from './base.js';
import { runUploadFlow } from './upload-flow.js';

export class Statements extends BaseResource {
  async list(projectId: string, options?: StatementListOptions): Promise<ApiResponse<PaginatedResult<Statement>>> {
    return this.http.get('/statements', {
      projectId,
      page: options?.page?.toString(),
      perPage: options?.perPage?.toString(),
      stagingIds: options?.stagingIds?.join(','),
      extractionStage: options?.extractionStage,
      score: options?.score?.toString(),
    });
  }

  async get(projectId: string, statementId: number, options?: StatementGetOptions): Promise<ApiResponse<Statement>> {
    return this.http.get(`/statements/${statementId}`, {
      projectId,
      detailed: options?.detailed?.toString(),
      score: options?.score?.toString(),
    });
  }

  async update(
    projectId: string,
    statementId: number,
    input: StatementUpdateInput,
  ): Promise<ApiResponse<StatementUpdateResult>> {
    return this.http.put(`/statements/${statementId}`, input, { projectId });
  }

  async upload(
    projectId: string,
    file: Buffer | Uint8Array | Blob | string,
    options?: StatementUploadOptions,
  ): Promise<ApiResponse<StatementUploadResult>> {
    return runUploadFlow({ http: this.http, resourcePath: '/statements', projectId, file, options });
  }

  async download(projectId: string, statementId: number): Promise<ApiResponse<StatementDownloadResult>> {
    return this.http.get(`/statements/${statementId}/download`, { projectId });
  }

  async processes(projectId: string, id: number): Promise<ApiResponse<StatementProcesses>> {
    return this.http.get(`/statements/${id}/processes`, { projectId });
  }

  async retryStaging(projectId: string, stagingId: number): Promise<ApiResponse<StagingActionResult>> {
    return this.http.post(`/statements/staging/${stagingId}/retry`, {}, { projectId }, { retry: false });
  }
}
