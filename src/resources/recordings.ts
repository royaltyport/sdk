import type { ApiResponse, PaginatedResult } from '../types/common.js';
import type { Recording, RecordingListOptions, RecordingGetOptions } from '../types/recordings.js';
import { BaseResource } from './base.js';

export class Recordings extends BaseResource {
  async list(projectId: string, options?: RecordingListOptions): Promise<ApiResponse<PaginatedResult<Recording>>> {
    return this.http.get('/recordings', {
      projectId,
      page: options?.page?.toString(),
      perPage: options?.perPage?.toString(),
      includeProducts: options?.includeProducts?.toString(),
    });
  }

  async get(projectId: string, recordingId: number, options?: RecordingGetOptions): Promise<ApiResponse<Recording>> {
    return this.http.get(`/recordings/${recordingId}`, {
      projectId,
      includeProducts: options?.includeProducts?.toString(),
    });
  }
}
