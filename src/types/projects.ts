export interface Project {
  id: string;
  name: string;
  entity_name?: string | null;
  billing_type?: string | null;
  user_id?: string;
  organization_id?: string;
  live?: boolean | null;
  archived?: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface ProjectCreateInput {
  name: string;
  entityName?: string;
}
