export interface SearchResult {
  recordings: RecordingSearchMatch[];
  compositions: CompositionSearchMatch[];
  contracts: ContractSearchMatch[];
  entities: NamedSearchMatch[];
  artists: NamedSearchMatch[];
  writers: NamedSearchMatch[];
}

export interface NamedSearchMatch {
  id: number;
  name: string;
}

export interface RecordingSearchMatch extends NamedSearchMatch {
  duration_ms: number | null;
  artists: unknown[] | null;
  matched_keywords: string;
  is_metadata_match: boolean;
  rank: number;
}

export interface CompositionSearchMatch extends NamedSearchMatch {
  writers: unknown[] | null;
  artists: unknown[] | null;
  matched_keywords: string;
  is_metadata_match: boolean;
  rank: number;
}

export interface ContractSearchMatch {
  id: number;
  matched_file_name: string;
  matched_keywords: string;
  is_content_match: boolean;
  rank: number;
}
