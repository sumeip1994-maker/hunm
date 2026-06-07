import { FileText } from "lucide-react";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
      <FileText className="mx-auto mb-3 h-8 w-8 text-slate-400" />
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}
