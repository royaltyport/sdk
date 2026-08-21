import type { ApiResponse, PaginatedResult } from '../types/common.js';
import type {
  Tag,
  TagListOptions,
  TagScope,
  TagUpdateInput,
  TagUpdateResult,
} from '../types/tags.js';
import { BaseResource } from './base.js';

export class Tags extends BaseResource {
  async list(
    projectId: string,
    scope: TagScope,
    options?: TagListOptions,
  ): Promise<ApiResponse<PaginatedResult<Tag>>> {
    return this.http.get('/tags', {
      projectId,
      scope,
      page: options?.page?.toString(),
      perPage: options?.perPage?.toString(),
      search: options?.search,
    });
  }

  async update(projectId: string, input: TagUpdateInput): Promise<ApiResponse<TagUpdateResult>> {
    return this.http.put('/tags', input, { projectId });
  }
}
