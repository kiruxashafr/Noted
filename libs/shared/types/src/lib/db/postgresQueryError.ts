// db.ts
export interface PostgresQueryError {
  code?: string;
  originalCode?: string;
  originalMessage?: string;
  constraint?: string | { fields?: string[] };
  fields?: string[];
  detail?: string;
}
