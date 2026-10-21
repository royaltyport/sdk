import type { RetryStagingResolution, ResolutionOptions } from '../types/resolutions.js';
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

  /** Resolve the currently observed pause. Reuse the same key and payload on retries. */
  async resolveStaging(projectId: string, stagingId: number, input: RetryStagingResolution, options: ResolutionOptions): Promise<ApiResponse<StatementProcesses>> {
    if (!options || typeof options.idempotencyKey !== 'string' || !/^[\x21-\x7e]{1,200}$/.test(options.idempotencyKey)) {
      throw new Error('idempotencyKey must contain 1–200 printable non-whitespace ASCII characters');
    }
    return this.http.post(`/statements/staging/${stagingId}/resolve`, input, { projectId }, { idempotencyKey: options.idempotencyKey });
  }


}
