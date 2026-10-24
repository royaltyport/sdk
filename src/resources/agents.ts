import { BaseResource } from './base.js';
import type { ApiResponse } from '../types/common.js';
import type { AgentRun, AgentRunListMeta, AgentRunListOptions, AgentRunSummary } from '../types/agents.js';

export class Agents extends BaseResource {
  async listRuns(projectId: string, options?: AgentRunListOptions): Promise<ApiResponse<AgentRunSummary[], AgentRunListMeta>> {
    return this.http.get<AgentRunSummary[], AgentRunListMeta>('/agents/runs', {
      projectId,
      resourceType: options?.resourceType,
      resourceId: options?.resourceId?.toString(),
      processKey: options?.processKey,
      status: options?.status,
      limit: options?.limit?.toString(),
      cursor: options?.cursor,
    });
  }

  async getRun(projectId: string, runId: string): Promise<ApiResponse<AgentRun>> {
    return this.http.get(`/agents/runs/${encodeURIComponent(runId)}`, { projectId });
  }
}
