import type { ResourceAgents } from '../types/agents.js';
import type { ContractStagingResolution, ResolutionOptions } from '../types/resolutions.js';
import type { ApiResponse, PaginatedResult } from '../types/common.js';
import type {
  Contract,
  ContractExtractionMap,
  ContractExtractionKey,
  ContractExtractionListOptions,
  ContractListOptions,
  ContractGetOptions,
  ContractUpdateInput,
  ContractUpdateResult,
  ContractUploadOptions,
  ContractUploadResult,
  DownloadResult,
  ContractIngestion,
} from '../types/contracts.js';
import { BaseResource } from './base.js';
import { runUploadFlow } from './upload-flow.js';

export class Contracts extends BaseResource {
  /** Inspect downstream processing using the canonical contract ID. */
  async agents(projectId: string, id: number): Promise<ApiResponse<ResourceAgents>> {
    return this.http.get(`/contracts/${id}/agents`, { projectId });
  }

  async list(projectId: string, options?: ContractListOptions): Promise<ApiResponse<PaginatedResult<Contract>>> {
    return this.http.get('/contracts', {
      projectId,
      page: options?.page?.toString(),
      perPage: options?.perPage?.toString(),
      extractorIds: options?.extractorIds?.join(','),
      score: options?.score?.toString(),
      citations: options?.citations?.toString(),
    });
  }

  async get(projectId: string, contractId: number | string, options?: ContractGetOptions): Promise<ApiResponse<Contract>> {
    return this.http.get(`/contracts/${contractId}`, {
      projectId,
      extractorIds: options?.extractorIds?.join(','),
      score: options?.score?.toString(),
      citations: options?.citations?.toString(),
    });
  }

  async listExtraction<K extends ContractExtractionKey>(
    projectId: string,
    contractId: number | string,
    extraction: K,
    options?: ContractExtractionListOptions,
  ): Promise<ApiResponse<PaginatedResult<ContractExtractionMap[K]>>> {
    return this.http.get(`/contracts/${contractId}/extractions/${extraction}`, {
      projectId,
      page: options?.page?.toString(),
      perPage: options?.perPage?.toString(),
      citations: options?.citations?.toString(),
      expectedRevision: options?.expectedRevision,
    });
  }

  async update(
    projectId: string,
    contractId: number | string,
    input: ContractUpdateInput,
  ): Promise<ApiResponse<ContractUpdateResult>> {
    return this.http.put(`/contracts/${contractId}`, input, { projectId });
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

  async ingestion(projectId: string, id: number): Promise<ApiResponse<ContractIngestion>> {
    return this.http.get(`/contracts/${id}/ingestion`, { projectId });
  }

  /** Resolve the currently observed pause. Reuse the same key and payload on retries. */
  async resolveStaging(projectId: string, stagingId: number, input: ContractStagingResolution, options: ResolutionOptions): Promise<ApiResponse<ContractIngestion>> {
    if (!options || typeof options.idempotencyKey !== 'string' || !/^[\x21-\x7e]{1,200}$/.test(options.idempotencyKey)) {
      throw new Error('idempotencyKey must contain 1–200 printable non-whitespace ASCII characters');
    }
    return this.http.post(`/contracts/staging/${stagingId}/resolve`, input, { projectId }, { idempotencyKey: options.idempotencyKey });
  }


}
