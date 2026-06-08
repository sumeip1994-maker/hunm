import type { ApiResponse, Artifact, DocumentItem, LLMConfigInput, LLMStatus, LLMTestResult, Project } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...options?.headers
    }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "请求失败" }));
    throw new Error(error.detail || "请求失败");
  }
  const payload = (await response.json()) as ApiResponse<T>;
  return payload.data;
}

export const apiBaseUrl = API_BASE_URL;

export const api = {
  listProjects: () => request<Project[]>("/projects"),
  createProject: (data: Omit<Project, "id" | "status" | "created_at" | "updated_at">) =>
    request<Project>("/projects", { method: "POST", body: JSON.stringify(data) }),
  deleteProject: (id: number) => request<{ deleted: boolean }>(`/projects/${id}`, { method: "DELETE" }),
  getProject: (id: number) => request<Project>(`/projects/${id}`),
  listDocuments: (projectId: number) => request<DocumentItem[]>(`/projects/${projectId}/documents`),
  deleteDocument: (documentId: number) => request<{ deleted: boolean }>(`/documents/${documentId}`, { method: "DELETE" }),
  uploadDocument: (projectId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<DocumentItem>(`/projects/${projectId}/documents`, { method: "POST", body: formData });
  },
  listArtifacts: (projectId: number) => request<Artifact[]>(`/projects/${projectId}/artifacts`),
  runArtifact: <T>(projectId: number, action: string, query = "") =>
    request<Artifact<T>>(`/projects/${projectId}/${action}${query}`, { method: "POST" }),
  runWorkflow: (projectId: number, duration = 20) =>
    request<{ steps: { key: string; label: string }[]; ppt: { download_url: string; filename: string } }>(`/projects/${projectId}/workflow?duration=${duration}`, { method: "POST" }),
  generatePpt: (projectId: number) =>
    request<{ download_url: string; filename: string }>(`/projects/${projectId}/ppt`, { method: "POST" }),
  getLLMStatus: () => request<LLMStatus>("/integrations/llm/status"),
  saveLLMConfig: (data: LLMConfigInput) =>
    request<LLMStatus>("/integrations/llm/config", { method: "PUT", body: JSON.stringify(data) }),
  testLLM: () => request<LLMTestResult>("/integrations/llm/test", { method: "POST" })
};
