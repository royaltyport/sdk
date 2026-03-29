import type { ApiResponse, PaginatedResult } from '../types/common.js';
import type { Writer, WriterListOptions, WriterGetOptions } from '../types/writers.js';
import { BaseResource } from './base.js';

export class Writers extends BaseResource {
  async list(projectId: string, options?: WriterListOptions): Promise<ApiResponse<PaginatedResult<Writer>>> {
    return this.http.get('/writers', {
      projectId,
      page: options?.page?.toString(),
      perPage: options?.perPage?.toString(),
      includeMerged: options?.includeMerged?.toString(),
    });
  }

  async get(projectId: string, writerId: number, options?: WriterGetOptions): Promise<ApiResponse<Writer>> {
    return this.http.get(`/writers/${writerId}`, {
      projectId,
      includeMerged: options?.includeMerged?.toString(),
    });
  }
}
