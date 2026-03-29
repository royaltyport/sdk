export interface SearchResult {
  recordings: SearchMatch[];
  compositions: SearchMatch[];
  contracts: SearchMatch[];
  entities: SearchMatch[];
  artists: SearchMatch[];
  writers: SearchMatch[];
}

export interface SearchMatch {
  id: number;
  name: string;
  matched_keywords: string[];
  is_metadata_match: boolean;
  rank: number;
}
