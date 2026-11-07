export type CollectionTemplateColumnType = "text" | "integer" | "decimal" | "date" | "select";

export type CollectionTemplateColumn = {
  id: string;
  key: string;
  label: string;
  type: CollectionTemplateColumnType;
  required: boolean;
  options: string[] | null;
  position: number;
};

export type CollectionTemplateSummary = {
  id: string;
  name: string;
  description: string | null;
  min_experiments: number;
  min_replicates: number;
  locked: boolean;
  created_at: string;
  updated_at: string | null;
};

export type CollectionTemplate = CollectionTemplateSummary & { columns: CollectionTemplateColumn[] };
export type CollectionTemplateInput = { name: string; description: string | null; min_experiments: number; min_replicates: number };
export type CollectionTemplateColumnInput = { key: string; label: string; type: CollectionTemplateColumnType; required: boolean; options: string[] | null; position?: number };
export type CollectionTemplateColumnPatch = Partial<CollectionTemplateColumnInput>;
export type CollectionTemplateColumnEditState = { key: string; label: string; type: CollectionTemplateColumnType; required: boolean; options: string };
export type CollectionTemplateMinimumFieldsProps = { minExperiments: string; minReplicates: string; setMinExperiments: (value: string) => void; setMinReplicates: (value: string) => void; disabled?: boolean };
export type CollectionTemplateRouteContext = { params: Promise<{ templateId: string }> };
export type CollectionTemplateColumnRouteContext = { params: Promise<{ templateId: string; columnId: string }> };
