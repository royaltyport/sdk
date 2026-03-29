import type { ApiResponse, PaginatedResult } from '../types/common.js';
import type { Composition, CompositionListOptions, CompositionGetOptions } from '../types/compositions.js';
import { BaseResource } from './base.js';

export class Compositions extends BaseResource {
  async list(projectId: string, options?: CompositionListOptions): Promise<ApiResponse<PaginatedResult<Composition>>> {
    return this.http.get('/compositions', {
      projectId,
      page: options?.page?.toString(),
      perPage: options?.perPage?.toString(),
      includeProducts: options?.includeProducts?.toString(),
    });
  }

  async get(projectId: string, compositionId: number, options?: CompositionGetOptions): Promise<ApiResponse<Composition>> {
    return this.http.get(`/compositions/${compositionId}`, {
      projectId,
      includeProducts: options?.includeProducts?.toString(),
    });
  }
}
