import type { ApiResponse, PaginatedResult } from '../types/common.js';
import type { Artist, ArtistListOptions, ArtistGetOptions } from '../types/artists.js';
import { BaseResource } from './base.js';

export class Artists extends BaseResource {
  async list(projectId: string, options?: ArtistListOptions): Promise<ApiResponse<PaginatedResult<Artist>>> {
    return this.http.get('/artists', {
      projectId,
      page: options?.page?.toString(),
      perPage: options?.perPage?.toString(),
      includeMerged: options?.includeMerged?.toString(),
    });
  }

  async get(projectId: string, artistId: number, options?: ArtistGetOptions): Promise<ApiResponse<Artist>> {
    return this.http.get(`/artists/${artistId}`, {
      projectId,
      includeMerged: options?.includeMerged?.toString(),
    });
  }
}
