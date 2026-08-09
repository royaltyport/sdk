export type KnowledgeNodeKind =
  | 'organization'
  | 'team'
  | 'person'
  | 'process'
  | 'decision'
  | 'policy'
  | 'principle'
  | 'topic'
  | 'question';

export interface KnowledgeEvidence {
  source_id: number;
  source_type: string;
  title: string;
  revision_id: number;
  project_id: string | null;
  stance: 'supports' | 'refutes';
  authority_class: string;
  confidence: number | null;
  recorded_at: string;
  source_timestamp: string | null;
  content_locator: unknown;
}

export interface KnowledgeClaim {
  id: number;
  predicate: string;
  claim_type: string;
  value: unknown;
  state: 'active' | 'disputed' | 'stale';
  authority_class: string;
  evidence: KnowledgeEvidence[];
}

export interface KnowledgeRelationship {
  edge_id: number;
  edge_type: string;
  direction: 'inbound' | 'outbound';
  node: {
    id: number;
    kind: KnowledgeNodeKind;
    name: string;
  };
  state: 'active' | 'disputed' | 'stale';
  evidence_count: number;
}

export interface KnowledgeSearchNode {
  id: number;
  kind: KnowledgeNodeKind;
  name: string;
  summary: string | null;
  rank: number;
  claims: KnowledgeClaim[];
  relationships: KnowledgeRelationship[];
  updated_at: string | null;
}

export interface KnowledgeSearchResult {
  results: KnowledgeSearchNode[];
  freshness: {
    last_indexed_at: string | null;
    eventually_consistent: true;
    scope: 'organization_plus_project';
  };
}

export interface KnowledgeSearchOptions {
  limit?: number;
}
