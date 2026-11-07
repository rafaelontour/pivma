export type SessionAccessScope = {
  process_id: string;
  institution_id: string | null;
  laboratory_id: string | null;
  roles: string[];
};
