import type { ApiResponse, PaginatedResult } from '../types/common.js';
import type { Relation, RelationListOptions, RelationGetOptions } from '../types/relations.js';
import { BaseResource } from './base.js';

export class Relations extends BaseResource {
  async list(projectId: string, options?: RelationListOptions): Promise<ApiResponse<PaginatedResult<Relation>>> {
    return this.http.get('/relations', {
      projectId,
      page: options?.page?.toString(),
      perPage: options?.perPage?.toString(),
      includeMerged: options?.includeMerged?.toString(),
    });
  }

  async get(projectId: string, relationId: number, options?: RelationGetOptions): Promise<ApiResponse<Relation>> {
    return this.http.get(`/relations/${relationId}`, {
      projectId,
      includeMerged: options?.includeMerged?.toString(),
    });
  }
}
