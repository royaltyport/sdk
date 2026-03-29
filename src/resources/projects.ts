import type { ApiResponse } from '../types/common.js';
import type { Project } from '../types/projects.js';
import { BaseResource } from './base.js';

export class Projects extends BaseResource {
  async list(): Promise<ApiResponse<Project[]>> {
    return this.http.get('/projects');
  }

  async get(projectId: string): Promise<ApiResponse<Project>> {
    return this.http.get(`/projects/${projectId}`);
  }
}
