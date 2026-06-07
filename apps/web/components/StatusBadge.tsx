import type { ProjectStatus } from "@/types";
import { statusLabels } from "./labels";

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const styles: Record<ProjectStatus, string> = {
    draft: "bg-slate-100 text-slate-700",
    uploaded: "bg-blue-50 text-blue-700",
    analyzed: "bg-cyan-50 text-cyan-700",
    outline_ready: "bg-amber-50 text-amber-700",
    ppt_ready: "bg-emerald-50 text-emerald-700",
    reviewed: "bg-indigo-50 text-indigo-700"
  };
  return <span className={`status ${styles[status]}`}>{statusLabels[status]}</span>;
}
