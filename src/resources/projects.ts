import type { ApiResponse } from '../types/common.js';
import type { Project, ProjectCreateInput } from '../types/projects.js';
import { BaseResource } from './base.js';

export class Projects extends BaseResource {
  async list(): Promise<ApiResponse<Project[]>> {
    return this.http.get('/projects');
  }

  async get(projectId: string): Promise<ApiResponse<Project>> {
    return this.http.get(`/projects/${projectId}`);
  }

  async create(input: ProjectCreateInput): Promise<ApiResponse<Project>> {
    return this.http.post('/projects', input, undefined, { retry: false });
  }
}
