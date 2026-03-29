import type { PaginationOptions } from './common.js';

export interface Recording {
  id: number;
  internal_uuid: string;
  name: string;
  type: 'original' | 'derivative';
  isrc?: string;
  duration_ms?: number;
  release_date?: string;
  artists: RecordingArtist[];
  creators: RecordingCreator[];
  products?: RecordingProduct[];
}

export interface RecordingArtist {
  name: string;
  spotify_id?: string;
}

export interface RecordingCreator {
  name: string;
  role: string;
}

export interface RecordingProduct {
  name: string;
  upc: string;
  release_date?: string;
  artists?: RecordingArtist[];
  store: string;
}

export interface RecordingListOptions extends PaginationOptions {
  includeProducts?: boolean;
}

export interface RecordingGetOptions {
  includeProducts?: boolean;
}
