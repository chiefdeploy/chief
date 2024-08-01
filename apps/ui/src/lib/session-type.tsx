export interface Session {
  id: string;
  email: string;
  created_at: Date;
  instance_admin?: boolean;
  organizations: any[];
  organizations_created: any[];
  selected_org: string | null;
}
