export interface ScoreBuckets {
  [bucket: string]: unknown;
}

export interface ScoreSummary {
  score: number;
  meanScore: number;
  failed: number;
  warned: number;
  buckets?: ScoreBuckets;
}

export interface TriggeredScoreRule {
  rule_id: string;
  status: 'fail' | 'warn';
  severity: string;
  message: string | null;
  level: string;
  section: string | null;
  item_kind: string | null;
  item_id: string | null;
  meta: Record<string, unknown>;
}

export interface ResourceScore {
  summary: ScoreSummary | null;
  triggered_rules: TriggeredScoreRule[];
}
