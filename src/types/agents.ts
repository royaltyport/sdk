/** Public downstream processing contract for Birch. */
export type AgentRunStatus = 'queued' | 'running' | 'waiting' | 'completed' | 'completed_with_issues' | 'no_work' | 'blocked' | 'superseded' | 'failed' | 'cancelled';
export type AgentStepStatus = 'pending' | AgentRunStatus | 'skipped' | 'not_run' | 'unknown';
export type AgentResourceType = 'contract' | 'statement' | 'project';
export type AgentProcessKey =
  | 'contract-processing' | 'contract-duplicate-check' | 'contract-relationships'
  | 'contract-repair-apply' | 'project-convergence' | 'copyright-evaluation'
  | 'statement-processing' | 'statement-file-consolidation' | 'statement-reconciliation'
  | 'statement-asset-group-projection' | 'statement-dataroom-sync' | 'statement-dataroom-transform'
  | 'statement-coverage-resolution' | 'contract-relationships-payment-chains'
  | 'relationship-review-resolution' | 'statements-export' | 'documents-export' | 'catalog-export'
  | 'catalog-radar-scan' | 'recording-suggestion-search' | 'composition-suggestion-search'
  | 'recording-suggestion-creation' | 'composition-suggestion-creation'
  | 'statement-recording-suggestion-search' | 'statement-composition-suggestion-search'
  | 'statement-recording-suggestion-creation' | 'statement-composition-suggestion-creation';
export interface AgentMessage { code: string; message: string }
export type AgentScope = { type: 'contract' | 'statement'; id: number } | { type: 'project'; id: string };
export interface AgentRunSummary {
  id: string;
  process_key: AgentProcessKey;
  scope: AgentScope;
  input_revision: string;
  status: AgentRunStatus;
  terminal: boolean;
  links: { self: string };
}
export interface AgentStep {
  key: string;
  label: string;
  status: AgentStepStatus;
  terminal: boolean;
  input_revision: string | null;
  output_revision: string | null;
  attempt: number;
  started_at: string | null;
  completed_at: string | null;
  reason: AgentMessage | null;
  error: AgentMessage | null;
  issues: AgentMessage[];
  blocked_by?: string;
}
export interface AgentRun extends AgentRunSummary {
  generation: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  steps: AgentStep[];
  issues: AgentMessage[];
  poll_after_seconds: number | null;
  links: { self: string; resource: string };
}
export interface AgentReadiness {
  key: string;
  status: 'pending' | 'ready' | 'not_applicable' | 'blocked' | 'failed' | 'unknown';
  /** Opaque collection token; reuse on every conditional reader page. */
  revision: string | null;
  published_at: string | null;
  reason: AgentMessage | null;
  quality: { status: 'clean' | 'issues' | 'unknown'; issues: AgentMessage[] };
  links: { data: string | null };
}
export interface ResourceAgents {
  resource: { type: 'contract' | 'statement'; id: number };
  source_revision: string;
  observed_at: string;
  handoff: { status: 'pending' | 'accepted' | 'not_required' | 'failed' | 'unknown'; source_revision: string; error: AgentMessage | null };
  agent_readiness: AgentReadiness[];
  agent_runs: AgentRunSummary[];
  poll_after_seconds: number | null;
  links: { self: string; runs?: string };
}
export interface AgentRunListOptions {
  resourceType?: AgentResourceType;
  /** Required resourceType; numeric document ID or project UUID. */
  resourceId?: number | string;
  processKey?: AgentProcessKey;
  status?: AgentRunStatus;
  limit?: number;
  cursor?: string;
}
export interface AgentRunListMeta { has_more: boolean; next_cursor: string | null }
