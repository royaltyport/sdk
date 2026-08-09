import type { ApiResponse } from '../types/common.js';
import type { KnowledgeSearchOptions, KnowledgeSearchResult } from '../types/knowledge.js';
import { BaseResource } from './base.js';

export class Knowledge extends BaseResource {
  async search(
    projectId: string,
    query: string,
    options?: KnowledgeSearchOptions,
  ): Promise<ApiResponse<KnowledgeSearchResult>> {
    return this.http.get(`/projects/${projectId}/knowledge/search`, {
      q: query,
      limit: options?.limit?.toString(),
    });
  }
}
