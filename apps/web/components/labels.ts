import type { PresentationType, ProjectStatus } from "@/types";

export const presentationTypeLabels: Record<PresentationType, string> = {
  case_presentation: "病例汇报",
  teaching_round: "教学查房",
  literature_review: "文献解读",
  guideline_review: "指南解读",
  academic_lecture: "学术讲座",
  research_report: "科研汇报",
  department_report: "科室汇报",
  custom: "自定义"
};

export const statusLabels: Record<ProjectStatus, string> = {
  draft: "草稿",
  uploaded: "已上传资料",
  analyzed: "已分析",
  outline_ready: "目录就绪",
  ppt_ready: "PPT就绪",
  reviewed: "已审稿"
};

export const typeOptions = Object.entries(presentationTypeLabels).map(([value, label]) => ({ value, label }));
