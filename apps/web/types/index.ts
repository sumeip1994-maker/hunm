export type PresentationType =
  | "case_presentation"
  | "teaching_round"
  | "literature_review"
  | "guideline_review"
  | "academic_lecture"
  | "research_report"
  | "department_report"
  | "custom";

export type ProjectStatus = "draft" | "uploaded" | "analyzed" | "outline_ready" | "ppt_ready" | "reviewed";

export interface Project {
  id: number;
  title: string;
  presentation_type: PresentationType;
  audience: string;
  duration_minutes: number;
  core_question: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface DocumentItem {
  id: number;
  project_id: number;
  filename: string;
  original_filename: string;
  file_type: string;
  file_path: string;
  file_size: number;
  parsed_text: string;
  document_category: string;
  created_at: string;
}

export interface Artifact<T = Record<string, unknown>> {
  id: number;
  project_id: number;
  type: string;
  version: number;
  content_json: T;
  created_at: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
}

export interface LLMStatus {
  enabled: boolean;
  provider: string;
  provider_label: string;
  model: string;
  base_url: string;
  api_key_configured: boolean;
  providers: Record<string, LLMProvider>;
}

export interface LLMTestResult {
  ok: boolean;
  message: string;
  model: string;
  base_url: string;
}

export interface LLMConfigInput {
  api_key: string;
  provider: string;
  model: string;
  base_url?: string;
}

export interface LLMProvider {
  label: string;
  base_url: string;
  default_model: string;
  models: string[];
}
