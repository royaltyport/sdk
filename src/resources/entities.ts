import type { ApiResponse, PaginatedResult } from '../types/common.js';
import type { Entity, EntityListOptions, EntityGetOptions } from '../types/entities.js';
import { BaseResource } from './base.js';

export class Entities extends BaseResource {
  async list(projectId: string, options?: EntityListOptions): Promise<ApiResponse<PaginatedResult<Entity>>> {
    return this.http.get('/entities', {
      projectId,
      page: options?.page?.toString(),
      perPage: options?.perPage?.toString(),
      includeMerged: options?.includeMerged?.toString(),
    });
  }

  async get(projectId: string, entityId: number, options?: EntityGetOptions): Promise<ApiResponse<Entity>> {
    return this.http.get(`/entities/${entityId}`, {
      projectId,
      includeMerged: options?.includeMerged?.toString(),
    });
  }
}
